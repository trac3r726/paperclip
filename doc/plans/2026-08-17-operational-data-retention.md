# Operational data retention

Status: proposal

## Finding

Paperclip does not currently prune `agent_wakeup_requests`, `heartbeat_run_events`, or
`activity_log`. Database-backup and decision-retention policies do not cover these
operational tables.

On the measured SSC Ops database, `agent_wakeup_requests` contained 397,340 rows,
including 348,723 (87.8%) with `status = 'skipped'`. Read-only `EXPLAIN (ANALYZE,
BUFFERS)` showed that the issue lookup used the existing company/status B-tree and
filtered 26 active candidates in 5.16 ms. The top-level `payload ->> 'issueId'`
lookup completed in 1.24 ms. These queries are not the source of the observed
seven-minute boot on this dataset.

A generic GIN index on `payload` would not accelerate the current `->>` equality
predicates. It would require rewriting lookups as JSON containment (`@>`) and still
would not naturally cover the four legacy payload shapes. Migration 0209 already
adds the more appropriate company plus expression B-tree for the common top-level
shape; it had not yet been applied to the measured deployment.

## Proposed feature

Add an operator-configurable operational-retention policy, disabled by default for
backward compatibility, with these initial defaults when enabled:

- terminal `agent_wakeup_requests`: 30 days; never delete queued, claimed, or
  deferred requests;
- `heartbeat_run_events`: 90 days, only for terminal heartbeat runs;
- `activity_log`: retain indefinitely by default because it is the governance audit
  trail; allow an explicit compliance policy to archive it before deletion.

Run pruning after a successful database backup and periodically thereafter. Use
small keyset-paginated batches ordered by an indexed timestamp plus `id`, commit each
batch independently, expose deleted-row counts and duration in structured logs, and
stop on a time budget so maintenance cannot delay startup.

Foreign-key order matters: archive/delete eligible activity rows and run events
before deleting terminal heartbeat runs, then delete unreferenced terminal wakeup
requests. A dry-run API should report eligible counts and oldest/newest timestamps.
The implementation should add timestamp/status indexes concurrently (or in a
separate operator-safe migration phase) before enabling the sweeper on large
installations.

## Acceptance criteria

- policy is configurable per instance and visible in instance settings;
- dry-run and apply modes report exact per-table counts;
- active work and non-terminal runs are never eligible;
- pruning is bounded, resumable, observable, and covered by FK-integrity tests;
- the last successful backup must predate the pruning cutoff;
- activity-log deletion requires an explicit non-default compliance setting.
