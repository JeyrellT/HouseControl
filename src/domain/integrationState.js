export const INTEGRATION_STATUSES = {
  IDLE: "idle",
  LOADING: "loading",
  ERROR: "error",
  DEGRADED: "degraded",
  READY: "ready"
};

export function createIntegrationState({
  status = INTEGRATION_STATUSES.IDLE,
  error = null,
  degradedReason = null,
  syncedAt = null
} = {}) {
  return {
    status,
    error,
    degradedReason,
    syncedAt
  };
}

