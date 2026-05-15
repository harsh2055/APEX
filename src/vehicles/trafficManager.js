// ─── TRAFFIC MANAGER ──────────────────────────────────────────────────────
import { Config, WORLD_SIZE, Tier } from '../core/config.js';
import { VehicleFactory }           from './vehicleFactory.js';
import { Bus, Events }              from '../core/eventBus.js';
import { randRange, randItem }      from '../utils/math.js';

const T = Config.TRAFFIC;

export class TrafficManager {
  constructor(scene) {
    this._scene  = scene;
    this._cars   = [];
    this._frame  = 0;
    this._spawn();
  }

  _spawn() {
    const TILE = Config.WORLD.TILE_SIZE;
    const GRID = Config.WORLD.GRID_SIZE;
    const HALF = WORLD_SIZE / 2;

    for (let i = 0; i < T.COUNT; i++) {
      const color = randItem(T.COLORS);
      const mesh  = VehicleFactory.build(false, color);
      const isHoriz = Math.random() > 0.5;
      const laneIdx = Math.floor(Math.random() * GRID / 2) * 2;
      const pos     = (Math.random() * WORLD_SIZE) - HALF;
      const x = isHoriz ? pos : laneIdx * TILE - HALF;
      const z = isHoriz ? laneIdx * TILE - HALF : pos;
      mesh.position.set(x, 0, z);
      this._scene.add(mesh);
      this._cars.push({ mesh, x, z, angle: isHoriz ? Math.PI / 2 : 0,
        speed: randRange(T.SPEED_MIN, T.SPEED_MAX), braking: false,
        turnTimer: randRange(T.TURN_TIMER_MIN, T.TURN_TIMER_MAX) });
    }
  }

  update(dt, playerX, playerZ) {
    this._frame++;
    // On LOW tier, only process AI every N frames to save CPU
    const skipAI = Tier === 'LOW' && (this._frame % T.UPDATE_INTERVAL !== 0);
    const HALF = WORLD_SIZE / 2;

    for (const car of this._cars) {
      const dx   = playerX - car.x;
      const dz   = playerZ - car.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (!skipAI) {
        if (dist < T.CRASH_DIST) {
          Bus.emit(Events.TRAFFIC_HIT, { car, dist });
          car.braking = true;
        } else {
          car.braking = dist < T.BRAKE_DIST;
        }
        car.turnTimer -= dt * T.UPDATE_INTERVAL;
        if (car.turnTimer <= 0) {
          if (Math.random() > 0.3)
            car.angle += (Math.PI / 2) * (Math.random() > 0.5 ? 1 : -1);
          car.turnTimer = randRange(T.TURN_TIMER_MIN, T.TURN_TIMER_MAX);
        }
      }

      const effSpeed = car.braking ? car.speed * 0.08 : car.speed;
      car.x += Math.sin(car.angle) * effSpeed * dt;
      car.z += Math.cos(car.angle) * effSpeed * dt;

      // World-wrap
      if (car.x >  HALF) car.x = -HALF;
      if (car.x < -HALF) car.x =  HALF;
      if (car.z >  HALF) car.z = -HALF;
      if (car.z < -HALF) car.z =  HALF;

      // Wheel animation (skip on LOW tier)
      if (Tier !== 'LOW' && car.mesh._wheels) {
        car.mesh._wheels.forEach(w => {
          if (w.children[0]) w.children[0].rotation.x += effSpeed * dt * 3;
        });
      }

      car.mesh.position.set(car.x, 0, car.z);
      car.mesh.rotation.y = car.angle;
    }
  }

  get cars() { return this._cars; }
}
