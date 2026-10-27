(function () {
  const SP = window.SP = window.SP || {};
  const KEY = `supplyflow-guided-v1`;
  const clone = (state) => JSON.parse(JSON.stringify(state));
  // Repository contract: load() => state, save(state) => void, reset() => state.
  // Future Firebase adapter can implement the same API while retaining all UI and planning calculations.
  class LocalRepository {
    constructor() { this.persistent = true; this.warned = false; }
    load() {
      try { const json = localStorage.getItem(KEY); if(json) {const state=JSON.parse(json);if(state.version===1) return state;} }
      catch(err) {console.warn(`Local storage unavailable`,err);}
      return this.reset();
    }
    save(state) {try {localStorage.setItem(KEY,JSON.stringify(state));this.persistent = true;} catch(err) {this.persistent = false;if(!this.warned){console.warn(`Browser storage unavailable: using temporary memory-only data`,err);this.warned=true;}} }
    reset() {const state=SP.seed();this.save(state);return state;}
  }
  const repository = new LocalRepository();
  let current = repository.load();
  const uid = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;
  const mutate = (title,subject,cb,detail=``) => {
    const next=clone(current);
    cb(next);
    next.audit.unshift({id:uid(`AUD`),at:new Date().toISOString(),action:title,subject,details:detail});
    next.audit=next.audit.slice(0,400);
    repository.save(next);
    current=next;
    return current;
  };
  SP.store = { get:()=>current, mutate, uid, reset:()=>{current=repository.reset();return current;}, repository };
})();
