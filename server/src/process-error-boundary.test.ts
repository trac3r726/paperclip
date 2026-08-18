import { describe, expect, it, vi } from "vitest";
import { installUnhandledRejectionBoundary } from "./process-error-boundary.js";

describe("installUnhandledRejectionBoundary", () => {
  it("contains an otherwise unhandled request rejection at the process boundary", () => {
    const onError = vi.fn();
    const remove = installUnhandledRejectionBoundary(onError);
    const error = Object.assign(new Error("validation failed"), { status: 422 });
    const rejected = Promise.resolve();

    try {
      process.emit("unhandledRejection", error, rejected);
      expect(onError).toHaveBeenCalledWith(error);
    } finally {
      remove();
    }
  });
});
