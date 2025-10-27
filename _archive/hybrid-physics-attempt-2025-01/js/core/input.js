// Input Manager
// Handles keyboard and mouse input

class InputManager {
    constructor() {
        this.keys = new Map();
        this.previousKeys = new Map();
        this.mousePosition = { x: 0, y: 0 };
        this.mouseButtons = new Map();
        
        console.log('⌨️ Input Manager initialized');
    }
    
    update() {
        // Update previous key states at the END of frame
        // This method should be called AFTER all input processing
        this.previousKeys.clear();
        for (const [key, value] of this.keys) {
            this.previousKeys.set(key, value);
        }
    }
    
    setKeyDown(keyCode) {
        this.keys.set(keyCode, true);
    }
    
    setKeyUp(keyCode) {
        this.keys.set(keyCode, false);
    }
    
    isKeyPressed(keyCode) {
        return this.keys.get(keyCode) || false;
    }
    
    isKeyJustPressed(keyCode) {
        const isPressed = (this.keys.get(keyCode) || false) && !(this.previousKeys.get(keyCode) || false);
        if (isPressed) {
            console.log(`⚡ Key just pressed: ${keyCode}`);
        }
        return isPressed;
    }
    
    isKeyJustReleased(keyCode) {
        return !(this.keys.get(keyCode) || false) && (this.previousKeys.get(keyCode) || false);
    }
    
    setMousePosition(x, y) {
        this.mousePosition.x = x;
        this.mousePosition.y = y;
    }
    
    setMouseButton(button, pressed) {
        this.mouseButtons.set(button, pressed);
    }
    
    isMouseButtonPressed(button) {
        return this.mouseButtons.get(button) || false;
    }
    
    getMousePosition() {
        return { ...this.mousePosition };
    }
    
    // Key mapping utilities
    static getKeyName(keyCode) {
        const keyMap = {
            'ArrowUp': 'UP',
            'ArrowDown': 'DOWN',
            'ArrowLeft': 'LEFT',
            'ArrowRight': 'RIGHT',
            'Space': 'SPACE',
            'Enter': 'ENTER',
            'Escape': 'ESCAPE',
            'KeyW': 'W',
            'KeyA': 'A',
            'KeyS': 'S',
            'KeyD': 'D',
            'KeyQ': 'Q',
            'KeyE': 'E',
            'KeyX': 'X',
            'KeyP': 'P',
            'KeyL': 'L',
            'KeyO': 'O',
            'Home': 'HOME',
            'PageUp': 'PAGE_UP'
        };
        
        return keyMap[keyCode] || keyCode;
    }
}