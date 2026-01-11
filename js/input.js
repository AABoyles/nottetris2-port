const keys = {
    left: false,
    right: false,
    down: false,
    rotateLeft: false,
    rotateRight: false,
    hardDrop: false,
    pause: false,
    enter: false
};

const keysPressedThisFrame = {
    hardDrop: false,
    pause: false,
    enter: false
};

export function initInput() {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
}

export function cleanupInput() {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
}

function handleKeyDown(e) {
    switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
            keys.left = true;
            e.preventDefault();
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.right = true;
            e.preventDefault();
            break;
        case 'ArrowDown':
        case 'KeyS':
            keys.down = true;
            e.preventDefault();
            break;
        case 'ArrowUp':
        case 'KeyZ':
            keys.rotateLeft = true;
            e.preventDefault();
            break;
        case 'KeyX':
            keys.rotateRight = true;
            e.preventDefault();
            break;
        case 'Space':
            if (!keys.hardDrop) {
                keys.hardDrop = true;
                keysPressedThisFrame.hardDrop = true;
            }
            e.preventDefault();
            break;
        case 'KeyP':
        case 'Escape':
            if (!keys.pause) {
                keys.pause = true;
                keysPressedThisFrame.pause = true;
            }
            e.preventDefault();
            break;
        case 'Enter':
            if (!keys.enter) {
                keys.enter = true;
                keysPressedThisFrame.enter = true;
            }
            e.preventDefault();
            break;
    }
}

function handleKeyUp(e) {
    switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
            keys.left = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.right = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            keys.down = false;
            break;
        case 'ArrowUp':
        case 'KeyZ':
            keys.rotateLeft = false;
            break;
        case 'KeyX':
            keys.rotateRight = false;
            break;
        case 'Space':
            keys.hardDrop = false;
            break;
        case 'KeyP':
        case 'Escape':
            keys.pause = false;
            break;
        case 'Enter':
            keys.enter = false;
            break;
    }
}

export function isKeyDown(key) {
    return keys[key] || false;
}

export function wasKeyPressed(key) {
    const pressed = keysPressedThisFrame[key] || false;
    keysPressedThisFrame[key] = false;
    return pressed;
}

export function clearPressedKeys() {
    for (const key in keysPressedThisFrame) {
        keysPressedThisFrame[key] = false;
    }
}

export function getInputState() {
    return { ...keys };
}
