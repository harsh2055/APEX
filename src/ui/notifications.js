import { Bus, Events } from '../core/eventBus.js';
const DISPLAY_MS=2800;
export class NotificationSystem {
  constructor() {
    this._el=document.getElementById('notif'); this._timeout=null;
    Bus.on(Events.SHOW_NOTIF,    msg => this.show(msg));
    Bus.on(Events.NOS_ENGAGED,   ()  => this.show('🔥 NOS ENGAGED!'));
    Bus.on(Events.NOS_DEPLETED,  ()  => this.show('NOS DEPLETED'));
    Bus.on(Events.FARE_COMPLETE, ()  => this.show(`+$500 — FARE COMPLETE!`));
    Bus.on(Events.PASSENGER_PICKUP,()=> this.show('PASSENGER PICKED UP!'));
  }
  show(text) {
    if(!this._el) return;
    this._el.innerText=text; this._el.style.opacity='1';
    clearTimeout(this._timeout);
    this._timeout=setTimeout(()=>{this._el.style.opacity='0';},DISPLAY_MS);
  }
}
