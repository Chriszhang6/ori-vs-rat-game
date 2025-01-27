# Ori vs Mouse Game

A fun and challenging platformer game where a mouse tries to escape while avoiding Ori (the dog) and various obstacles.

## Game Features

- **Beautiful Interface**
  - Cute circular character designs
  - Colorful moving platforms
  - Smooth animations and visual effects
  - Cloud decorations and star effects
  - Health bar with heart icon

- **Gameplay Mechanics**
  - 7 levels of platforms (6 moving + 1 final platform)
  - One-step jumping system
  - Moving obstacles (rat poison)
  - Ori appears randomly to chase the mouse
  - Health system with visual feedback

- **Controls**
  - `←` Move left
  - `→` Move right
  - `SPACE` Jump one level up

- **Sound Effects**
  - Game start sound
  - Jump sound effect
  - Collision sounds
  - Victory and damage effects

## How to Play

1. Click the circular "Start" button to begin
2. Use arrow keys to move left/right
3. Press space to jump up one platform
4. Avoid rat poison (reduces 10% HP)
5. Dodge Ori who will knock you back
6. Reach the pink platform at the top to win

## Tips

- You can only jump one platform height at a time
- Stay on moving platforms to reach better positions
- Watch your health bar - it shows percentage and changes color
- Ori appears from the left side of platforms 4-6
- The final platform is longer and decorated with stars

## Technical Details

- Built with vanilla JavaScript
- Uses HTML5 Canvas for rendering
- Responsive design
- Sound system with preloading
- Smooth 60 FPS gameplay

## Installation

1. Clone the repository
2. Ensure all files are in the correct structure:
   ```
   ori-vs-rat-game/
   ├── index.html
   ├── game.js
   ├── images/
   │   ├── door.png
   │   ├── rat poison.png
   │   ├── ori.jpeg
   │   ├── rat.jpeg
   │   └── vs.png
   └── sounds/
       ├── game_start.wav
       ├── mouse_jump.wav
       ├── mouse_hurt.wav
       ├── tom_hit.wav
       └── mouse_win.wav
   ```
3. Open index.html in a web browser or use a local server:
   ```bash
   python3 -m http.server 8000
   ```
4. Visit `http://localhost:8000` in your browser

## Credits

- Game Design & Development: [Your Name]
- Character Images: Original artwork
- Sound Effects: Custom selection from free sound libraries

## License

This project is licensed under the MIT License - see the LICENSE file for details. 