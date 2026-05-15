// ─── APEX CITY — MAIN ENTRY POINT ─────────────────────────────────────────
import { createRenderer, createComposer } from './core/renderer.js';
import { createScene, createCamera }      from './core/scene.js';
import { GameLoop }                       from './core/gameLoop.js';
import { CameraController }               from './core/camera.js';

import { CityGenerator }      from './world/cityGenerator.js';
import { createRoadDetector } from './world/roads.js';
import { LightingSystem }     from './world/lightingSystem.js';
import { WeatherSystem }      from './world/weatherSystem.js';

import { PlayerCar }          from './vehicles/playerCar.js';
import { TrafficManager }     from './vehicles/trafficManager.js';

import { MissionSystem }      from './gameplay/missionSystem.js';

import { ParticleSystem }     from './effects/particles.js';
import { SkidmarkSystem }     from './effects/skidmarks.js';
import { AudioSystem }        from './effects/audioSystem.js';

import { HUD }                from './ui/hud.js';
import { Minimap }            from './ui/minimap.js';
import { NotificationSystem } from './ui/notifications.js';
import { MenuSystem }         from './ui/menus.js';

import { InputManager }       from './input/inputManager.js';

import { Bus, Events }        from './core/eventBus.js';
import { Config }             from './core/config.js';
import { Debug }              from './utils/debug.js';
import { forwardVec, rightVec } from './utils/math.js';

// ─── PWA: Register Service Worker ─────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('[SW] Registered, scope:', reg.scope))
      .catch(err => console.warn('[SW] Registration failed:', err));
  });
}

// ─── 1. CORE ──────────────────────────────────────────────────────────────
const canvas   = document.getElementById('c');
const renderer = createRenderer(canvas);
const scene    = createScene();
const camera   = createCamera();
const { composer, bloomPass } = createComposer(renderer, scene, camera);

// ─── 2. WORLD ─────────────────────────────────────────────────────────────
const city     = new CityGenerator(scene);
const lighting = new LightingSystem(scene);
const weather  = new WeatherSystem(scene);
const isOnRoad = createRoadDetector();

// ─── 3. GAMEPLAY ──────────────────────────────────────────────────────────
const player   = new PlayerCar(scene, isOnRoad, city.buildingGrid);
const traffic  = new TrafficManager(scene);
const missions = new MissionSystem(scene);

const particles = new ParticleSystem(scene);
const skidmarks = new SkidmarkSystem(scene);
const audio     = new AudioSystem();

// ─── 4. UI ────────────────────────────────────────────────────────────────
const hud     = new HUD();
const minimap = new Minimap();
const notifs  = new NotificationSystem();
const menus   = new MenuSystem();

// ─── 5. INPUT ─────────────────────────────────────────────────────────────
const input   = new InputManager();

// ─── 6. CAMERA ────────────────────────────────────────────────────────────
const camCtrl = new CameraController(camera);

// ─── 7. EVENT SUBSCRIPTIONS ───────────────────────────────────────────────

Bus.on(Events.COLLISION, impacts => {
  impacts.forEach(impact => {
    player.state.damage = Math.min(100, player.state.damage + impact * Config.VEHICLE.DAMAGE_SPEED_FACTOR);
    camCtrl.addShake(impact * 0.1);
    particles.spawn(player.x, 1, player.z, 'spark', 8);
    hud.flashDamage();
    audio.playCrashSound(impact);
    if (impact > Config.VEHICLE.DAMAGE_WANTED_THRESH) missions.addWanted(1);
  });
});

Bus.on(Events.TRAFFIC_HIT, ({ car }) => {
  player.state.damage = Math.min(100, player.state.damage + 5);
  const impactF = (Math.abs(player.state.fwdSpd) + Math.abs(player.state.latSpd)) * 0.3;
  player.state.velX  += (player.x - car.x) * impactF * 0.1;
  player.state.velZ  += (player.z - car.z) * impactF * 0.1;
  player.state.fwdSpd *= 0.5;
  camCtrl.addShake(1.2);
  missions.addWanted(1);
  hud.flashDamage();
  audio.playCrashSound(impactF);
  particles.spawn(car.x, 1, car.z, 'spark', 5);
});

Bus.on(Events.NOS_ENGAGED, () => { camCtrl.addShake(0.8); hud.flashNos(); });

Bus.on(Events.TOGGLE_NIGHT, () => {
  lighting.toggleNight(city.skyMesh, scene.fog, city.starMat);
  Bus.emit(Events.SHOW_NOTIF, lighting.isNight ? '🌙 NIGHT MODE' : '☀ DAY MODE');
});

Bus.on(Events.TOGGLE_RAIN, () => {
  const raining = weather.toggle(scene.fog);
  player.setRaining(raining);
  Bus.emit(Events.SHOW_NOTIF, raining ? '🌧 RAIN — SLIPPERY ROADS!' : '☀ CLEAR SKIES');
});

Bus.on(Events.CAMERA_CYCLE,      ()      => camCtrl.cycleMode());
Bus.on(Events.FARE_COMPLETE,     amount  => hud.updateMoney(amount));
Bus.on(Events.WANTED_CHANGED,    level   => hud.updateWanted(level));
Bus.on(Events.PASSENGER_PICKUP,  ()      => hud.updateMissionText('Drop Off Passenger'));

// ─── 8. GAME LOOP ─────────────────────────────────────────────────────────

let exhaustTimer = 0;

const masterUpdate = {
  update(dt) {
    const result = player.update(input.state, dt);
    const { fwd, right } = result;
    const state = player.state;

    // Particles (only emit if system enabled)
    if (state.isDrifting) {
      skidmarks.addMark(state.x - fwd.x * 3, state.z - fwd.z * 3);
      exhaustTimer += dt;
      if (exhaustTimer > Config.PARTICLES.EXHAUST_INTERVAL_DRIFT) {
        exhaustTimer = 0;
        particles.spawn(state.x - fwd.x * 3, 0.3, state.z - fwd.z * 3, 'smoke');
      }
    } else if (input.state.up) {
      exhaustTimer += dt;
      if (exhaustTimer > Config.PARTICLES.EXHAUST_INTERVAL_NORMAL) {
        exhaustTimer = 0;
        particles.spawn(state.x - fwd.x * 3.5, 0.8, state.z - fwd.z * 3.5, 'smoke');
      }
    }
    if (state.isUsingNos && Math.random() > 0.3) {
      particles.spawn(state.x - fwd.x * 3.5 - right.x * 0.5, 0.7, state.z - fwd.z * 3.5 - right.z * 0.5, 'fire');
      particles.spawn(state.x - fwd.x * 3.5 + right.x * 0.5, 0.7, state.z - fwd.z * 3.5 + right.z * 0.5, 'fire');
    }

    particles.update(dt);
    traffic.update(dt, player.x, player.z);
    weather.update(dt, player.x, player.z);
    missions.update(player.x, player.z);
    camCtrl.update(state, dt);
    lighting.updateBeamTargets(player.x, player.z, fwd, right);
    audio.update(state, state.latSpd);
    hud.update(state);
    minimap.update(state, traffic.cars, missions);
    Debug.fps.tick(dt);
    hud.updateFps(Debug.fps.value);
  },
};

// ─── 9. STARTUP ───────────────────────────────────────────────────────────

(async function boot() {
  const loop = new GameLoop(renderer, scene, camera, composer);

  let idleRaf;
  const idleRender = () => {
    idleRaf = requestAnimationFrame(idleRender);
    if (composer) composer.render();
    else renderer.render(scene, camera);
  };
  idleRender();

  await menus.runLoadingScreen(() => {
    city.generate();
    lighting.init(renderer, city.streetLights, player.mesh);
    minimap.setBuildings(city.buildings);
    camera.position.set(0, 15, -30);
    camera.lookAt(0, 0, 0);
  });

  await menus.waitForStart();

  audio.init();
  hud.show();
  Bus.emit(Events.SHOW_NOTIF, '🏎 GT RACING  —  SHIFT = NOS BOOST');
  camCtrl.initPosition(player.x, player.z);

  cancelAnimationFrame(idleRaf);
  loop.register(masterUpdate).start();
})();
