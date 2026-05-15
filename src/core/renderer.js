// ─── RENDERER ─────────────────────────────────────────────────────────────
import { Config, IsMobile, Tier } from './config.js';

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: Config.RENDERER.ENABLE_AA,
    powerPreference: 'high-performance',
    precision: IsMobile ? 'mediump' : 'highp',   // Lower shader precision on mobile
    alpha: false,
    stencil: false,                                // Disable unused stencil buffer
    depth: true,
    logarithmicDepthBuffer: false,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, Config.RENDERER.PIXEL_RATIO_MAX));
  renderer.setSize(window.innerWidth, window.innerHeight);

  if (Config.RENDERER.ENABLE_SHADOWS) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  } else {
    renderer.shadowMap.enabled = false;
  }

  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = Config.RENDERER.TONE_MAPPING_EXP;
  renderer.setClearColor(Config.RENDERER.CLEAR_COLOR);

  // Disable expensive features on mobile
  if (IsMobile) {
    renderer.physicallyCorrectLights = false;
    renderer.autoClearDepth = true;
  }

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Adjust pixel ratio if orientation changed
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, Config.RENDERER.PIXEL_RATIO_MAX));
  });

  // Handle visibility change — pause rendering when tab hidden
  document.addEventListener('visibilitychange', () => {
    renderer._paused = document.hidden;
  });

  return renderer;
}

export function createComposer(renderer, scene, camera) {
  if (!Config.RENDERER.ENABLE_BLOOM) {
    return { composer: null, bloomPass: null };
  }

  const composer = new THREE.EffectComposer(renderer);
  const renderPass = new THREE.RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    Config.RENDERER.BLOOM_STRENGTH,
    Config.RENDERER.BLOOM_RADIUS,
    Config.RENDERER.BLOOM_THRESHOLD,
  );
  composer.addPass(bloomPass);

  window.addEventListener('resize', () => {
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  return { composer, bloomPass };
}
