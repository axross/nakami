# Current External Documentation

Apply this reference when a change depends on framework, platform, service, or tool behavior that may have changed since the local skill was written. Official docs are part of the implementation context for these surfaces.

## When to Refresh Docs

Use current official docs before changing behavior governed by fast-moving frameworks, services, or tools that the project depends on. The table below lists representative surfaces by tool token; delete rows for tools the project does not use during INIT, and add rows for any other fast-moving dependency.

| Surface | Refresh docs before changing |
| ------- | ---------------------------- |
| Expo (React Native) | Routing (Expo Router), app config and config plugins, native module APIs, asset/image behavior. Expo has breaking changes between SDKs — use the exact versioned docs for the installed SDK (currently <https://docs.expo.dev/versions/v57.0.0/>) |
| Drizzle ORM over expo-sqlite | Schema/table definitions, column types, query APIs, relation helpers, drizzle-kit migration generation, the expo-sqlite driver and runtime migrator |
| Sentry | SDK setup (`@sentry/react-native` + its Expo config plugin), instrumentation, source maps, event capture, PII behavior |
| EAS (Expo Application Services) | Deployment/runtime behavior, asset optimization, storage, environment variables |
| Maestro | Test runner configuration, snapshot behavior, locator/assertion APIs |
| Biome | Formatter/linter configuration, suppression syntax, rule names |

**Guidelines:**

- MUST consult current official docs before changing any surface listed in the table.
- MUST use official docs as the primary source; use blog posts, examples, or issues only as secondary context.
- MUST mention the docs consulted in the final summary when the implementation depends on a current-docs decision.
- MUST NOT rely only on memory for APIs, defaults, or behavior that the relevant vendor may have changed.
- SHOULD limit the docs lookup to the smallest surface needed for the task.

## Project-Specific Current-Docs Triggers

Some project areas are especially sensitive because a small API mismatch can produce production-only failures. List the project's own high-sensitivity config files and entry points here during INIT.

**Guidelines:**

- MUST refresh Expo (React Native) docs — at the installed SDK's versioned URL — before changing routing, `app.json`/config plugins, native module usage, or framework configuration files.
- MUST refresh Drizzle ORM over expo-sqlite docs before changing schemas, migrations, or driver integration.
- MUST refresh Sentry docs before changing its initialization/instrumentation files, event-capture behavior, source maps, or PII settings.
- MUST refresh EAS (Expo Application Services) docs before changing deployment/runtime assumptions, storage usage, or environment-variable exposure.
- SHOULD refresh Maestro or Biome docs before changing their configuration files, snapshot behavior, or suppression syntax.
