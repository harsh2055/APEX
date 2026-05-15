// ─── EVENT BUS ────────────────────────────────────────────────────────────
export class EventBus {
  constructor() { this._listeners = new Map(); }
  on(event, handler) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }
  off(event, handler) { this._listeners.get(event)?.delete(handler); }
  emit(event, payload) { this._listeners.get(event)?.forEach(h => h(payload)); }
  once(event, handler) {
    const wrapper = payload => { handler(payload); this.off(event, wrapper); };
    this.on(event, wrapper);
  }
}
export const Bus = new EventBus();
export const Events = Object.freeze({
  COLLISION: 'collision', OFFROAD: 'offroad',
  NOS_ENGAGED: 'nos:engaged', NOS_DEPLETED: 'nos:depleted',
  TRAFFIC_HIT: 'traffic:hit',
  PASSENGER_PICKUP: 'mission:pickup', PASSENGER_DROPOFF: 'mission:dropoff', FARE_COMPLETE: 'mission:fare_complete',
  TOGGLE_NIGHT: 'env:night', TOGGLE_RAIN: 'env:rain',
  FUEL_EMPTY: 'vehicle:fuel_empty', DAMAGE_UPDATE: 'vehicle:damage',
  SHOW_NOTIF: 'ui:notif', MONEY_CHANGED: 'ui:money', WANTED_CHANGED: 'ui:wanted',
  GAME_STARTED: 'game:started', CAMERA_CYCLE: 'camera:cycle',
});
