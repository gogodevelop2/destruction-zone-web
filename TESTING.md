# Testing Guide - Identifying Errors

## Quick Test Instructions

### Test 1: Module Loading
**URL**: `http://localhost:3000/test-game.html`

**Expected Output**:
```
✓ Matter.js loaded: true
✓ PixiJS loaded: true
Loading Game module...
✓ Game module loaded
Creating Game instance...
✓ Game instance created
✅ ALL TESTS PASSED - No initialization errors detected
```

**If Failed**: Check browser console (F12) for import errors

---

### Test 2: Minimal Rendering
**URL**: `http://localhost:3000/test-minimal.html`

**Expected Output**: Green log messages ending with "✅ ALL TESTS PASSED!"
**Expected Visual**: A cyan tank rendered on black canvas

**If Failed**: Check which step fails in the log

---

### Test 3: Full Game (Debug Mode)
**URL**: `http://localhost:3000/index-debug.html`

**Expected Behavior**:
- Black canvas with cyan grid
- 6 tanks visible (2 active, 4 disabled)
- Tank stat panels show HP/WPN gauges
- Player tank (Tank 1) responds to arrow keys
- Spacebar fires projectiles
- AI tanks move and fire

**If Failed**: Check red error log box in bottom right corner

---

### Test 4: Original Prototype (Baseline)
**URL**: `http://localhost:3000/prototype.html`

**Expected Behavior**: Same as Test 3 (this is the working version)

**Purpose**: Verify that prototype still works, establishing baseline

---

## Console Commands for Debugging

Open browser console (F12) and run:

### Check if libraries loaded:
```javascript
console.log('Matter:', typeof Matter !== 'undefined');
console.log('PIXI:', typeof PIXI !== 'undefined');
```

### Check if PixiJS initialized:
```javascript
console.log('PixiJS App:', document.getElementById('pixiContainer').children.length);
```

### Check if game object exists:
```javascript
console.log('Game running:', typeof game !== 'undefined');
```

### Force show debug info:
```javascript
document.getElementById('debugInfo').style.display = 'block';
```

---

## Common Error Patterns

### Error 1: "Cannot read property 'x' of undefined"
**Likely Cause**: Object not initialized before use
**Check**: Init sequence in Game.js

### Error 2: "Module not found"
**Likely Cause**: Import path incorrect
**Check**: Relative paths in import statements

### Error 3: "Vector is not defined"
**Likely Cause**: Matter.js destructuring issue
**Check**: `const { Vector } = this.Matter;` lines

### Error 4: "Cannot set property of null"
**Likely Cause**: DOM element not found
**Check**: Element IDs in HTML match JavaScript queries

### Error 5: "PixiJS canvas not appearing"
**Likely Cause**: CSS z-index or positioning issue
**Check**: CSS for #pixiContainer

---

## Files to Check If Errors Found

**Module Loading Errors**: Check all `import` statements
**Physics Errors**: Check `js/entities/Tank.js`, `js/entities/Projectile.js`
**Rendering Errors**: Check `js/core/Renderer.js`, `js/core/particles.js`
**System Errors**: Check files in `js/systems/`
**UI Errors**: Check `js/ui/hud.js`, `index.html`, `css/main.css`

---

## Expected Console Output (Normal Operation)

```
🚀 Starting Destruction Zone...
✅ PixiJS initialized (projectile + particle layers)
✅ Game initialized
✅ Game started!
```

Then during gameplay:
```
TANK 1 switched to MISSILE
Hit! Damage: 4 Weapon: MISSILE Tank: TANK 2 Health: 96
Projectile hit wall
TANK 2 destroyed!
```

---

## Browser Testing Checklist

- [ ] Libraries (Matter.js, PixiJS) load without errors
- [ ] All modules import successfully
- [ ] Game instance creates without errors
- [ ] Canvas renders (black background + cyan grid)
- [ ] PixiJS canvas overlays correctly
- [ ] 6 tanks appear on screen (2 active, 4 disabled)
- [ ] Tank stat panels show on left/right sides
- [ ] Player tank (cyan, top-left) responds to arrow keys
- [ ] Player tank rotates with Left/Right arrows
- [ ] Player tank thrusts forward with Up arrow
- [ ] Spacebar fires projectiles
- [ ] Projectiles appear as yellow circles
- [ ] Projectiles damage tanks on hit
- [ ] HP gauges decrease when tanks hit
- [ ] Particles appear on collision
- [ ] AI tank (orange, bottom-right) moves
- [ ] AI tank fires at player
- [ ] Weapon switching (1, 2, 3 keys) works
- [ ] Tank explosion effect when health reaches 0

---

## What to Report

If you find errors, please provide:

1. **Which test failed** (Test 1, 2, 3, or 4?)
2. **Error message** (exact text from console or red error box)
3. **Line number** (if provided in error)
4. **What you see** (blank screen? partial render? crashed?)

Example good error report:
> Test 3 failed. Red error box shows: "ERROR: Cannot read property 'createGraphics' of undefined at Projectile.js:74:37". Canvas is black but no tanks visible.

---

## Quick Fix Commands

If you need to restart the HTTP server:
```bash
# Kill existing server
lsof -ti:3000 | xargs kill

# Start new server
cd /Users/joejeon/Documents/develop/destruction-zone-web
python3 -m http.server 3000
```

Then reload the page in browser.
