// `updatedAt` doubles as the issue's optimistic-concurrency version: it
// changes on every committed write, so a client that read the issue can
// pass it back via `If-Match` to detect a write that happened in between,
// without a dedicated version column.
export function issueUpdatedAtETag(updatedAt: Date): string {
  return `"${updatedAt.toISOString()}"`;
}

export function ifMatchHeaderSatisfied(ifMatchHeader: string, etag: string): boolean {
  return ifMatchHeader
    .split(",")
    .map((value) => value.trim())
    .some((value) => value === "*" || value === etag);
}
