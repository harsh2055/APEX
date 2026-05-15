export class ObjectPool {
  constructor(factory, initialSize=64) {
    this._factory = factory;
    this._pool = [];
    for (let i=0;i<initialSize;i++) this._pool.push(factory());
  }
  acquire() { return this._pool.length>0 ? this._pool.pop() : this._factory(); }
  release(obj) { this._pool.push(obj); }
  get available() { return this._pool.length; }
}
