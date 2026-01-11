import * as C from './constants.js';
import { getWorld, getRAPIER, SETTLED_GROUP, ACTIVE_GROUP, FLOOR_GROUP, WALL_GROUP } from './physics.js';

// Calculate the area coverage of a horizontal line
export function calculateLineCoverage(settledPieces, lineY) {
    const lineTop = lineY;
    const lineBottom = lineY + C.BLOCK_SIZE;
    let totalCoverage = 0;

    for (const piece of settledPieces) {
        const blockVertices = piece.getWorldVertices();

        for (const vertices of blockVertices) {
            // Clip the block polygon to the line
            const clipped = clipPolygonToLine(vertices, lineTop, lineBottom);
            if (clipped.length >= 3) {
                totalCoverage += polygonArea(clipped);
            }
        }
    }

    const lineArea = C.CANVAS_WIDTH * C.BLOCK_SIZE;
    return totalCoverage / lineArea;
}

// Check all lines and return indices of lines that should be cleared
export function checkLines(settledPieces) {
    const linesToClear = [];

    for (let i = 0; i < C.BOARD_HEIGHT; i++) {
        const lineY = i * C.BLOCK_SIZE;
        const coverage = calculateLineCoverage(settledPieces, lineY);

        if (coverage >= C.LINE_CLEAR_THRESHOLD) {
            linesToClear.push(i);
        }
    }

    return linesToClear;
}

// Clip polygon to horizontal band between lineTop and lineBottom
function clipPolygonToLine(vertices, lineTop, lineBottom) {
    // First clip to top edge
    let result = clipPolygonToHorizontal(vertices, lineTop, true);
    // Then clip to bottom edge
    result = clipPolygonToHorizontal(result, lineBottom, false);
    return result;
}

// Sutherland-Hodgman clipping for horizontal line
function clipPolygonToHorizontal(vertices, y, clipAbove) {
    if (vertices.length === 0) return [];

    const result = [];

    for (let i = 0; i < vertices.length; i++) {
        const current = vertices[i];
        const next = vertices[(i + 1) % vertices.length];

        const currentInside = clipAbove ? current.y >= y : current.y <= y;
        const nextInside = clipAbove ? next.y >= y : next.y <= y;

        if (currentInside) {
            result.push(current);
        }

        if (currentInside !== nextInside) {
            // Edge crosses the line, compute intersection
            const t = (y - current.y) / (next.y - current.y);
            result.push({
                x: current.x + t * (next.x - current.x),
                y: y
            });
        }
    }

    return result;
}

// Calculate polygon area using shoelace formula
function polygonArea(vertices) {
    if (vertices.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < vertices.length; i++) {
        const j = (i + 1) % vertices.length;
        area += vertices[i].x * vertices[j].y;
        area -= vertices[j].x * vertices[i].y;
    }

    return Math.abs(area) / 2;
}

// Clear lines and slice pieces
export function clearLines(settledPieces, lineIndices) {
    const RAPIER = getRAPIER();
    const world = getWorld();
    const newPieces = [];
    const piecesToRemove = [];

    for (const piece of settledPieces) {
        const sliceResult = slicePieceAtLines(piece, lineIndices);

        if (sliceResult.shouldRemove) {
            piecesToRemove.push(piece);
        }

        for (const newPieceData of sliceResult.newPieces) {
            const newPiece = createPieceFromVertices(newPieceData.vertices, newPieceData.color, piece.getPosition(), piece.getRotation());
            if (newPiece) {
                newPieces.push(newPiece);
            }
        }
    }

    // Destroy pieces marked for removal
    for (const piece of piecesToRemove) {
        piece.destroy();
    }

    // Return pieces that weren't removed, plus new sliced pieces
    const remainingPieces = settledPieces.filter(p => !piecesToRemove.includes(p));
    return [...remainingPieces, ...newPieces];
}

// Slice a piece at the given line indices
function slicePieceAtLines(piece, lineIndices) {
    const result = {
        shouldRemove: false,
        newPieces: []
    };

    const blockVertices = piece.getWorldVertices();
    let hasBlocksInClearedLines = false;
    const allRemainingParts = [];

    // First pass: check if this piece intersects any cleared lines
    for (const vertices of blockVertices) {
        let remainingParts = [vertices];

        for (const lineIndex of lineIndices) {
            const lineTop = lineIndex * C.BLOCK_SIZE;
            const lineBottom = lineTop + C.BLOCK_SIZE;

            const newRemainingParts = [];

            for (const part of remainingParts) {
                // Check if this part is in the cleared line
                const inLine = clipPolygonToLine(part, lineTop, lineBottom);
                if (polygonArea(inLine) > 1) {
                    hasBlocksInClearedLines = true;
                }

                // Get part above the line
                const above = clipPolygonToHorizontal(part, lineTop, false);
                // Get part below the line
                const below = clipPolygonToHorizontal(part, lineBottom, true);

                if (above.length >= 3 && polygonArea(above) > 10) {
                    newRemainingParts.push(above);
                }
                if (below.length >= 3 && polygonArea(below) > 10) {
                    newRemainingParts.push(below);
                }
            }

            remainingParts = newRemainingParts;
        }

        // Collect remaining parts for this block
        for (const part of remainingParts) {
            if (part.length >= 3 && polygonArea(part) > 50) {
                allRemainingParts.push({
                    vertices: part,
                    color: piece.color
                });
            }
        }
    }

    // Only create new pieces if this piece was actually affected by line clears
    if (hasBlocksInClearedLines) {
        result.shouldRemove = true;
        result.newPieces = allRemainingParts;
    }
    // If piece wasn't affected, shouldRemove stays false and newPieces stays empty
    // The original piece will be kept as-is

    return result;
}

// Create a new physics piece from arbitrary vertices
function createPieceFromVertices(vertices, color, originalPos, originalRot) {
    if (vertices.length < 3) return null;

    const RAPIER = getRAPIER();
    const world = getWorld();

    // Calculate centroid of the polygon
    const centroid = calculateCentroid(vertices);

    // Create rigid body at centroid
    const body = world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(centroid.x, centroid.y)
            .setLinearDamping(C.LINEAR_DAMPING)
            .setAngularDamping(C.ANGULAR_DAMPING)
    );

    // Convert vertices to local coordinates (relative to centroid)
    const localVertices = vertices.map(v => ({
        x: v.x - centroid.x,
        y: v.y - centroid.y
    }));

    // Try to create a convex hull collider
    const flatVertices = new Float32Array(localVertices.length * 2);
    for (let i = 0; i < localVertices.length; i++) {
        flatVertices[i * 2] = localVertices[i].x;
        flatVertices[i * 2 + 1] = localVertices[i].y;
    }

    try {
        const colliderDesc = RAPIER.ColliderDesc.convexHull(flatVertices);
        if (colliderDesc) {
            colliderDesc
                .setRestitution(C.RESTITUTION)
                .setFriction(C.FRICTION)
                .setCollisionGroups((SETTLED_GROUP << 16) | (ACTIVE_GROUP | SETTLED_GROUP | FLOOR_GROUP | WALL_GROUP));

            world.createCollider(colliderDesc, body);

            // Return a fragment object
            return {
                body: body,
                color: color,
                vertices: localVertices,
                isFragment: true,
                isActive: false,
                getPosition: function() { return this.body.translation(); },
                getRotation: function() { return this.body.rotation(); },
                getWorldVertices: function() {
                    const pos = this.getPosition();
                    const rot = this.getRotation();
                    const cos = Math.cos(rot);
                    const sin = Math.sin(rot);

                    const worldVerts = this.vertices.map(v => ({
                        x: pos.x + v.x * cos - v.y * sin,
                        y: pos.y + v.x * sin + v.y * cos
                    }));

                    return [worldVerts];
                },
                destroy: function() {
                    if (this.body && world) {
                        world.removeRigidBody(this.body);
                    }
                    this.body = null;
                }
            };
        }
    } catch (e) {
        // If convex hull fails, try using a simpler shape
        console.warn('Convex hull creation failed, skipping fragment');
    }

    // Clean up if collider creation failed
    world.removeRigidBody(body);
    return null;
}

function calculateCentroid(vertices) {
    let cx = 0, cy = 0;
    for (const v of vertices) {
        cx += v.x;
        cy += v.y;
    }
    return { x: cx / vertices.length, y: cy / vertices.length };
}

// Calculate score for cleared lines
export function calculateScore(numLines, coverage) {
    if (numLines === 0) return 0;

    // Base score similar to original: more lines = exponentially more points
    const baseScore = Math.pow(numLines, 2) * 100;

    // Bonus for higher coverage
    const coverageBonus = Math.floor(coverage * 50);

    return baseScore + coverageBonus;
}
