import { Computed } from './signal';

let effectSignals = [];
export function effect(fn) {
  const effectSignal = new Computed(() => fn());
  effectSignal.get();
  effectSignals.push(effectSignal);
}

function startEffectFlushLoop() {
  queueMicrotask(() => {
    for (const effectSignal of effectSignals) {
      effectSignal.get();
    }
    requestAnimationFrame(startEffectFlushLoop);
  });
}

startEffectFlushLoop();
