// ─── SCENE & CAMERA ───────────────────────────────────────────────────────
import { Config } from './config.js';
export function createScene() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(Config.RENDERER.FOG_COLOR_DAY, Config.RENDERER.FOG_DENSITY_DAY);
  return scene;
}
export function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    Config.CAMERA.FOV_DEFAULT, window.innerWidth/window.innerHeight,
    Config.CAMERA.NEAR, Config.CAMERA.FAR,
  );
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
  });
  return camera;
}
