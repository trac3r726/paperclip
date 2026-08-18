import { describe, expect, it, vi } from "vitest";
import { runHeartbeatSchedulerTick } from "./heartbeat-scheduler.js";

describe("runHeartbeatSchedulerTick", () => {
  it("contains request errors so a later scheduler tick can still run", async () => {
    const requestError = { status: 422, message: "Unprocessable Entity" };
    const onError = vi.fn();
    const successfulTick = vi.fn(async () => undefined);

    await expect(runHeartbeatSchedulerTick(async () => {
      throw requestError;
    }, onError)).resolves.toBeUndefined();

    expect(onError).toHaveBeenCalledWith(requestError);
    await expect(runHeartbeatSchedulerTick(successfulTick, onError)).resolves.toBeUndefined();
    expect(successfulTick).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledOnce();
  });
});
