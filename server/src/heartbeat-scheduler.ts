export function runHeartbeatSchedulerTick(
  tick: () => Promise<void>,
  onError: (error: unknown) => void,
): Promise<void> {
  return Promise.resolve()
    .then(tick)
    .catch(onError);
}
