// Node 20.19+/22+ ships an experimental global Web Storage API that defines
// `localStorage`/`sessionStorage` accessors directly on `globalThis` (their
// getters return `undefined` unless `--localstorage-file` is passed). Vitest's
// happy-dom environment aliases `window` to `globalThis` itself and only
// installs its own live-getter for a window property when that property is
// *not already present* on `globalThis` (see `populateGlobal`'s
// `getWindowKeys` in vitest's happy-dom environment setup). Since
// `localStorage`/`sessionStorage` aren't in vitest's fixed key allowlist,
// Node's own (broken, in test contexts) accessor silently wins and shadows
// happy-dom's real Storage-backed implementation — breaking any test that
// touches `localStorage`.
//
// Because `window === globalThis` in vitest's happy-dom setup, there is no
// separate `window.localStorage` reference left to recover — Node's stub
// already occupies the only slot. The `Storage` class itself, however, *is*
// copied onto the global (happy-dom's own class, no window binding required
// per happy-dom's implementation), so the fix is to detect a non-functional
// `localStorage`/`sessionStorage` and rebind it to a fresh `Storage` instance.
//
// This is a no-op when Node has no experimental webstorage global (older
// Node): in that case `globalThis.localStorage` was never pre-defined, so
// vitest's own getter for it (proxying happy-dom's real window storage)
// installs normally and already behaves like a Storage instance.
//
// Reading Node's stub getter (to feature-detect it below) triggers Node's
// one-time `ExperimentalWarning: localStorage is not available because
// --localstorage-file was not provided.` on stderr. That warning is about
// Node's own inert stub, which we're about to replace, so it's noise here —
// filter only that exact warning; everything else still passes through.
const nodeProcess = (globalThis as unknown as { process?: NodeJS.Process }).process;
if (nodeProcess?.emitWarning) {
  nodeProcess.removeAllListeners('warning');
  nodeProcess.on('warning', (warning) => {
    const isWebStorageStub =
      warning.name === 'ExperimentalWarning' && /--localstorage-file/.test(warning.message);
    if (!isWebStorageStub) {
      console.warn(warning);
    }
  });
}

const StorageCtor = (globalThis as unknown as { Storage?: new () => Storage }).Storage;

if (typeof StorageCtor === 'function') {
  for (const key of ['localStorage', 'sessionStorage'] as const) {
    const current = (globalThis as unknown as Record<string, unknown>)[key];
    const isUsableStorage =
      !!current &&
      typeof (current as Partial<Storage>).getItem === 'function' &&
      typeof (current as Partial<Storage>).setItem === 'function' &&
      typeof (current as Partial<Storage>).clear === 'function';

    if (!isUsableStorage) {
      Object.defineProperty(globalThis, key, {
        value: new StorageCtor(),
        configurable: true,
        writable: true,
      });
    }
  }
}
