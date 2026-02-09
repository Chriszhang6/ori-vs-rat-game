# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser-based platformer game built with vanilla JavaScript, HTML5 Canvas, and CSS3. The player controls a mouse character trying to escape while avoiding Ori (the dog) and rat poison obstacles across 7 platform levels.

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

1. **Game State** - `gameStarted`, `gameWon`, `gameOver`, `score`, `difficulty`
2. **Game Objects** - `platforms`, `rat` (player), `obstacles`, `oris`, `exit`
3. **Game Loop** - `update()` and `draw()` called via `requestAnimationFrame` at 60 FPS
4. **Input** - Keyboard event listeners for arrow keys and spacebar
5. **Physics** - Custom gravity, collision detection, and platform movement
6. **Rendering** - Canvas 2D drawing with gradients, shadows, and effects
7. **Audio** - Web Audio API with synthesized sound effects (no external sound files)

### Key Game Systems

**Scoring System**: Points awarded per second survived, with time bonus and health bonus on win. High score persisted to `localStorage`.

**Difficulty System**: Dynamic scaling that increases obstacle spawn rate, obstacle speed, and Ori's speed as the player survives longer.

**Platform System**: 7 levels total - 6 moving platforms (horizontal oscillation) + 1 final exit platform. Player can only jump one platform level at a time.

**Obstacles**: Rat poison sprites that spawn on platforms and move horizontally. Collision reduces HP by 10%.

**Ori (Enemy)**: Spawns randomly on platforms 4-6 and chases the player, dealing knockback on contact.

### Visual Effects

- Ambient particles (36 particles) rendered as background decoration
- Score popups (floating text) when events occur
- Health bar with color gradient (green → red as HP decreases)
- Platform gradients and shadows
- Vignette overlay effect

### Asset Loading

Images (`images/ori.jpeg`, `images/rat.jpeg`, `images/rat poison.png`, `images/door.png`) are loaded via `Image` objects with onload handlers before the start screen is displayed.

## Code Organization

The `PlatformerGame` class uses a monolithic structure with methods grouped by function:

- Initialization: `constructor()`, `initGame()`, `initAudioContext()`
- Game flow: `startGame()`, `gameLoop()`, `showStartScreen()`, `showGameOverScreen()`
- Input handling: `handleKeyDown()`, `handleKeyUp()`
- Physics: `updateMovement()`, `checkCollisions()`, `updateObstacles()`, `updateOris()`
- Rendering: `draw()`, `drawStartScreen()`, `drawGame()`, `drawGameOverScreen()`
- Audio: `playTone()`, `playSound()`, `playJumpSound()`

## Key Technical Details

- **Canvas size**: 800x600 pixels
- **Frame rate**: 60 FPS via `requestAnimationFrame`
- **Physics**: Custom implementation with gravity and collision detection
- **Audio**: Synthesized tones using Web Audio API oscillators (no external audio files)
- **State persistence**: `localStorage` for high score only
- **No external dependencies**: Pure vanilla JavaScript
