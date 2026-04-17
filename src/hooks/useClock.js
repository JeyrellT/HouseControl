import { useSyncExternalStore } from "react";

function createClockStore() {
  let now = new Date();
  let intervalId = null;
  const listeners = new Set();

  function emitTick() {
    now = new Date();
    listeners.forEach((listener) => listener());
  }

  function start() {
    if (intervalId !== null) {
      return;
    }

    intervalId = window.setInterval(emitTick, 1000);
  }

  function stop() {
    if (intervalId === null) {
      return;
    }

    window.clearInterval(intervalId);
    intervalId = null;
  }

  return {
    subscribe(listener) {
      listeners.add(listener);

      if (typeof window !== "undefined") {
        start();
      }

      return () => {
        listeners.delete(listener);

        if (listeners.size === 0) {
          stop();
        }
      };
    },
    getSnapshot() {
      return now;
    },
    getServerSnapshot() {
      return now;
    }
  };
}

const clockStore = createClockStore();

export function useClock() {
  return useSyncExternalStore(
    clockStore.subscribe,
    clockStore.getSnapshot,
    clockStore.getServerSnapshot
  );
}
