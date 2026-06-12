const startedAt = Date.now();

const counters = {
  requests: 0,
  errors: 0,
  responsesByStatus: new Map<number, number>()
};

export const recordResponse = (status: number) => {
  counters.requests += 1;
  counters.responsesByStatus.set(status, (counters.responsesByStatus.get(status) || 0) + 1);
  if (status >= 500) counters.errors += 1;
};

export const monitoringSnapshot = () => ({
  uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
  requests: counters.requests,
  errors: counters.errors,
  responsesByStatus: Object.fromEntries(counters.responsesByStatus)
});

export const resetMonitoring = () => {
  counters.requests = 0;
  counters.errors = 0;
  counters.responsesByStatus.clear();
};
