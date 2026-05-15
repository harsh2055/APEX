import { Config, WORLD_SIZE, ROAD_WIDTH } from '../core/config.js';
const MM_SIZE=180, MM_SCALE=MM_SIZE/WORLD_SIZE;
export class Minimap {
  constructor() { this._canvas=document.getElementById('mm-canvas'); this._ctx=this._canvas.getContext('2d'); this._buildings=[]; }
  setBuildings(buildings) { this._buildings=buildings; }
  update(playerState,trafficCars,missionSystem) {
    const ctx=this._ctx, px=playerState.x, pz=playerState.z;
    const ox=MM_SIZE/2-px*MM_SCALE, oy=MM_SIZE/2-pz*MM_SCALE;
    const {TILE_SIZE:TILE,GRID_SIZE:GRID,GAS_STATION_GX,GAS_STATION_GZ}=Config.WORLD;
    const half=WORLD_SIZE/2;
    ctx.fillStyle='#05080f'; ctx.fillRect(0,0,MM_SIZE,MM_SIZE);
    ctx.fillStyle='#1c2833';
    for(let i=0;i<GRID;i+=2){
      const rw=ROAD_WIDTH;
      ctx.fillRect(0,(i*TILE-half-rw/2)*MM_SCALE+oy,MM_SIZE,rw*MM_SCALE);
      ctx.fillRect((i*TILE-half-rw/2)*MM_SCALE+ox,0,rw*MM_SCALE,MM_SIZE);
    }
    ctx.fillStyle='#2a3a4a';
    for(const b of this._buildings) ctx.fillRect((b.x-b.w)*MM_SCALE+ox,(b.z-b.d)*MM_SCALE+oy,b.w*2*MM_SCALE,b.d*2*MM_SCALE);
    const gsx=-half+TILE*GAS_STATION_GX, gsz=-half+TILE*GAS_STATION_GZ;
    ctx.fillStyle='#ff6600'; ctx.beginPath(); ctx.arc(gsx*MM_SCALE+ox,gsz*MM_SCALE+oy,4,0,Math.PI*2); ctx.fill();
    const mstate=missionSystem.missionState;
    const mpos=mstate==='PICKUP'?missionSystem.passengerPos:missionSystem.dropoffPos;
    ctx.fillStyle=mstate==='PICKUP'?'#ffee00':'#00ff88';
    ctx.beginPath(); ctx.arc(mpos.x*MM_SCALE+ox,mpos.z*MM_SCALE+oy,4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,200,0,0.5)';
    for(const t of trafficCars){
      const tx=t.x*MM_SCALE+ox, tz=t.z*MM_SCALE+oy;
      if(tx>0&&tx<MM_SIZE&&tz>0&&tz<MM_SIZE) ctx.fillRect(tx-1,tz-1,2,2);
    }
    ctx.save(); ctx.translate(MM_SIZE/2,MM_SIZE/2); ctx.rotate(playerState.angle);
    ctx.fillStyle='#FF6600'; ctx.shadowBlur=6; ctx.shadowColor='#FF6600';
    ctx.beginPath(); ctx.moveTo(0,-6); ctx.lineTo(3.5,5); ctx.lineTo(-3.5,5); ctx.fill();
    ctx.restore();
  }
}
