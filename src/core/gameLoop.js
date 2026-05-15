// ─── GAME LOOP ────────────────────────────────────────────────────────────
import { Config } from './config.js';

const MAX_DELTA = 0.05;

export class GameLoop {
  constructor(renderer, scene, camera, composer) {
    this._renderer  = renderer;
    this._scene     = scene;
    this._camera    = camera;
    this._composer  = composer;
    this._clock     = new THREE.Clock();
    this._running   = false;
    this._systems   = [];
    this._rafId     = null;

    // Frame throttling for LOW tier (target 30fps)
    this._targetInterval = 1000 / Config.RENDERER.TARGET_FPS;
    this._lastFrame = 0;
    this._throttle  = Config.RENDERER.TARGET_FPS < 60;
  }

  register(system) {
    this._systems.push(system);
    return this;
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._clock.start();
    this._tick();
  }

  stop() {
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }

  _tick() {
    this._rafId = requestAnimationFrame(ts => {
      // Skip frame if tab hidden
      if (this._renderer._paused) {
        this._clock.getDelta(); // drain accumulator
        this._tick();
        return;
      }

      // Frame throttle for low-end devices
      if (this._throttle) {
        const elapsed = ts - this._lastFrame;
        if (elapsed < this._targetInterval - 2) { // 2ms tolerance
          this._tick();
          return;
        }
        this._lastFrame = ts - (elapsed % this._targetInterval);
      }

      this._tick();
    });

    if (!this._running) return;

    const dt = Math.min(this._clock.getDelta(), MAX_DELTA);
    for (const sys of this._systems) sys.update(dt);

    if (this._composer) {
      this._composer.render();
    } else {
      this._renderer.render(this._scene, this._camera);
    }
  }
}
