// ============================================
// Debug Manager - Centralized Debug System
// ============================================
// Press 'D' key to toggle debug visualization
//
// Shows:
// - Navmesh triangles (red wireframe)
// - LOS lines (green = clear, red = blocked)
// - Tank centers (red dots)

/**
 * Global Debug Manager
 * Centralized debug state management
 */
class DebugManager {
    constructor() {
        this.enabled = false;
        this.setupKeyboardShortcut();
    }

    /**
     * Setup keyboard shortcut (D key)
     */
    setupKeyboardShortcut() {
        window.addEventListener('keydown', (e) => {
            // Check for 'D' key (without modifiers)
            if ((e.key === 'd' || e.key === 'D') && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                this.toggle();
                e.preventDefault(); // Prevent default behavior
            }
        });
    }

    /**
     * Toggle debug mode
     */
    toggle() {
        this.enabled = !this.enabled;
        console.log(`[Debug] Mode: ${this.enabled ? 'ON' : 'OFF'}`);

        if (this.enabled) {
            console.log('  ✅ Navmesh triangles');
            console.log('  ✅ LOS lines (green=clear, red=blocked)');
            console.log('  ✅ Tank centers');
        }
    }

    /**
     * Check if debug mode is enabled
     */
    isEnabled() {
        return this.enabled;
    }
}

// Create singleton instance
export const debugManager = new DebugManager();
