# Bundle and Dependency Weight

Apply these rules to verify additions do not balloon the JavaScript bundle Metro ships in the app binary — bundle bytes cost every user download size, Hermes parse time, and app startup time.

## Tooling-Only Imports in App Code

Metro follows every import edge regardless of how little of a module is used, so one wrong import in app source drags build-time tooling into what every user's device parses at startup — or breaks the bundle outright.

**Guidelines:**

- MUST flag a Critical when a file under `src/` imports any of these classes of package (each is build-time tooling or runtime-incompatible):
  - Build/codegen tooling (`drizzle-kit`, config-plugin code, anything meant for `scripts/`)
  - Node builtins (`node:*` modules) — Hermes does not provide them
  - A dev-only or test-only package (`jest`, testing-library) from non-test source
- MUST flag a Major when app code imports from a path that exists for tooling (e.g., `drizzle.config.ts`, `e2e/`) — those tiers are outside the app bundle by design.

## Heavy Dependencies

Every dependency costs each user's download, parse, and execution time — so what a library weighs matters as much as what it does.

**Guidelines:**

- MUST flag a Major when a new dependency with a large installed size (roughly > 200 KB of JS) is added for functionality a small utility or existing dependency already covers. Cross-reference with the project's application-security requirements (supply-chain rules).
- MUST flag a Major when a new dependency ships a native module solely for a capability an installed Expo module already provides — each native module also adds binary size and native init cost.
- SHOULD flag a Minor when a moment-of-need dependency (rarely-reached screen, debug-only tool) is imported statically from the app's startup path instead of lazily.

## Re-Exports and Barrel Files

A barrel import hands Metro the whole index, and everything the re-exports touch rides along unless tree-shaking can prove it unused — which it often cannot.

**Guidelines:**

- MUST flag a Critical when a new barrel file is created that re-exports many items and is imported from app code. Import directly from the source module per the project's development guidelines (code-quality rules).
- MUST flag a Major when a new component imports from a file that itself re-exports tooling-only modules. The transitive pull bloats the bundle at best and breaks it at worst.

## Lazy Loading

Lazy loading moves a unit's cost from every user's app startup to the moment the unit is actually needed.

**Guidelines:**

- SHOULD flag a Minor recommendation to lazy-load (`React.lazy` / dynamic `import()`) a new component that is large, only used on a single rarely-visited route, and not part of the startup path.
- MUST flag a Major when startup-path code (root layout, initializers in `src/core/`) gains a heavyweight import that only one deep screen needs.

## Tree-Shaking

Tree-shaking works by proving exports unused, and default or namespace imports of CommonJS-shaped modules make that proof impossible.

**Guidelines:**

- MUST flag a Major when app code uses a default import (e.g., `import _ from "lib"`) instead of named imports for a tree-shakeable library. Default imports often defeat tree-shaking for CommonJS-shaped libraries.
- SHOULD flag a Minor when a new icon or UI library is imported wholesale (e.g., `import * as Icons from "…"`). Import only the items used.
