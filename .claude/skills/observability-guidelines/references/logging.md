# Logging

Apply these rules when writing, reviewing, or modifying any code that emits log output.

## When to Log

A log line pays off during an incident, when the question is which operation was in flight and how far it got — the operations that stall or fail are the ones worth bracketing.

**Guidelines:**

- SHOULD log the start and end of any operation that is slow, depends on an external system, or can fail (e.g., database queries, HTTP fetches, file or media processing).
- SHOULD log unexpected-but-recoverable conditions (e.g., a record was skipped due to a parse error).
- SHOULD NOT log trivial or extremely frequent operations (e.g., individual UI renders, synchronous computations).

## Log Levels

Levels are the filter operators reach for under pressure, so a message at the wrong level is either noise burying a signal or a signal buried in noise.

**Guidelines:**

- SHOULD use `logger.info()` for informational messages that describe normal progress.
- SHOULD use `logger.warn()` for recoverable unexpected conditions — cases where execution continues but something is worth investigating.
- MUST NOT use `logger.error()` for errors — report the error to Sentry (via `reportError(...)`) and let it propagate. See [Error Handling](./error-handling.md).

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
