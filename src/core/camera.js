// ─── CAMERA CONTROLLER ────────────────────────────────────────────────────
import { Config }               from '../core/config.js';
import { smoothFactor, forwardVec, rightVec } from '../utils/math.js';
const CAM = Config.CAMERA;
export class CameraController {
  constructor(camera) {
    this._camera   = camera;
    this._mode     = 0;
    this._shake    = 0;
    this._cinAngle = 0;
    this._pos  = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this._tPos = new THREE.Vector3();
    this._tLook= new THREE.Vector3();
  }
  cycleMode() { this._mode = (this._mode+1) % 3; }
  addShake(amount) { this._shake = Math.min(this._shake+amount, 2.5); }
  update(playerState, dt) {
    this._shake *= 0.85;
    const shX = (Math.random()-0.5)*this._shake*0.8;
    const shY = (Math.random()-0.5)*this._shake*0.4;
    const fwd   = forwardVec(playerState.angle);
    const right = rightVec(playerState.angle);
    const sNorm = Math.abs(playerState.fwdSpd)/60;
    if      (this._mode===0) this._modeFollow(playerState,fwd,right,sNorm,shX,shY);
    else if (this._mode===1) this._modeCockpit(playerState,fwd,sNorm,shX,shY);
    else                     this._modeCinematic(playerState,sNorm,dt,shX);
    const alpha     = smoothFactor(CAM.SMOOTH_POS, dt);
    const alphaLook = smoothFactor(CAM.SMOOTH_LOOK, dt);
    this._pos.lerp(this._tPos, alpha);
    this._look.lerp(this._tLook, alphaLook);
    this._camera.position.copy(this._pos);
    this._camera.lookAt(this._look);
  }
  initPosition(px, pz) {
    this._pos.set(px,12,pz-25); this._look.set(px,0,pz);
    this._camera.position.copy(this._pos); this._camera.lookAt(this._look);
  }
  _modeFollow(s,fwd,right,sNorm,shX,shY) {
    const driftOffset = right.clone().multiplyScalar(s.latSpd*0.3);
    const back = CAM.FOLLOW_BACK_BASE + sNorm*CAM.FOLLOW_BACK_SPEED;
    const h    = CAM.FOLLOW_HEIGHT_BASE + sNorm*CAM.FOLLOW_HEIGHT_SPEED;
    let fov = Math.min(CAM.FOV_DEFAULT + sNorm*CAM.FOV_MAX_SPEED_ADD + (s.isUsingNos?CAM.FOV_NOS_ADD:0), 100);
    this._setFov(fov);
    this._tPos.set(s.x-fwd.x*back+driftOffset.x+shX, h+shY, s.z-fwd.z*back+driftOffset.z);
    this._tLook.set(s.x+fwd.x*14+s.velX*0.5, 1.5, s.z+fwd.z*14+s.velZ*0.5);
  }
  _modeCockpit(s,fwd,sNorm,shX,shY) {
    this._setFov(CAM.FOV_COCKPIT+(s.isUsingNos?12:0)+sNorm*8);
    this._tPos.set(s.x+fwd.x+shX, 1.9+shY, s.z+fwd.z);
    this._tLook.set(s.x+fwd.x*50, 1.5, s.z+fwd.z*50);
  }
  _modeCinematic(s,sNorm,dt,shX) {
    this._cinAngle += dt*0.2;
    const r = 32+sNorm*15;
    this._setFov(CAM.FOV_CINEMA);
    this._tPos.set(s.x+Math.sin(this._cinAngle)*r+shX, 20, s.z+Math.cos(this._cinAngle)*r);
    this._tLook.set(s.x, 1, s.z);
  }
  _setFov(fov) {
    this._camera.fov = THREE.MathUtils.lerp(this._camera.fov, fov, 0.06);
    this._camera.updateProjectionMatrix();
  }
}
