# Abstraction Boundaries

Apply these rules to verify that new code respects the project's separation of concerns.

## Data-Access / UI Split

When a component reaches into the data layer directly, caching, schema validation, and logging scatter across every call site instead of living in one place.

**Guidelines:**

- MUST flag a component or route file that imports the `db` client or queries Drizzle directly. Data access MUST go through the owning feature's `queries/` / `mutations/` modules (TanStack Query wrappers over Drizzle) so caching, schema validation, and invalidation are centralized.
- MUST flag a data-access function that returns the raw Drizzle row type instead of a validated/parsed model type (a Zod-parsed shape from the feature's `models/`). The data-access layer owns the row-to-model transform.
- MUST flag a data-access function that imports UI modules (components, routing, view libraries) — data-access modules MUST be UI-free.

## Route / Feature Boundary

A route file that accumulates feature logic turns the routing tree into the feature implementation, so the logic can no longer be reused, tested, or moved without touching navigation.

**Guidelines:**

- MUST flag a route file under `src/app/` that contains substantial feature logic (data transforms, multi-step orchestration, large component bodies) — route files are thin entry points that compose the owning feature's components, per the project's structure skill.
- MUST flag a feature module that imports from another feature's internals instead of its public surface; cross-feature reuse goes through `src/common/` or a deliberate export.

## Domain Pipeline Boundary

A shared pipeline copied into a second place drifts out of sync, so a fix applied to one copy silently skips the rest.

**Guidelines:**

- MUST flag any new component that re-creates a shared domain pipeline (e.g., assembling a content-transformation chain) outside its single owning module. The pipeline is a single chain, per the project's own domain skill, if defined.
- MUST flag a new node/element type added to a renderer's component-mapping table without a corresponding component import.

## Cross-Tier Imports

An import that runs against the tier hierarchy couples layers meant to stay independent, eroding the boundaries the tiers exist to enforce.

**Guidelines:**

- MUST flag any import path that crosses tiers in the wrong direction:
  - The data-layer realm (`src/core/db/`) MUST NOT import from the application UI realm — schema and client code stay view-free.
  - Common / global modules (`src/common/`, `src/core/`) MUST NOT import from a specific feature's code. Shared code should not depend on feature-local code.
- SHOULD flag deep relative imports (`../../../`) that cross more than two directory levels — prefer the project's configured `~/` path alias.
