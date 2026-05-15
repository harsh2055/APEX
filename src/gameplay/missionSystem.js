import { Config, WORLD_SIZE } from '../core/config.js';
import { Bus, Events }        from '../core/eventBus.js';
import { dist2D, randRange }  from '../utils/math.js';
const MC=Config.MISSIONS;
export class MissionSystem {
  constructor(scene) {
    this._scene=scene; this._state='PICKUP'; this.money=0;
    this._passenger=this._randomPos(); this._dropoff=this._randomPos(); this._wantedLevel=0;
    this._pickupMarker=this._makeMarker(0xffee00,this._passenger);
    this._dropoffMarker=this._makeMarker(0x00ff88,this._dropoff);
    this._dropoffMarker.visible=false;
  }
  get missionState() { return this._state; }
  get passengerPos() { return this._passenger; }
  get dropoffPos()   { return this._dropoff; }
  get wantedLevel()  { return this._wantedLevel; }
  addWanted(amount=1) { this._wantedLevel=Math.min(5,this._wantedLevel+amount); Bus.emit(Events.WANTED_CHANGED,this._wantedLevel); }
  update(playerX,playerZ) {
    const t=Date.now(), bob=0.2+Math.sin(t*0.003)*0.3;
    if(this._state==='PICKUP'){
      if(dist2D(playerX,playerZ,this._passenger.x,this._passenger.z)<MC.PICKUP_RADIUS) this._onPickup();
      this._pickupMarker.rotation.y+=0.03; this._pickupMarker.position.y=bob;
    }else{
      if(dist2D(playerX,playerZ,this._dropoff.x,this._dropoff.z)<MC.DROPOFF_RADIUS) this._onDropoff();
      this._dropoffMarker.rotation.y+=0.03; this._dropoffMarker.position.y=bob;
    }
  }
  _onPickup() {
    this._state='DROPOFF'; this._pickupMarker.visible=false; this._dropoffMarker.visible=true;
    Bus.emit(Events.PASSENGER_PICKUP); Bus.emit(Events.SHOW_NOTIF,'PASSENGER PICKED UP!');
  }
  _onDropoff() {
    this.money+=MC.FARE_AMOUNT; Bus.emit(Events.FARE_COMPLETE,this.money);
    Bus.emit(Events.SHOW_NOTIF,`+$${MC.FARE_AMOUNT} — FARE COMPLETE!`);
    this._passenger=this._randomPos(); this._dropoff=this._randomPos(); this._state='PICKUP';
    this._pickupMarker.position.set(this._passenger.x,0.2,this._passenger.z);
    this._dropoffMarker.position.set(this._dropoff.x,0.2,this._dropoff.z);
    this._dropoffMarker.visible=false; this._pickupMarker.visible=true;
  }
  _randomPos() {
    const TILE=Config.WORLD.TILE_SIZE;
    const gx=(Math.floor(Math.random()*Config.WORLD.GRID_SIZE/2)*2)*TILE-WORLD_SIZE/2;
    const gz=(Math.random()-0.5)*WORLD_SIZE*0.7;
    return {x:gx,z:gz};
  }
  _makeMarker(color,pos) {
    const m=new THREE.Mesh(new THREE.CylinderGeometry(3,3,0.3,16),new THREE.MeshBasicMaterial({color}));
    m.position.set(pos.x,0.2,pos.z); this._scene.add(m); return m;
  }
}
