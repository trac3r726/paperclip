type ErrorLogger = (error: unknown) => void;

export function installUnhandledRejectionBoundary(onError: ErrorLogger) {
  const listener = (reason: unknown) => {
    onError(reason);
  };

  process.on("unhandledRejection", listener);
  return () => process.off("unhandledRejection", listener);
}
