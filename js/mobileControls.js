// Mobile touch controls for the game
// Creates on-screen D-pad and button controls for mobile devices

let isMobile = false;
let controlsContainer = null;
let dpad = null;
let buttons = null;
let forceMobile = false;

// Touch state
const touchState = {
    left: false,
    right: false,
    down: false,
    rotateLeft: false,
    rotateRight: false,
    hardDrop: false,
    pause: false
};

// Callback to update game input state
let inputCallback = null;

export function isMobileDevice() {
    return isMobile;
}

export function setForceMobile(force) {
    forceMobile = force;
}

export function detectMobile() {
    if (forceMobile) {
        isMobile = true;
        return true;
    }
    
    // Check for touch support and mobile characteristics
    const hasTouchScreen = ('ontouchstart' in window) || 
                          (navigator.maxTouchPoints > 0) || 
                          (navigator.msMaxTouchPoints > 0);
    
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Also check screen size - consider devices under 768px as mobile
    const isSmallScreen = window.innerWidth <= 768;
    
    // Show controls if touch screen OR (mobile UA and small screen)
    isMobile = hasTouchScreen || (isMobileUA && isSmallScreen);
    return isMobile;
}

export function initMobileControls(callback) {
    detectMobile();
    
    if (!isMobile) {
        console.log('Not a mobile device, skipping mobile controls');
        return;
    }
    
    inputCallback = callback;
    
    console.log('Initializing mobile controls...');
    
    // Create controls container
    controlsContainer = document.createElement('div');
    controlsContainer.id = 'mobileControls';
    controlsContainer.className = 'mobile-controls';
    
    // Create D-pad
    dpad = createDPad();
    controlsContainer.appendChild(dpad);
    
    // Create button pad
    buttons = createButtonPad();
    controlsContainer.appendChild(buttons);
    
    // Add to document
    document.body.appendChild(controlsContainer);
    
    console.log('Mobile controls initialized');
}

export function cleanupMobileControls() {
    if (controlsContainer && controlsContainer.parentNode) {
        controlsContainer.parentNode.removeChild(controlsContainer);
    }
    controlsContainer = null;
    dpad = null;
    buttons = null;
}

function createDPad() {
    const container = document.createElement('div');
    container.className = 'dpad-container';
    
    // Create D-pad buttons
    const directions = [
        { name: 'up', class: 'dpad-up', label: '▲', key: 'rotateLeft' },  // Up also rotates left
        { name: 'down', class: 'dpad-down', label: '▼', key: 'down' },
        { name: 'left', class: 'dpad-left', label: '◀', key: 'left' },
        { name: 'right', class: 'dpad-right', label: '▶', key: 'right' }
    ];
    
    directions.forEach(dir => {
        const button = document.createElement('div');
        button.className = `dpad-button ${dir.class}`;
        button.textContent = dir.label;
        button.dataset.key = dir.key;
        
        // Add touch event listeners
        button.addEventListener('touchstart', handleDPadTouchStart, { passive: false });
        button.addEventListener('touchend', handleDPadTouchEnd, { passive: false });
        button.addEventListener('touchcancel', handleDPadTouchEnd, { passive: false });
        
        // Add mouse event listeners as fallback for testing
        button.addEventListener('mousedown', handleDPadTouchStart, { passive: false });
        button.addEventListener('mouseup', handleDPadTouchEnd, { passive: false });
        button.addEventListener('mouseleave', handleDPadTouchEnd, { passive: false });
        
        container.appendChild(button);
    });
    
    // Add center piece for aesthetics
    const center = document.createElement('div');
    center.className = 'dpad-center';
    container.appendChild(center);
    
    return container;
}

function createButtonPad() {
    const container = document.createElement('div');
    container.className = 'button-pad-container';
    
    // Create buttons in Nintendo style layout
    const buttonConfigs = [
        { name: 'Y', class: 'btn-y', label: 'Y', action: 'rotateLeft' },
        { name: 'X', class: 'btn-x', label: 'X', action: 'rotateRight' },
        { name: 'B', class: 'btn-b', label: 'B', action: 'hardDrop' },
        { name: 'A', class: 'btn-a', label: 'A', action: 'pause' }
    ];
    
    buttonConfigs.forEach(btn => {
        const button = document.createElement('div');
        button.className = `action-button ${btn.class}`;
        button.textContent = btn.label;
        button.dataset.action = btn.action;
        
        // Add touch event listeners
        button.addEventListener('touchstart', handleButtonTouchStart, { passive: false });
        button.addEventListener('touchend', handleButtonTouchEnd, { passive: false });
        button.addEventListener('touchcancel', handleButtonTouchEnd, { passive: false });
        
        // Add mouse event listeners as fallback for testing
        button.addEventListener('mousedown', handleButtonTouchStart, { passive: false });
        button.addEventListener('mouseup', handleButtonTouchEnd, { passive: false });
        button.addEventListener('mouseleave', handleButtonTouchEnd, { passive: false });
        
        container.appendChild(button);
    });
    
    return container;
}

function handleDPadTouchStart(e) {
    e.preventDefault();
    const key = e.currentTarget.dataset.key;
    
    if (key) {
        touchState[key] = true;
        e.currentTarget.classList.add('active');
        
        if (inputCallback) {
            inputCallback(key, true);
        }
    }
}

function handleDPadTouchEnd(e) {
    e.preventDefault();
    const key = e.currentTarget.dataset.key;
    
    if (key) {
        touchState[key] = false;
        e.currentTarget.classList.remove('active');
        
        if (inputCallback) {
            inputCallback(key, false);
        }
    }
}

function handleButtonTouchStart(e) {
    e.preventDefault();
    const action = e.currentTarget.dataset.action;
    
    if (action) {
        touchState[action] = true;
        e.currentTarget.classList.add('active');
        
        if (inputCallback) {
            inputCallback(action, true);
        }
    }
}

function handleButtonTouchEnd(e) {
    e.preventDefault();
    const action = e.currentTarget.dataset.action;
    
    if (action) {
        touchState[action] = false;
        e.currentTarget.classList.remove('active');
        
        if (inputCallback) {
            inputCallback(action, false);
        }
    }
}

export function getTouchState() {
    return { ...touchState };
}
