# Async Loading and Rendering Cost

Apply these rules to verify that data loading and rendering do not create avoidable latency. In this project, async data flows through TanStack Query (queries/mutations) and Drizzle reads; loading UI is expressed with per-unit loading states or Suspense boundaries.

## Async Waterfalls

Sequential awaits make time-to-content the sum of every operation's latency; concurrent execution makes it the slowest one.

**Guidelines:**

- MUST flag a Major when independent async operations are awaited sequentially instead of running concurrently (e.g., chained `await`s in a helper, or a query artificially gated on another via `enabled` when its inputs do not depend on that query's result).
- MUST flag a Critical when the diff converts a concurrent data pattern back into a serially-awaited one without a stated reason — that change re-introduces the waterfall.
- SHOULD point to `Promise.all` (or parallel queries consumed where needed) as the project's pattern for independent async inputs.

## Loading Boundary Granularity

A loading boundary resolves at the pace of the slowest thing inside it, so grouping independent units forces the fast one to wait for the slow one.

**Guidelines:**

- MUST flag a Major when a single loading boundary (one shared spinner/skeleton or one Suspense boundary) wraps two independently-slow async units. Split into one boundary per slow unit.
- MUST flag a Major when a screen-level async read with a meaningful loading state renders nothing while pending — without a loading state, the whole screen blocks or flashes when the data arrives.

## Loading / Loaded Split

Mixing loading and loaded concerns in one unit couples the skeleton to data that does not exist yet, which is how skeletons quietly stop rendering before the fetch resolves.

**Guidelines:**

- MUST flag a Major when a new data-fetching component does not separate its loading view, loaded view, and orchestrator when the loading state is user-visible. Match the project's canonical layout for such components.
- MUST flag a Critical when a loading skeleton imports the loaded-data type and renders fields from it — the skeleton MUST render with no data so it can show before the fetch resolves.
- MUST flag a Major when the orchestrator does not propagate the project's `testID` convention to the loading fallback — automated tests cannot assert the skeleton state otherwise. See the project's end-to-end testing guidelines.

## List Rendering Cost

A plain `.map()` render mounts every row up front, so a list that is instant with ten records collapses at a thousand — virtualization keeps mounted rows proportional to the viewport.

**Guidelines:**

- MUST flag a Major when a new unbounded list renders via `.map()` inside a plain `ScrollView` instead of a virtualized list (`FlatList`/`SectionList`/`FlashList`). Small, fixed-size lists are fine.
- MUST flag a Major when a virtualized list's `renderItem` closes over per-render state that forces every row to re-render on unrelated updates. Keep row components referentially stable and pass data via `item`.
- SHOULD flag a Minor when list rows lack a stable `keyExtractor` (index keys reorder poorly and defeat recycling).

## Compiler / Memoization Implications

The React Compiler is enabled for this project (`experiments.reactCompiler` in `app.json`) and auto-memoizes components, so the reviewer SHOULD be aware:

- Manual memoization (`useMemo`, `useCallback`, `React.memo`) in new components is usually unnecessary. Flag a Minor when manual memoization is added without a reason the compiler cannot handle (e.g., a referential identity a third-party library requires).

**Guidelines:**

- MUST account for the compiler's auto-memoization behavior before flagging or approving manual memoization in new components.
- MUST NOT recommend disabling the React Compiler to "fix" a perf issue — escalate to the human owner per the project's code-review guideline (escalation rules).
