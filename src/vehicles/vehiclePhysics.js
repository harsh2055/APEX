// ─── VEHICLE PHYSICS ──────────────────────────────────────────────────────
import { Config, ROAD_WIDTH, WORLD_SIZE } from '../core/config.js';
import { clamp, forwardVec, rightVec } from '../utils/math.js';
const P=Config.PHYSICS, N=Config.NOS, V=Config.VEHICLE;
export function createVehicleState() {
  return { x:0,z:0,angle:0,velX:0,velZ:0,fwdSpd:0,latSpd:0,steer:0,
    fuel:V.FUEL_CAPACITY,damage:0,nos:N.CAPACITY,isDrifting:false,isUsingNos:false,
    handbraking:false,onRoad:true,gear:0,rpm:P.RPM_IDLE,wheelRot:0,bodyRoll:0,
    bodyPitch:0,neonHue:20,speedKMH:0 };
}
export function stepVehiclePhysics(state,input,isOnRoadFn,buildingGrid,isRaining,dt) {
  const throttle=input.up?1:(input.down?-1:0);
  const steerIn=input.left?-1:(input.right?1:0);
  state.onRoad=isOnRoadFn(state.x,state.z);
  state.handbraking=input.handbrake;
  const nosReady=state.nos>5&&Math.abs(state.fwdSpd)>N.SPEED_THRESHOLD;
  const wasNos=state.isUsingNos;
  state.isUsingNos=input.nos&&nosReady;
  let nosJustActivated=false;
  if(state.isUsingNos) state.nos=Math.max(0,state.nos-dt*N.DRAIN_RATE);
  else state.nos=Math.min(N.CAPACITY,state.nos+dt*N.REGEN_RATE);
  if(!wasNos&&state.isUsingNos) nosJustActivated=true;
  const fwd=forwardVec(state.angle), right=rightVec(state.angle);
  const vel=new THREE.Vector3(state.velX,0,state.velZ);
  state.fwdSpd=vel.dot(fwd); state.latSpd=vel.dot(right);
  let maxSpd=state.onRoad?P.MAX_SPEED:P.MAX_SPEED_OFFROAD;
  if(isRaining) maxSpd*=0.9;
  if(state.damage>V.FUEL_CAPACITY*V.DAMAGE_THRESH_PCT) maxSpd*=V.DAMAGE_MAX_SPEED_PCT;
  if(state.fuel<=0) maxSpd=Math.min(maxSpd,5);
  if(state.isUsingNos) maxSpd=P.MAX_SPEED_NOS;
  let engineForce=0;
  const speedRatio=Math.abs(state.fwdSpd)/(maxSpd||1);
  if(throttle>0){
    const torque=1.0-speedRatio*0.6;
    engineForce=P.ENGINE_FORCE*throttle*torque;
    if(state.isUsingNos) engineForce+=P.ENGINE_FORCE_NOS*(1-speedRatio*0.3);
    if(state.fwdSpd<0) engineForce*=2.0;
  }else if(throttle<0){
    engineForce=state.fwdSpd>0.5?-P.BRAKE_FORCE:P.REVERSE_FORCE*throttle;
  }else{ engineForce=-state.fwdSpd*P.ENGINE_BRAKE; }
  state.fwdSpd+=engineForce*dt;
  const drag=state.onRoad?P.DRAG:P.DRAG_OFFROAD;
  state.fwdSpd*=Math.pow(drag,dt*60);
  state.fwdSpd=clamp(state.fwdSpd,-maxSpd*0.35,maxSpd);
  if(Math.abs(state.fwdSpd)<0.05&&throttle===0) state.fwdSpd=0;
  const speedNorm=Math.abs(state.fwdSpd)/40;
  const maxSteer=P.STEER_MAX/(1+speedNorm*0.8);
  const steerRate=input.handbrake?P.STEER_RATE_DRIFT:P.STEER_RATE;
  const targetSteer=steerIn*maxSteer*(Math.abs(state.fwdSpd)>0.5?1:0);
  state.steer+=(targetSteer-state.steer)*steerRate*dt;
  let latGrip;
  if(input.handbrake&&Math.abs(state.fwdSpd)>3) latGrip=P.LATERAL_GRIP_DRIFT;
  else if(!state.onRoad) latGrip=0.60;
  else if(isRaining) latGrip=P.LATERAL_GRIP_RAIN;
  else latGrip=P.LATERAL_GRIP;
  state.latSpd*=Math.pow(latGrip,dt*60);
  state.isDrifting=Math.abs(state.latSpd)>P.DRIFT_LAT_THRESHOLD||(input.handbrake&&Math.abs(state.fwdSpd)>3);
  if(Math.abs(state.fwdSpd)>0.3){
    let turnRate=state.steer*Math.sign(state.fwdSpd);
    if(input.handbrake) turnRate*=1.5;
    state.angle+=turnRate*dt;
  }
  state.velX=fwd.x*state.fwdSpd+right.x*state.latSpd;
  state.velZ=fwd.z*state.fwdSpd+right.z*state.latSpd;
  const half=WORLD_SIZE/2-5;
  let nx=clamp(state.x+state.velX*dt,-half,half);
  let nz=clamp(state.z+state.velZ*dt,-half,half);
  const collisions=[];
  const pgx=Math.round((nx+WORLD_SIZE/2)/Config.WORLD.TILE_SIZE);
  const pgz=Math.round((nz+WORLD_SIZE/2)/Config.WORLD.TILE_SIZE);
  for(let ix=pgx-1;ix<=pgx+1;ix++){
    for(let iz=pgz-1;iz<=pgz+1;iz++){
      const b=buildingGrid[`${ix},${iz}`];
      if(!b) continue;
      const dx=nx-b.x, dz=nz-b.z;
      const px=b.w+2.0-Math.abs(dx), pz=b.d+2.0-Math.abs(dz);
      if(px>0&&pz>0){
        const impact=Math.abs(state.fwdSpd)+Math.abs(state.latSpd);
        if(px<pz){nx+=(dx>0?1:-1)*px;state.velX*=-P.COLLISION_BOUNCE;state.fwdSpd*=-P.COLLISION_BOUNCE;}
        else{nz+=(dz>0?1:-1)*pz;state.velZ*=-P.COLLISION_BOUNCE;state.fwdSpd*=-P.COLLISION_BOUNCE;}
        state.latSpd*=P.COLLISION_BOUNCE;
        if(impact>V.DAMAGE_IMPACT_THRESHOLD) collisions.push(impact);
      }
    }
  }
  state.x=nx; state.z=nz;
  if(Math.abs(state.fwdSpd)>0.3){
    state.fuel-=dt*(V.FUEL_IDLE_DRAIN+Math.abs(state.fwdSpd)*V.FUEL_SPEED_FACTOR+(state.isUsingNos?V.FUEL_NOS_DRAIN:0));
    state.fuel=Math.max(0,state.fuel);
  }
  state.wheelRot+=state.fwdSpd*dt*3;
  state.bodyRoll=state.latSpd*0.025+state.steer*speedNorm*-0.18;
  state.bodyPitch=-throttle*speedNorm*0.12-(state.handbraking?0.08:0);
  state.neonHue=(state.neonHue+15*dt)%60;
  _updateGearRpm(state,throttle);
  state.speedKMH=Math.abs(Math.round(state.fwdSpd*Config.PHYSICS.SPEED_KMH_FACTOR));
  return {nosJustActivated,nosJustDepleted:wasNos&&!state.isUsingNos&&state.nos<=0,fwd,right,collisions};
}
function _updateGearRpm(state,throttle){
  const absSpd=Math.abs(state.fwdSpd);
  const T=P.GEAR_THRESHOLDS, G=P.GEAR_MIN_SPEEDS;
  if(state.fwdSpd<-0.3) state.gear=-1;
  else if(absSpd<0.5) state.gear=0;
  else if(absSpd<T[1]) state.gear=1;
  else if(absSpd<T[2]) state.gear=2;
  else if(absSpd<T[3]) state.gear=3;
  else if(absSpd<T[4]) state.gear=4;
  else if(absSpd<T[5]) state.gear=5;
  else state.gear=6;
  const g=Math.max(0,state.gear);
  const gRange=((T[g]||120)-(G[g]||0))||0.01;
  state.rpm=g>0?P.RPM_DRIVE_BASE+((absSpd-(G[g]||0))/gRange)*(P.RPM_MAX-P.RPM_DRIVE_BASE):P.RPM_IDLE+Math.abs(throttle)*800;
  if(state.isUsingNos) state.rpm=Math.min(P.RPM_MAX,state.rpm*1.3);
  state.rpm=clamp(state.rpm,P.RPM_MIN,P.RPM_MAX);
}
