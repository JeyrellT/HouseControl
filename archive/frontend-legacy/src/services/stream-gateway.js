const listeners = new Set();

const gatewayStatus = {
  state: "standby",
  transport: "mock-placeholder",
  channelsReady: ["overview", "monitoring", "recommendations"]
};

export async function connect() {
  gatewayStatus.state = "connected";
  return Promise.resolve({ ...gatewayStatus });
}

export async function disconnect() {
  gatewayStatus.state = "standby";
  return Promise.resolve({ ...gatewayStatus });
}

export function subscribe(listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export async function getStatus() {
  return Promise.resolve({ ...gatewayStatus });
}
