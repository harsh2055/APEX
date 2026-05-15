import { Bus, Events } from '../core/eventBus.js';
export class InputManager {
  constructor() {
    this.state = { up:false,down:false,left:false,right:false,handbrake:false,nos:false };
    this._bindKeyboard(); this._bindTouch();
  }
  _bindKeyboard() {
    window.addEventListener('keydown',e=>this._onKeyDown(e));
    window.addEventListener('keyup',  e=>this._onKeyUp(e));
  }
  _onKeyDown(e) {
    const k=e.key.toLowerCase();
    if(k==='w'||e.key==='ArrowUp')    this.state.up=true;
    if(k==='s'||e.key==='ArrowDown')  this.state.down=true;
    if(k==='a'||e.key==='ArrowLeft')  this.state.left=true;
    if(k==='d'||e.key==='ArrowRight') this.state.right=true;
    if(e.key===' '){e.preventDefault();this.state.handbrake=true;}
    if(e.key==='Shift'){e.preventDefault();this.state.nos=true;}
    if(k==='n') Bus.emit(Events.TOGGLE_NIGHT);
    if(k==='r') Bus.emit(Events.TOGGLE_RAIN);
    if(k==='c') Bus.emit(Events.CAMERA_CYCLE);
  }
  _onKeyUp(e) {
    const k=e.key.toLowerCase();
    if(k==='w'||e.key==='ArrowUp')    this.state.up=false;
    if(k==='s'||e.key==='ArrowDown')  this.state.down=false;
    if(k==='a'||e.key==='ArrowLeft')  this.state.left=false;
    if(k==='d'||e.key==='ArrowRight') this.state.right=false;
    if(e.key===' ')     this.state.handbrake=false;
    if(e.key==='Shift') this.state.nos=false;
  }
  _bindTouch() {
    const joyZone=document.getElementById('joystick-zone');
    const joyKnob=document.getElementById('joystick-knob');
    let joyId=null;
    if(!joyZone) return;
    const updateJoy=t=>{
      const rect=joyZone.getBoundingClientRect();
      let dx=t.clientX-(rect.left+rect.width/2), dy=t.clientY-(rect.top+rect.height/2);
      const d=Math.sqrt(dx*dx+dy*dy), m=rect.width/2-25;
      if(d>m){dx=(dx/d)*m;dy=(dy/d)*m;}
      joyKnob.style.transform=`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      this.state.up=dy/m<-0.3; this.state.down=dy/m>0.3; this.state.left=dx/m<-0.3; this.state.right=dx/m>0.3;
    };
    joyZone.addEventListener('touchstart',e=>{e.preventDefault();joyId=e.changedTouches[0].identifier;updateJoy(e.changedTouches[0]);},{passive:false});
    joyZone.addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches)if(t.identifier===joyId)updateJoy(t);},{passive:false});
    joyZone.addEventListener('touchend',e=>{e.preventDefault();joyKnob.style.transform='translate(-50%,-50%)';this.state.up=this.state.down=this.state.left=this.state.right=false;joyId=null;},{passive:false});
    [{id:'btn-brake',keys:['down']},{id:'btn-drift',keys:['handbrake']},{id:'btn-nos',keys:['nos']}].forEach(({id,keys})=>{
      const el=document.getElementById(id);
      if(!el)return;
      el.addEventListener('touchstart',e=>{e.preventDefault();keys.forEach(k=>this.state[k]=true);},{passive:false});
      el.addEventListener('touchend',  e=>{e.preventDefault();keys.forEach(k=>this.state[k]=false);},{passive:false});
    });
  }
}
