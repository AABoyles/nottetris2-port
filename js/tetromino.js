import * as C from './constants.js';
import { getWorld, getRAPIER, createDynamicBody, ACTIVE_GROUP, SETTLED_GROUP, FLOOR_GROUP, WALL_GROUP } from './physics.js';

export class Tetromino {
    constructor(type, x, y) {
        this.type = type;
        this.color = C.COLORS[type];
        this.shape = C.SHAPES[type];
        this.body = null;
        this.colliders = [];
        this.isActive = true;
        this.settleTime = 0;
        this.hasCollided = false;

        this.createPhysicsBody(x, y);
    }

    createPhysicsBody(x, y) {
        const RAPIER = getRAPIER();
        const world = getWorld();

        this.body = createDynamicBody(x, y);

        // Create colliders for each block in the shape
        for (const block of this.shape) {
            const halfSize = (C.BLOCK_SIZE * block.w) / 2;
            const colliderDesc = RAPIER.ColliderDesc.cuboid(halfSize, halfSize)
                .setTranslation(block.x * C.BLOCK_SIZE, block.y * C.BLOCK_SIZE)
                .setRestitution(C.RESTITUTION)
                .setFriction(C.FRICTION)
                .setCollisionGroups((ACTIVE_GROUP << 16) | (SETTLED_GROUP | FLOOR_GROUP | WALL_GROUP))
                .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

            const collider = world.createCollider(colliderDesc, this.body);
            this.colliders.push(collider);
        }
    }

    applyHorizontalForce(direction) {
        if (!this.body || !this.isActive) return;
        const force = { x: direction * C.HORIZONTAL_FORCE, y: 0 };
        this.body.applyImpulse(force, true);
    }

    applyRotation(direction) {
        if (!this.body || !this.isActive) return;

        const currentAngVel = this.body.angvel();
        // Directly adjust angular velocity for responsive rotation
        const rotationSpeed = 0.15; // radians per second increment
        const newAngVel = currentAngVel + direction * rotationSpeed;

        // Clamp to max angular velocity
        const maxAngVel = 1.5; // max rotation speed
        const clampedAngVel = Math.max(-maxAngVel, Math.min(maxAngVel, newAngVel));
        this.body.setAngvel(clampedAngVel, true);
    }

    applySoftDrop() {
        if (!this.body || !this.isActive) return;
        this.body.applyImpulse({ x: 0, y: C.SOFT_DROP_FORCE }, true);
    }

    applyHardDrop() {
        if (!this.body || !this.isActive) return;
        this.body.applyImpulse({ x: 0, y: C.HARD_DROP_IMPULSE * this.body.mass() }, true);
    }

    settle() {
        if (!this.isActive) return;

        this.isActive = false;

        // Simply update collision groups in place - no need to recreate colliders
        const newGroups = (SETTLED_GROUP << 16) | (ACTIVE_GROUP | SETTLED_GROUP | FLOOR_GROUP | WALL_GROUP);

        for (const collider of this.colliders) {
            collider.setCollisionGroups(newGroups);
        }
    }

    getPosition() {
        if (!this.body) return { x: 0, y: 0 };
        return this.body.translation();
    }

    getRotation() {
        if (!this.body) return 0;
        return this.body.rotation();
    }

    getWorldVertices() {
        const pos = this.getPosition();
        const rot = this.getRotation();
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);

        const vertices = [];

        for (const block of this.shape) {
            const halfSize = (C.BLOCK_SIZE * block.w) / 2;
            const cx = block.x * C.BLOCK_SIZE;
            const cy = block.y * C.BLOCK_SIZE;

            // Four corners of each block
            const corners = [
                { x: cx - halfSize, y: cy - halfSize },
                { x: cx + halfSize, y: cy - halfSize },
                { x: cx + halfSize, y: cy + halfSize },
                { x: cx - halfSize, y: cy + halfSize }
            ];

            const worldCorners = corners.map(c => ({
                x: pos.x + c.x * cos - c.y * sin,
                y: pos.y + c.x * sin + c.y * cos
            }));

            vertices.push(worldCorners);
        }

        return vertices;
    }

    destroy() {
        const world = getWorld();
        if (this.body && world) {
            world.removeRigidBody(this.body);
        }
        this.body = null;
        this.colliders = [];
    }
}

export function createRandomTetromino() {
    const types = C.PIECE_TYPES;
    const type = types[Math.floor(Math.random() * types.length)];
    return new Tetromino(type, C.SPAWN_X, C.SPAWN_Y);
}

// Bag randomizer for better distribution
let bag = [];

export function getNextPieceType() {
    if (bag.length === 0) {
        bag = [...C.PIECE_TYPES];
        // Fisher-Yates shuffle
        for (let i = bag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [bag[i], bag[j]] = [bag[j], bag[i]];
        }
    }
    return bag.pop();
}

export function createTetrominoOfType(type) {
    return new Tetromino(type, C.SPAWN_X, C.SPAWN_Y);
}

export function createBagRandomTetromino() {
    const type = getNextPieceType();
    return new Tetromino(type, C.SPAWN_X, C.SPAWN_Y);
}

export function resetBag() {
    bag = [];
}
