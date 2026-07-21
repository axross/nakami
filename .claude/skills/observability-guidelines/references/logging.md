# Logging

Apply these rules when writing, reviewing, or modifying any code that emits log output.

## When to Log

A log line pays off during an incident, when the question is which operation was in flight and how far it got — the operations that stall or fail are the ones worth bracketing.

**Guidelines:**

- SHOULD log the start and end of any operation that is slow, depends on an external system, or can fail (e.g., database queries, HTTP fetches, sign-in requests, file or media processing).
- SHOULD bracket an operation's internal step-by-step lifecycle at `debug` and surface only its user-significant milestone at `info` (see [Log Levels](#log-levels)) — trace the steps without burying the milestone.
- SHOULD log unexpected-but-recoverable conditions (e.g., a record was skipped due to a parse error, an invariant was violated but execution continued).
- SHOULD NOT log trivial or extremely frequent operations (e.g., individual UI renders, synchronous computations).

## Log Levels

Levels are the filter operators reach for under pressure, so a message at the wrong level is either noise burying a signal or a signal buried in noise. The root logger runs at `debug` severity in every build (see `src/core/helpers/logging.ts`) so that every level reaches the transports; the **console** output is what's gated to development, while **all** levels — `debug` included — are recorded as breadcrumbs on the error tracker (see [Breadcrumbs](#breadcrumbs)). Pick the level from what the line is for and how visible it should be:

| Level | Use for | Production console | Production breadcrumb |
|---|---|---|---|
| `debug` | Routine, verbose, or high-frequency step-by-step tracing of an operation's internal lifecycle — valuable while developing or reproducing a problem, too noisy to print in production. | No | Yes |
| `info` | Notable normal-progress milestones worth surfacing in production — the completion of a cross-boundary or user-significant operation such as a sign-in or a session refresh, not each internal step of it. | Yes | Yes |
| `warn` | Recoverable unexpected conditions — execution continues but something is worth investigating (a deferred refresh, a skipped record, a violated invariant). | Yes | Yes |
| `error` | Never — report the error to Sentry via `reportError(...)` and let it propagate. | — | — |

**Guidelines:**

- SHOULD use `logger.debug()` for routine lifecycle tracing — the per-step "started / completed" bracketing of an operation's internals — since the production logger suppresses it and it would otherwise bury production `info`.
- SHOULD use `logger.info()` only for milestones that stay valuable in production: the completion of a user-significant or cross-system operation, not each internal step of it.
- SHOULD use `logger.warn()` for recoverable unexpected conditions — cases where execution continues but something is worth investigating.
- MUST NOT use `logger.error()` for errors — report the error to Sentry (via `reportError(...)`) and let it propagate. See [Error Handling](./error-handling.md).
- SHOULD prefer `debug` over `info` when unsure: a routine trace that turns out to matter is cheap to promote later, whereas surplus production `info` is exactly the noise the level system exists to keep out.

```typescript
// Routine internal steps → debug (no production console, still a breadcrumb)
logger.debug("Started login request.", { serverUrl });
logger.debug("Completed login request.", { serverUrl, status });

// User-significant milestone → info (production console + breadcrumb)
logger.info("Completed signing in.", { serverUrl });
```

## Logger Setup

The project logs through react-native-logs, wrapped by `src/core/helpers/logging.ts`. That helper owns the single root logger; modules never construct their own.

**Guidelines:**

- MUST obtain loggers via `createModuleLogger(moduleName)` from `~/core/helpers/logging` instead of instantiating react-native-logs directly in a module — the helper's root logger owns severity and transport configuration.
- MUST create one module logger per module, named for the module's concern (`createModuleLogger("feeds/queries")`); react-native-logs prefixes every line with that namespace (its `.extend()` mechanism), so lines are filterable by module:

```typescript
import { createModuleLogger } from "~/core/helpers/logging";

const logger = createModuleLogger("data-fetch");
```

- SHOULD choose a module name that represents the module's concern at a glance and is unique per module, so log lines can be filtered without reading the full path.

## Breadcrumbs

The root logger's transport mirrors **every** log line onto the error tracker's breadcrumb trail (via `addBreadcrumb` in `~/core/helpers/error-reporting`), so a later captured exception arrives with the lines that led up to it. Logging is therefore the breadcrumb mechanism — you get the trail for free by logging well. See [error-tracking.md](./error-tracking.md#breadcrumbs) for what breadcrumbs are and how they reach Sentry.

**Guidelines:**

- SHOULD rely on ordinary log calls to populate the breadcrumb trail rather than calling `addBreadcrumb` directly; reserve a direct call for a non-log event worth placing on the timeline.
- MUST keep the trailing context object free of secrets and PII (restating the rule above) — it is copied verbatim into breadcrumb `data` and shipped to the error tracker alongside the next exception.
- SHOULD log the `debug` steps that bracket an operation even though they are dropped from production console output: breadcrumbs are retained regardless of console severity, so those steps still enrich a captured exception.

## Structured Log Format

react-native-logs log methods accept multiple arguments and append them to the line — objects are stringified by the transport. Pass the message string first, then one context object with the searchable fields.

```typescript
// No context needed
logger.info("Started fetching records.");

// With context
logger.info("Started fetching record.", { id });
logger.info("Completed fetching record.", {
	id,
	duration: performance.now() - startedAt,
});
```

**Guidelines:**

- MUST pass the message string as the first argument; attach context as a single trailing object rather than interpolating values into the message.
- SHOULD include identifiers (e.g., an entity `id`, `url`, `filename`) in the context object so log lines are searchable and filterable.
- SHOULD include timing information (`duration`) in "completed" log lines for operations where latency matters.
- MUST NOT log values that can contain sensitive user data (passwords, tokens, PII). Log only identifiers and metadata.

## Message Conventions

Log messages SHOULD follow a consistent past-tense / gerund-phrase pattern that makes log streams easy to scan:

| Moment | Prefix | Example |
|---|---|---|
| Beginning of an operation | `"Started ..."` | `"Started fetching records."` |
| Successful completion | `"Completed ..."` or `"Finished ..."` | `"Completed fetching external metadata."` |
| Recoverable skip / partial failure | Descriptive past tense | `"Skipped a record due to parse error."` |

```typescript
// CORRECT
logger.info("Started fetching external metadata.", { url });
// ... operation ...
logger.info("Completed fetching external metadata.", { url, duration });

// CORRECT — warn on recoverable skip
logger.warn("Skipped a record due to parse error.", {
	id: record.id,
	error: parseError,
});

// WRONG — vague, not scannable
logger.info("done");
logger.info("error fetching record");
```

**Guidelines:**

- MUST end every log message with a period (`.`) for grammatical consistency.
