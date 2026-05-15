// ─── PARTICLE SYSTEM ──────────────────────────────────────────────────────
import { Config, Tier } from '../core/config.js';
import { ObjectPool } from '../utils/objectPool.js';

const PC = Config.PARTICLES;

export class ParticleSystem {
  constructor(scene) {
    if (!PC.ENABLED) {
      // No-op stub for LOW tier
      this.spawn = () => {};
      this.update = () => {};
      return;
    }

    const MAX = PC.MAX;
    this._max  = MAX;
    this._pos  = new Float32Array(MAX * 3);
    this._col  = new Float32Array(MAX * 3);
    this._live = [];
    this._count = 0;
    this._pool = new ObjectPool(() => ({ vx:0, vy:0, vz:0, life:0, type:'smoke' }), MAX);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this._pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(this._col, 3));
    geo.setDrawRange(0, 0);
    this._geo  = geo;
    this._mesh = new THREE.Points(geo, new THREE.PointsMaterial({
      size: PC.SIZE, vertexColors: true, transparent: true, opacity: 0.9, sizeAttenuation: true,
    }));
    scene.add(this._mesh);
  }

  spawn(x, y, z, type, count = 1) {
    if (!this._pool) return;
    for (let ci = 0; ci < count; ci++) {
      if (this._count >= this._max) return;
      const i = this._count;
      this._pos[i*3]   = x + (Math.random()-0.5);
      this._pos[i*3+1] = y;
      this._pos[i*3+2] = z + (Math.random()-0.5);
      const c = this._typeColor(type);
      this._col[i*3]   = c[0];
      this._col[i*3+1] = c[1];
      this._col[i*3+2] = c[2];
      const spread = (type==='fire'||type==='nos') ? PC.SPREAD.fire : PC.SPREAD.other;
      const p = this._pool.acquire();
      p.vx   = (Math.random()-0.5)*spread;
      p.vy   = (type==='fire'||type==='nos') ? Math.random()*6+3 : Math.random()*3+1;
      p.vz   = (Math.random()-0.5)*spread;
      p.life = 1;
      p.type = type;
      this._live.push(p);
      this._count++;
    }
    this._geo.setDrawRange(0, this._count);
  }

  update(dt) {
    if (!this._pool) return;
    for (let i = this._count-1; i >= 0; i--) {
      const p = this._live[i];
      this._pos[i*3]   += p.vx*dt;
      this._pos[i*3+1] += p.vy*dt;
      this._pos[i*3+2] += p.vz*dt;
      p.vy -= 9.8*dt;
      p.life -= dt*(PC.DECAY[p.type]||1.5);
      if (p.life <= 0) this._removeAt(i);
    }
    this._geo.attributes.position.needsUpdate = true;
    this._geo.attributes.color.needsUpdate    = true;
    this._geo.setDrawRange(0, this._count);
  }

  _removeAt(i) {
    const last = this._count-1;
    if (i !== last) {
      this._pos[i*3]   = this._pos[last*3];
      this._pos[i*3+1] = this._pos[last*3+1];
      this._pos[i*3+2] = this._pos[last*3+2];
      this._col[i*3]   = this._col[last*3];
      this._col[i*3+1] = this._col[last*3+1];
      this._col[i*3+2] = this._col[last*3+2];
      this._live[i]    = this._live[last];
    }
    this._pool.release(this._live.pop());
    this._count--;
  }

  _typeColor(type) {
    switch (type) {
      case 'spark': return [1, 0.8, 0.2];
      case 'fire':  return [1, 0.4+Math.random()*0.3, 0.1];
      case 'nos':   return [1.0, 0.5+Math.random()*0.3, 0.0];
      default:      return [0.38, 0.38, 0.38];
    }
  }
}
