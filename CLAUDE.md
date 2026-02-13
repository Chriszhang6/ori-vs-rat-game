# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rat Jump is a Doodle Jump-style endless vertical platformer game built with vanilla JavaScript, HTML5 Canvas, and CSS3. The player controls a mouse character that auto-bounces on platforms while climbing as high as possible, avoiding rat poison obstacles that fall from above. The game features a dynamic sky system that transitions through 8 themes based on climbing height (Dawn → Starry Night).

## Running the Game

The game is a static site with no build process. To run locally:

```bash
python3 -m http.server 8000
# Then visit http://localhost:8000
```

Or simply open `index.html` directly in a browser (though some browsers may have restrictions with local file:// URLs for canvas/audio).

## Architecture

### Entry Point

- **`index.html`** - Contains game canvas, inline CSS styling, and script reference to `game.js`

### Core Game Class (`game.js`)

The entire game logic is contained in the `PlatformerGame` class, which manages:

1. **Game State** - `gameStarted`, `gameOver`, `gamePaused`, `score`, `difficulty`, `maxLevelReached`
2. **Camera System** - Vertical-only camera that follows player upward (never goes down)
3. **Platform Generation** - Dynamic platform generation via `PlatformGenerator` class with type-based spawning (normal/moving/disappearing)
4. **Game Loop** - `updateMovement()` (60 FPS via setInterval) and `draw()` (requestAnimationFrame)
5. **Input** - Keyboard (arrow keys), touch controls, and device tilt (gyroscope) for mobile
6. **Physics** - Gravity-based auto-bounce on platforms, collision detection, screen wrapping
7. **Rendering** - Canvas 2D drawing with dynamic sky gradients, ambient particles, and visual effects
8. **Audio** - Web Audio API with synthesized sound effects (no external sound files)

### Key Classes

**PlatformGenerator**: Handles dynamic platform creation and management:
- Platform types: Normal (88%), Moving (8%), Disappearing (4%)
- Generates new platforms as player climbs upward
- Removes platforms that fall below camera view for performance
- Platform spacing: ~100px vertical distance with randomization

## Key Game Systems

**Scoring System**: Points based on:
- Height bonus: +100 points per meter reached
- Time score: +5 points per second survived
- Health bonus: +2 points per remaining HP on game over
- High score persisted to `localStorage` key `oriVsRatHighScore`

**Sky Theme System**: Dynamic background based on height climbed:
- 0m-300m: Dawn (warm orange/pink gradients)
- 300m-600m: Morning (fresh blue tones)
- 600m-1200m: Day (bright sky blue)
- 1200m-1800m: Dusk (golden sunset)
- 1800m-2400m: Sunset (red-orange glow)
- 2400m-3000m: Evening (purple-blue twilight)
- 3000m-4000m: Night (deep blue)
- 4000m+: Starry Night (twinkling stars)

**Camera System**: Vertical-only scrolling that follows player upward:
- Camera moves up when player reaches top 45% of screen
- Camera never moves down (falling means death)
- All game objects rendered relative to camera position

**Platform Physics**:
- Auto-bounce: Player automatically bounces when landing on platforms
- Bounce strength: -17 velocity (upward)
- Screen wrapping: Going off left edge appears on right edge
- Only bounces when falling downward onto platform

**Obstacles**: Rat poison sprites that:
- Spawn periodically based on difficulty level
- Fall from top of screen with random velocity
- Deal 10% HP damage on collision
- Removed when falling below screen

**Difficulty Scaling**: Dynamic difficulty based on height climbed:
- Level increases every 50 meters (max level 10)
- Increases obstacle spawn chance and speed
- Increases platform movement speed
- Ori enemy spawning (commented out/disabled in current version)

## Code Organization

The `PlatformerGame` class uses a monolithic structure with methods grouped by function:

- **Initialization**: `constructor()`, `initAudioContext()`, `showStartScreen()`
- **Game Flow**: `startGame()`, `startGameLoop()`, `restartGame()`, `togglePause()`
- **Input**: `setupControls()`, `setupTouchControls()`, `setupTiltControls()`
- **Physics**: `updateMovement()`, `updateCamera()`, `managePlatforms()`, `checkCollision()`
- **Rendering**: `draw()`, `drawScoreHUD()`, `drawHealthBar()`, `drawTouchControls()`, `drawPauseOverlay()`
- **Audio**: `playTone()`, `playSound()`, `playJumpSound()`
- **Utility**: `addScore()`, `updateHighScore()`, `finalizeScore()`

## Visual Effects

- Ambient particles (36 particles) with upward floating motion
- Score popups (floating text) when scoring events occur
- Health bar with color gradient (green → yellow → red as HP decreases)
- Platform gradients with shadows and highlights
- Vignette overlay effect for depth
- Cloud decorations (day themes) and twinkling stars (night theme)
- Touch control indicators on mobile devices

## Controls

### Desktop
- `←` Arrow Left - Move left
- `→` Arrow Right - Move right
- `ESC` or `P` - Pause/resume game

### Mobile
- Tap left side of screen - Move left
- Tap right side of screen - Move right
- Device tilt - Move left/right (gyroscope)
- Tap pause button (top-right) - Pause/resume

## Key Technical Details

- **Canvas size**: 450x800 pixels (portrait orientation)
- **Frame rate**: 60 FPS via setInterval for updates, requestAnimationFrame for rendering
- **Physics**: Custom implementation with gravity (0.6 per frame) and auto-bounce mechanics
- **Audio**: Synthesized tones using Web Audio API oscillators (no external audio files)
- **State persistence**: `localStorage` for high score only
- **No external dependencies**: Pure vanilla JavaScript
- **Platform pooling**: Dynamic creation/removal for memory efficiency

## Asset Loading

Images (`images/ori.jpeg`, `images/rat.jpeg`, `images/rat poison.png`) are loaded via `Image` objects with onload handlers. The start screen displays after all title images load successfully.
