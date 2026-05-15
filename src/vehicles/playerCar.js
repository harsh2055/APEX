// ─── PLAYER CAR ───────────────────────────────────────────────────────────
import { VehicleFactory }                     from './vehicleFactory.js';
import { createVehicleState, stepVehiclePhysics } from './vehiclePhysics.js';
import { Bus, Events }                        from '../core/eventBus.js';
import { Config, Tier }                       from '../core/config.js';

export class PlayerCar {
  constructor(scene, isOnRoadFn, buildingGrid) {
    this._scene=scene; this._isOnRoadFn=isOnRoadFn; this._buildingGrid=buildingGrid;
    this._isRaining=false; this._nosTimer=0;
    this.state=createVehicleState();
    this.mesh=VehicleFactory.build(true,0xFF6600);
    scene.add(this.mesh);
  }
  setRaining(v) { this._isRaining=v; }
  update(input,dt) {
    const result=stepVehiclePhysics(this.state,input,this._isOnRoadFn,this._buildingGrid,this._isRaining,dt);
    this.mesh.position.set(this.state.x,0,this.state.z);
    this.mesh.rotation.y=this.state.angle;
    if(this.mesh._bodyMesh){ this.mesh._bodyMesh.rotation.z=this.state.bodyRoll; this.mesh._bodyMesh.rotation.x=this.state.bodyPitch; }
    if(this.mesh._wheels){
      this.mesh._wheels[0].rotation.y=this.state.steer*0.5;
      this.mesh._wheels[1].rotation.y=this.state.steer*0.5;
      this.mesh._wheels.forEach(w=>{ if(w.children.length>0) w.children[0].rotation.x=this.state.wheelRot; });
    }
    if(this.mesh._glowLight) this.mesh._glowLight.color.setHSL(0.06+(this.state.neonHue/360)*0.1,1,0.5);
    this._updateNosEffects(dt,result.nosJustActivated);
    if(result.nosJustActivated) Bus.emit(Events.NOS_ENGAGED);
    if(result.nosJustDepleted)  Bus.emit(Events.NOS_DEPLETED);
    if(result.collisions.length>0) Bus.emit(Events.COLLISION,result.collisions);
    this._checkGasStation(dt);
    return result;
  }
  _updateNosEffects(dt,activated) {
    if(this.state.isUsingNos){
      this._nosTimer+=dt;
      const pulse=Math.sin(this._nosTimer*25)*0.5+0.5;
      if(this.mesh._nosLight)  this.mesh._nosLight.intensity=25+pulse*15;
      if(this.mesh._nosLight2) this.mesh._nosLight2.intensity=15+pulse*8;
      if(this.mesh._flameL){ this.mesh._flameL.material.opacity=0.7+pulse*0.3; this.mesh._flameL.scale.y=1.5+pulse; }
      if(this.mesh._flameR){ this.mesh._flameR.material.opacity=0.7+pulse*0.3; this.mesh._flameR.scale.y=1.5+pulse; }
    }else{
      this._nosTimer=0;
      if(this.mesh._nosLight)  this.mesh._nosLight.intensity*=0.85;
      if(this.mesh._nosLight2) this.mesh._nosLight2.intensity*=0.85;
      if(this.mesh._flameL)    this.mesh._flameL.material.opacity*=0.8;
      if(this.mesh._flameR)    this.mesh._flameR.material.opacity*=0.8;
    }
  }
  _checkGasStation(dt) {
    const {GAS_STATION_GX,GAS_STATION_GZ,TILE_SIZE,GRID_SIZE}=Config.WORLD;
    const WSIZE=TILE_SIZE*GRID_SIZE;
    const gsx=-WSIZE/2+TILE_SIZE*GAS_STATION_GX, gsz=-WSIZE/2+TILE_SIZE*GAS_STATION_GZ;
    const R=Config.VEHICLE.GAS_STATION_RADIUS;
    if(Math.abs(this.state.x-gsx)<R&&Math.abs(this.state.z-gsz)<R){
      const {GAS_FUEL_RATE,GAS_DAMAGE_RATE,GAS_NOS_RATE,FUEL_CAPACITY}=Config.VEHICLE;
      this.state.fuel=Math.min(FUEL_CAPACITY,this.state.fuel+GAS_FUEL_RATE*dt);
      this.state.damage=Math.max(0,this.state.damage-GAS_DAMAGE_RATE*dt);
      this.state.nos=Math.min(Config.NOS.CAPACITY,this.state.nos+GAS_NOS_RATE*dt);
    }
  }
  get x() { return this.state.x; }
  get z() { return this.state.z; }
}
