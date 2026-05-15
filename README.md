# APEX CITY 3D — GT Racing

Open-world 3D racing game built with Three.js. Features NOS boost, traffic AI, drift physics, night/rain mode, and full PWA support.

## Features
- 🏎 GT racing car with realistic drift physics
- 🔥 NOS boost system
- 🚗 Traffic AI with collision detection
- 🌙 Night mode with dynamic lighting
- 🌧 Rain mode with slippery roads
- 📱 Mobile-optimized with touch controls
- 📦 PWA — installable on home screen, works offline

## Performance Tiers

The game auto-detects your device and sets the quality tier:

| Tier | Devices | Grid | Traffic | Particles | Bloom |
|------|---------|------|---------|-----------|-------|
| LOW  | Old phones (Adreno 3xx, Mali-4xx) | 4×4 | 4 cars | Off | Off |
| MED  | Mid-range phones | 6×6 | 8 cars | Limited | Off |
| HIGH | Desktop/iPad Pro | 14×14 | 25 cars | Full | On |

FPS target: 30 on LOW, 60 on MED/HIGH.

## Controls

**Desktop**
- W/↑ — Accelerate
- S/↓ — Brake / Reverse
- A/D or ←/→ — Steer
- SPACE — Handbrake / Drift
- SHIFT — NOS Boost (hold)
- N — Toggle Night Mode
- R — Toggle Rain
- C — Cycle Camera

**Mobile**
- Left joystick — Steer + Accelerate/Brake
- DRIFT button — Handbrake
- NOS button — Boost

## Running Locally

```bash
# Any static file server works — the game uses ES modules
npx serve .
# or
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

## PWA Setup

The service worker at `sw.js` caches all game assets for offline play. The manifest at `manifest.json` enables "Add to Home Screen" on Android/iOS.

To enable full offline support, the game must be served over **HTTPS** (required for service workers). Use a hosting platform like Netlify, Vercel, or GitHub Pages.

## Icons

Icons are in `/icons/`. To regenerate:
```bash
python3 generate-icons.py   # requires Pillow: pip install Pillow
```

## File Structure

```
apex-city/
├── index.html          Main HTML + PWA meta tags
├── manifest.json       PWA manifest
├── sw.js               Service worker (offline cache)
├── styles/main.css     All CSS
├── icons/              PWA icons (192px, 512px)
└── src/
    ├── main.js         Entry point + event wiring
    ├── core/           Renderer, camera, game loop, config, event bus
    ├── world/          City generator, roads, lighting, weather
    ├── vehicles/       Player car, traffic, physics, factory
    ├── effects/        Particles, skidmarks, audio
    ├── gameplay/       Mission system
    ├── ui/             HUD, minimap, notifications, menus
    ├── input/          Keyboard + touch input manager
    └── utils/          Math, object pool, texture factory, debug
```
