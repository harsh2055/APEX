// ─── SKID MARKS ───────────────────────────────────────────────────────────
import { Config } from '../core/config.js';

const SK = Config.SKIDMARKS;

export class SkidmarkSystem {
  constructor(scene) {
    if (!SK.ENABLED || SK.MAX === 0) {
      this.addMark = () => {};
      return;
    }
    this._max  = SK.MAX;
    this._pos  = new Float32Array(this._max * 3);
    this._idx  = 0;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this._pos, 3));
    geo.setDrawRange(0, 0);
    this._geo = geo;
    const mesh = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x111111 }));
    mesh.position.y = SK.HEIGHT;
    scene.add(mesh);
  }

  addMark(x, z) {
    if (!this._geo) return;
    const half = SK.WIDTH;
    const slot = (this._idx % (this._max / 2)) * 6;
    this._pos[slot]   = x-half; this._pos[slot+1] = 0; this._pos[slot+2] = z;
    this._pos[slot+3] = x+half; this._pos[slot+4] = 0; this._pos[slot+5] = z;
    this._idx++;
    this._geo.attributes.position.needsUpdate = true;
    this._geo.setDrawRange(0, Math.min(this._idx*2, this._max));
  }
}
