# Current External Documentation

Apply this reference when a change depends on framework, platform, service, or tool behavior that may have changed since the local skill was written. Official docs are part of the implementation context for these surfaces.

## When to Refresh Docs

Use current official docs before changing behavior governed by fast-moving frameworks, services, or tools that the project depends on. The table below lists the project's fast-moving dependencies; add rows when a new one lands.

| Surface | Refresh docs before changing |
| ------- | ---------------------------- |
| Expo (React Native) | Routing (Expo Router), app config and config plugins, native module APIs, asset/image behavior. Expo has breaking changes between SDKs — use the exact versioned docs for the installed SDK (currently <https://docs.expo.dev/versions/v57.0.0/>) |
| React Native native modules (reanimated, worklets, screens, gesture-handler, unistyles, nitro-modules, react-native-svg) | Each module's own compatibility table and peer-dependency ranges against the **exact** installed React Native version. The Expo SDK pin can lag or mismatch a module's real RN support — e.g. the SDK pinning a `react-native-reanimated` patch whose own compatibility table lists the shipped RN version as unsupported. Check when a native crash (hard crash, no JS error / no Sentry event) implicates one of these, or before bumping or aligning their versions. |
| Drizzle ORM over expo-sqlite | Schema/table definitions, column types, query APIs, relation helpers, drizzle-kit migration generation, the expo-sqlite driver and runtime migrator |
| Sentry | SDK setup (`@sentry/react-native` + its Expo config plugin), instrumentation, source maps, event capture, PII behavior |
| Maestro | Test runner configuration, snapshot behavior, locator/assertion APIs |
| Biome | Formatter/linter configuration, suppression syntax, rule names |

**Guidelines:**

- MUST consult current official docs before changing any surface listed in the table.
- MUST use official docs as the primary source; use blog posts, examples, or issues only as secondary context.
- MUST mention the docs consulted in the final summary when the implementation depends on a current-docs decision.
- MUST NOT rely only on memory for APIs, defaults, or behavior that the relevant vendor may have changed.
- MUST verify a React Native native module's own compatibility table and peer-dependency ranges against the exact installed React Native version — not only the Expo SDK pin — when a native crash implicates that module or before changing its version.
- SHOULD limit the docs lookup to the smallest surface needed for the task.

## Project-Specific Current-Docs Triggers

Some project areas are especially sensitive because a small API mismatch can produce production-only failures: `app.json` (config plugins), `babel.config.js`, `metro`-related config, `drizzle.config.ts` and `src/core/db/`, and the Sentry/Unistyles initialization in `src/core/helpers/` and `src/unistyles.ts`.

**Guidelines:**

- MUST refresh Expo (React Native) docs — at the installed SDK's versioned URL — before changing routing, `app.json`/config plugins, native module usage, or framework configuration files.
- MUST refresh Drizzle ORM over expo-sqlite docs before changing schemas, migrations, or driver integration.
- MUST refresh Sentry docs before changing its initialization/instrumentation files, event-capture behavior, source maps, or PII settings.
- SHOULD refresh Maestro or Biome docs before changing their configuration files, snapshot behavior, or suppression syntax.
