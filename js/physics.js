import * as C from './constants.js';

let RAPIER = null;
let world = null;
let eventQueue = null;

// Collision groups
export const WALL_GROUP = 0x0001;
export const ACTIVE_GROUP = 0x0002;
export const SETTLED_GROUP = 0x0004;
export const FLOOR_GROUP = 0x0008;

export async function initPhysics(rapierModule) {
    RAPIER = rapierModule;
    await RAPIER.init();
    createWorld();
    return { world, RAPIER };
}

function createWorld() {
    const gravity = { x: 0.0, y: C.GRAVITY };
    world = new RAPIER.World(gravity);

    // Configure integration parameters for better collision detection (if API available)
    try {
        if (world.integrationParameters) {
            world.integrationParameters.dt = 1 / 60;
            world.integrationParameters.numSolverIterations = 8;
        }
    } catch (e) {
        console.warn('Could not configure integration parameters:', e);
    }

    eventQueue = new RAPIER.EventQueue(true);

    createWalls();
}

function createWalls() {
    const halfWidth = C.CANVAS_WIDTH / 2;
    const halfHeight = C.CANVAS_HEIGHT / 2;
    const wallThickness = 50;

    // All walls should collide with both active and settled pieces
    const wallCollisionGroups = (WALL_GROUP << 16) | (ACTIVE_GROUP | SETTLED_GROUP);
    const floorCollisionGroups = (FLOOR_GROUP << 16) | (ACTIVE_GROUP | SETTLED_GROUP);

    // Left wall
    const leftWallBody = world.createRigidBody(
        RAPIER.RigidBodyDesc.fixed().setTranslation(-wallThickness / 2, halfHeight)
    );
    world.createCollider(
        RAPIER.ColliderDesc.cuboid(wallThickness / 2, halfHeight + 200)
            .setCollisionGroups(wallCollisionGroups)
            .setFriction(1.0)
            .setRestitution(0.0),
        leftWallBody
    );

    // Right wall
    const rightWallBody = world.createRigidBody(
        RAPIER.RigidBodyDesc.fixed().setTranslation(C.CANVAS_WIDTH + wallThickness / 2, halfHeight)
    );
    world.createCollider(
        RAPIER.ColliderDesc.cuboid(wallThickness / 2, halfHeight + 200)
            .setCollisionGroups(wallCollisionGroups)
            .setFriction(1.0)
            .setRestitution(0.0),
        rightWallBody
    );

    // Floor
    const floorThickness = 100;
    const floorBody = world.createRigidBody(
        RAPIER.RigidBodyDesc.fixed().setTranslation(halfWidth, C.CANVAS_HEIGHT + floorThickness / 2)
    );
    world.createCollider(
        RAPIER.ColliderDesc.cuboid(halfWidth + wallThickness, floorThickness / 2)
            .setCollisionGroups(floorCollisionGroups)
            .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
            .setFriction(1.0)
            .setRestitution(0.0),
        floorBody
    );
}

export function stepWorld(deltaTime = 16.67) {
    if (world) {
        // Use fixed timestep with substeps for stable physics
        const fixedStep = 1 / 60;
        const numSubsteps = Math.min(Math.ceil(deltaTime / 1000 / fixedStep), 4);

        for (let i = 0; i < numSubsteps; i++) {
            world.step(eventQueue);
        }
    }
}

export function getWorld() {
    return world;
}

export function getRAPIER() {
    return RAPIER;
}

export function getEventQueue() {
    return eventQueue;
}

export function setGravity(newGravity) {
    if (world) {
        world.gravity = { x: 0, y: newGravity };
    }
}

export function resetWorld() {
    if (world) {
        world.free();
    }
    createWorld();
}

export function createDynamicBody(x, y) {
    return world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(x, y)
            .setLinearDamping(C.LINEAR_DAMPING)
            .setAngularDamping(C.ANGULAR_DAMPING)
            .setCcdEnabled(true)
    );
}

export function createCollider(body, shape, options = {}) {
    const desc = shape;
    desc.setRestitution(options.restitution ?? C.RESTITUTION);
    desc.setFriction(options.friction ?? C.FRICTION);

    if (options.collisionGroups !== undefined) {
        desc.setCollisionGroups(options.collisionGroups);
    }
    if (options.activeEvents !== undefined) {
        desc.setActiveEvents(options.activeEvents);
    }

    return world.createCollider(desc, body);
}
