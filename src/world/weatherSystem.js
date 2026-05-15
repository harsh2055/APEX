import { Config } from '../core/config.js';
export class WeatherSystem {
  constructor(scene) { this._scene=scene; this._raining=false; this._rainMesh=this._buildRain(); }
  get isRaining() { return this._raining; }
  toggle(fogObj) {
    this._raining=!this._raining; this._rainMesh.visible=this._raining;
    fogObj.density=this._raining?Config.RENDERER.FOG_DENSITY_RAIN:Config.RENDERER.FOG_DENSITY_DAY;
    return this._raining;
  }
  update(dt,playerX,playerZ) {
    if(!this._raining) return;
    const {FALL_SPEED,WIND_SPEED,SPAWN_HEIGHT,RADIUS,COUNT}=Config.RAIN;
    const pos=this._rainMesh.geometry.attributes.position;
    for(let i=0;i<COUNT;i++){
      pos.array[i*3+1]-=FALL_SPEED*dt; pos.array[i*3]-=WIND_SPEED*dt;
      if(pos.array[i*3+1]<0){ pos.array[i*3+1]=SPAWN_HEIGHT; pos.array[i*3]=playerX+(Math.random()-0.5)*RADIUS*2; pos.array[i*3+2]=playerZ+(Math.random()-0.5)*RADIUS*2; }
    }
    pos.needsUpdate=true; this._rainMesh.position.set(playerX,0,playerZ);
  }
  _buildRain() {
    const {COUNT}=Config.RAIN;
    const positions=new Float32Array(COUNT*3);
    for(let i=0;i<COUNT;i++){ positions[i*3]=(Math.random()-0.5)*200; positions[i*3+1]=Math.random()*80; positions[i*3+2]=(Math.random()-0.5)*200; }
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
    const mesh=new THREE.Points(geo,new THREE.PointsMaterial({color:0x8899bb,size:0.15,transparent:true,opacity:0.6}));
    mesh.visible=false; this._scene.add(mesh); return mesh;
  }
}
