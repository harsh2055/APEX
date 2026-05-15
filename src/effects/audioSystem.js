export class AudioSystem {
  constructor() {
    this._ctx=null; this._engineOsc=null; this._engineGain=null; this._engineFilter=null;
    this._screechGain=null; this._turboOsc=null; this._turboGain=null;
    this._nosOsc=null; this._nosGain=null; this._ready=false;
    this._crashBuffer=null;
  }
  init() {
    try {
      this._ctx=new(window.AudioContext||window.webkitAudioContext)();
      this._buildEngine(); this._buildScreech(); this._buildTurbo(); this._buildNos();
      this._loadCrashSound();
      this._ready=true;
    }catch(e){console.warn('[AudioSystem] init failed:',e);}
  }
  async _loadCrashSound() {
    try {
      const resp = await fetch('./sounds/fahhhhh.mp3');
      const arrayBuffer = await resp.arrayBuffer();
      this._crashBuffer = await this._ctx.decodeAudioData(arrayBuffer);
    } catch(e) { console.warn('Failed to load crash sound:', e); }
  }
  playCrashSound(intensity=1.0) {
    if(!this._ready) return;
    const ctx=this._ctx;
    if (this._crashBuffer) {
      const src=ctx.createBufferSource();
      src.buffer=this._crashBuffer;
      const g=ctx.createGain();
      g.gain.value=Math.min(1.0,intensity);
      src.connect(g); g.connect(ctx.destination);
      src.start();
    } else {
      // Synthesize crash: short noise burst
      const buf=ctx.createBuffer(1,ctx.sampleRate*0.3,ctx.sampleRate);
      const d=buf.getChannelData(0);
      for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.exp(-i/ctx.sampleRate*15);
      const src=ctx.createBufferSource(); src.buffer=buf;
      const g=ctx.createGain(); g.gain.value=Math.min(1.0,intensity*0.15);
      src.connect(g); g.connect(ctx.destination); src.start();
    }
  }
  update(state,latSpd) {
    if(!this._ready) return;
    const rpmNorm=state.rpm/8500;
    this._engineOsc.frequency.value=50+rpmNorm*160;
    this._engineFilter.frequency.value=150+rpmNorm*1200;
    this._engineGain.gain.value=0.04+rpmNorm*0.14;
    this._turboOsc.frequency.value=800+rpmNorm*5000;
    this._turboGain.gain.value=state.rpm>4000?0.03+rpmNorm*0.04:0;
    if(state.isUsingNos){
      this._nosOsc.frequency.value=80+Math.abs(state.fwdSpd)*0.5;
      this._nosGain.gain.value=0.35; this._engineGain.gain.value=0.18;
    }else{ this._nosGain.gain.value*=0.9; }
    this._screechGain.gain.value=state.isDrifting?Math.min(0.35,Math.abs(latSpd)/120):0;
  }
  _buildEngine() {
    const ctx=this._ctx;
    this._engineOsc=ctx.createOscillator(); this._engineOsc.type='sawtooth';
    this._engineFilter=ctx.createBiquadFilter(); this._engineFilter.type='lowpass'; this._engineFilter.frequency.value=200;
    this._engineGain=ctx.createGain(); this._engineGain.gain.value=0.07;
    this._engineOsc.connect(this._engineFilter); this._engineFilter.connect(this._engineGain); this._engineGain.connect(ctx.destination);
    this._engineOsc.start();
  }
  _buildScreech() {
    const ctx=this._ctx;
    const buf=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);
    const d=buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    const noise=ctx.createBufferSource(); noise.buffer=buf; noise.loop=true;
    const filt=ctx.createBiquadFilter(); filt.type='bandpass'; filt.frequency.value=3000; filt.Q.value=3;
    this._screechGain=ctx.createGain(); this._screechGain.gain.value=0;
    noise.connect(filt); filt.connect(this._screechGain); this._screechGain.connect(ctx.destination); noise.start();
  }
  _buildTurbo() {
    const ctx=this._ctx;
    this._turboOsc=ctx.createOscillator(); this._turboOsc.type='sine';
    this._turboGain=ctx.createGain(); this._turboGain.gain.value=0;
    this._turboOsc.connect(this._turboGain); this._turboGain.connect(ctx.destination); this._turboOsc.start();
  }
  _buildNos() {
    const ctx=this._ctx;
    this._nosOsc=ctx.createOscillator(); this._nosOsc.type='sawtooth'; this._nosOsc.frequency.value=80;
    const filt=ctx.createBiquadFilter(); filt.type='lowpass'; filt.frequency.value=400;
    this._nosGain=ctx.createGain(); this._nosGain.gain.value=0;
    this._nosOsc.connect(filt); filt.connect(this._nosGain); this._nosGain.connect(ctx.destination); this._nosOsc.start();
  }
}
