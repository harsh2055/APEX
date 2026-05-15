import { Tier } from '../core/config.js';
export class HUD {
  constructor() {
    this._ticksInit=false;
    this._el={
      spdVal:document.getElementById('spd-val'), spdUnit:document.getElementById('spd-unit'),
      gearBox:document.getElementById('gear-box'), rpmBar:document.getElementById('rpm-bar'),
      speedArcBg:document.getElementById('speed-arc-bg'), speedArc:document.getElementById('speed-arc'),
      needle:document.getElementById('needle'), ticks:document.getElementById('ticks'),
      fuelFill:document.getElementById('fuel-fill'), dmgFill:document.getElementById('dmg-fill'),
      nosBarInner:document.getElementById('nos-bar-inner'), dmgFlash:document.getElementById('dmg-flash'),
      nosFlash:document.getElementById('nos-flash'), speedLines:document.getElementById('speed-lines'),
      money:document.getElementById('money'), missionText:document.getElementById('mission-text'),
      wanted:document.getElementById('wanted'), wStars:[1,2,3,4,5].map(i=>document.getElementById('s'+i)),
      perf:document.getElementById('perf'),
    };
    this._buildTicks();
    // Show quality tier in perf counter
    if (this._el.perf) this._el.perf.dataset.tier = Tier;
  }
  show() { document.getElementById('hud').style.display='block'; }
  update(state) { this._updateSpeedometer(state); this._updateBars(state); this._updateSpeedLines(state); this._updateNosFlash(state); }
  updateMoney(amount) { this._el.money.innerText=`$${amount.toLocaleString()}`; }
  updateMissionText(text) { this._el.missionText.innerText=text; }
  updateWanted(level) {
    this._el.wanted.style.opacity=level>0?'1':'0';
    this._el.wStars.forEach((s,i)=>{ s.className='wstar'+(i<level?' active':''); });
  }
  flashDamage() {
    this._el.dmgFlash.style.background='rgba(255,0,0,0.4)';
    setTimeout(()=>{this._el.dmgFlash.style.background='rgba(255,0,0,0)';},200);
  }
  flashNos() {
    this._el.nosFlash.style.background='rgba(255,80,0,0.2)';
    setTimeout(()=>{this._el.nosFlash.style.background='rgba(255,100,0,0)';},200);
  }
  updateFps(fps) {
    const tier = this._el.perf.dataset.tier || Tier;
    this._el.perf.innerText=`${fps} FPS · ${tier}`;
  }
  _updateSpeedometer(state) {
    const kmh=state.speedKMH, pct=Math.min(1,kmh/500);
    const cx=110,cy=110,r=82;
    this._el.spdVal.innerText=kmh; this._el.spdVal.className=state.isUsingNos?'nos-active':'';
    const startA=-220*Math.PI/180, sweep=260*Math.PI/180, endA=40*Math.PI/180;
    const fillEnd=startA+sweep*pct;
    this._el.speedArcBg.setAttribute('d',this._arc(cx,cy,r,startA,endA));
    this._el.speedArc.setAttribute('d',pct>0.01?this._arc(cx,cy,r,startA,fillEnd):'');
    this._el.speedArc.setAttribute('stroke',state.isUsingNos?'#FF4400':(pct>0.7?'#ff8800':'#FF6600'));
    const needleAngle=(-220+260*pct)*Math.PI/180-Math.PI/2;
    this._el.needle.setAttribute('x2',cx+72*Math.cos(needleAngle));
    this._el.needle.setAttribute('y2',cy+72*Math.sin(needleAngle));
    const gearLabels=['R','N','1','2','3','4','5','6'];
    this._el.gearBox.innerText=gearLabels[state.gear+1]||'N';
    this._el.rpmBar.style.width=(state.rpm/8500*100)+'%';
  }
  _updateBars(state) {
    this._el.fuelFill.style.width=state.fuel+'%';
    this._el.fuelFill.style.background=state.fuel<20?'#e74c3c':'#f1c40f';
    this._el.dmgFill.style.width=state.damage+'%';
    this._el.nosBarInner.style.width=state.nos+'%';
    this._el.nosBarInner.className=state.isUsingNos?'active':'';
  }
  _updateSpeedLines(state) {
    const ratio=Math.abs(state.fwdSpd)/95;
    if(ratio>0.6||state.isUsingNos){
      const intensity=state.isUsingNos?1.0:(ratio-0.6)/0.4;
      this._el.speedLines.style.opacity=(intensity*0.4).toFixed(2);
      this._el.speedLines.style.background=state.isUsingNos
        ?'radial-gradient(ellipse at center,transparent 20%,rgba(255,80,0,0.08) 80%)'
        :'radial-gradient(ellipse at center,transparent 20%,rgba(255,180,50,0.05) 80%)';
    }else this._el.speedLines.style.opacity='0';
  }
  _updateNosFlash(state) { if(!state.isUsingNos) this._el.nosFlash.style.background='rgba(255,100,0,0)'; }
  _arc(cx,cy,r,startA,endA) {
    const sx=cx+r*Math.cos(startA-Math.PI/2), sy=cy+r*Math.sin(startA-Math.PI/2);
    const ex=cx+r*Math.cos(endA-Math.PI/2),   ey=cy+r*Math.sin(endA-Math.PI/2);
    const lg=(endA-startA)>Math.PI?1:0;
    return `M ${sx} ${sy} A ${r} ${r} 0 ${lg} 1 ${ex} ${ey}`;
  }
  _buildTicks() {
    const cx=110,cy=110;
    for(let i=0;i<=10;i++){
      const a=(-220+26*i)*Math.PI/180-Math.PI/2, r1=88, r2=i%5===0?74:83;
      const line=document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1',cx+r1*Math.cos(a)); line.setAttribute('y1',cy+r1*Math.sin(a));
      line.setAttribute('x2',cx+r2*Math.cos(a)); line.setAttribute('y2',cy+r2*Math.sin(a));
      line.setAttribute('stroke',i%5===0?'rgba(255,180,50,0.6)':'rgba(255,150,0,0.25)');
      line.setAttribute('stroke-width',i%5===0?'2':'0.8');
      this._el.ticks.appendChild(line);
    }
  }
}
