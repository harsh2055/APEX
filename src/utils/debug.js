import { Config, Tier } from '../core/config.js';
const _log = Config.DEBUG.ENABLED ? (...args) => console.log('[APEX]',...args) : ()=>{};
const _warn = (...args) => console.warn('[APEX]',...args);
export const Debug = {
  log: _log, warn: _warn,
  tier: Tier,
  fps: {
    _frames:0, _acc:0, value:0,
    tick(dt) {
      this._frames++; this._acc+=dt;
      if (this._acc>=Config.DEBUG.FPS_INTERVAL) {
        this.value=Math.round(this._frames/this._acc);
        this._frames=0; this._acc=0;
      }
    },
  },
};
