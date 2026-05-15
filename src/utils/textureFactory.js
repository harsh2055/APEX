// ─── TEXTURE FACTORY ──────────────────────────────────────────────────────
import { IsMobile, Tier } from '../core/config.js';

const anisotropyLevel = Tier === 'HIGH' ? 4 : 1;
const TEX_SCALE = Tier === 'HIGH' ? 1 : Tier === 'MED' ? 0.5 : 0.25;

// Texture cache — reuse identical textures
const _cache = new Map();
function cached(key, factory) {
  if (_cache.has(key)) return _cache.get(key);
  const tex = factory();
  _cache.set(key, tex);
  return tex;
}

export function createRoadTexture() {
  return cached('road', () => {
    const W = Math.round(128 * (IsMobile ? 0.5 : 1));
    const H = Math.round(512 * (IsMobile ? 0.5 : 1));
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#2a2a35';
    ctx.fillRect(0, 0, W, H);

    if (!IsMobile) {
      for (let i = 0; i < 2000; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
        ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
      }
    }

    ctx.fillStyle = '#ffee44';
    for (let y = 0; y < H; y += H / 8) ctx.fillRect(W * 0.45, y, W * 0.06, H / 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(W * 0.03, 0, W * 0.02, H);
    ctx.fillRect(W * 0.95, 0, W * 0.02, H);

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = anisotropyLevel;
    return tex;
  });
}

export function createWindowTexture(rows, cols, isDowntown) {
  const key = `window_${rows}_${cols}_${isDowntown}`;
  return cached(key, () => {
    const cellW = IsMobile ? 8 : 16;
    const cellH = IsMobile ? 8 : 16;
    const w = Math.max(cols * cellW, 1);
    const h = Math.max(rows * cellH, 1);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, w, h);

    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const lit = Math.random() > 0.4;
        const x = col * cellW + 1;
        const y = r * cellH + 1;
        const ww = cellW - 2;
        const hh = cellH - 2;
        if (lit) {
          ctx.fillStyle = isDowntown
            ? `hsl(${200 + Math.random() * 20},80%,${60 + Math.random() * 30}%)`
            : `hsl(${40 + Math.random() * 10},90%,${70 + Math.random() * 20}%)`;
        } else {
          ctx.fillStyle = '#0a0a15';
        }
        ctx.fillRect(x, y, ww, hh);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = anisotropyLevel;
    return tex;
  });
}

export function createGrassTexture() {
  return cached('grass', () => {
    const S = IsMobile ? 128 : 512;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#2d4c1e';
    ctx.fillRect(0, 0, S, S);
    if (!IsMobile) {
      for (let i = 0; i < 5000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(55,90,35,0.5)' : 'rgba(30,50,20,0.4)';
        ctx.fillRect(Math.random() * S, Math.random() * S, 2, 4);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = anisotropyLevel;
    return tex;
  });
}

export function createAsphaltTexture() {
  return cached('asphalt', () => {
    const S = IsMobile ? 128 : 512;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, S, S);
    if (!IsMobile) {
      for (let i = 0; i < 10000; i++) {
        const v = 20 + Math.random() * 15;
        ctx.fillStyle = `rgba(${v},${v},${v},${Math.random() * 0.5})`;
        ctx.fillRect(Math.random() * S, Math.random() * S, 2, 2);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = anisotropyLevel;
    return tex;
  });
}

/** Clear texture cache (call when destroying scene) */
export function clearTextureCache() {
  _cache.forEach(tex => tex.dispose());
  _cache.clear();
}
