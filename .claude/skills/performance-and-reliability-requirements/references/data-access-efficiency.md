# Data-Access Efficiency

Apply these rules to verify that reads against the data/content layer (Drizzle ORM over expo-sqlite) are bounded and N+1-free.

## Mandatory Query Bounds

Every read against the data layer should make its projection, relationship depth, result bound, and filter explicit:

| Concern | Why it matters |
|---|---|
| Field selection (projection) | Without an explicit projection, the data layer returns every field on every record, including large blobs (e.g., a full body/content field). Select only what the consumer renders. |
| Relationship loading | Drizzle loads only the relations the query names (`with: { … }` or an explicit join) — each named relation adds join/query work, so load exactly what the consumer renders. Loading a relation no consumer uses is Major; loading nested relations levels deeper than needed is Major because each level multiplies the work. |
| Result bound | Drizzle applies **no** default limit — an unbounded query returns every row. Flag a Critical when a query over a table that grows with use has no `limit` (or pagination) and its result is rendered directly: the full table is dragged into memory and into the render. A fixed-size lookup table read is fine unbounded. |
| Filter / predicate | Required when fetching anything other than "all of this collection". Visibility-restricted reads must filter out records the caller is not allowed to see, per the project's application-security requirements (access-control rules). |

**Guidelines:**

- MUST flag a Major when a data-layer read omits an explicit projection, depth bound, result limit, or filter where the API supports them.
- MUST flag a Critical when a query over a growing table is unbounded and its result set is rendered or held in memory directly.
- MUST flag a Major when a query loads relations (`with`/joins) the consumer does not render, or nests them deeper than the consumer needs.
- MUST require the appropriate visibility predicate (e.g., "only published / publicly-visible records") for reads that serve untrusted callers.

## N+1 Patterns to Reject

A per-record read inside a loop multiplies round-trip latency by result-set size, so a page that is instant with ten records collapses at a thousand.

**Guidelines:**

- MUST flag a Critical when the diff iterates a list of records and issues a per-record data-layer read inside the loop. Use a single batched read (e.g., an `id IN (...)` predicate) instead, or populate relationships in the original query.
- MUST flag a Critical when a list renders each row through its own per-row data fetch — fetch the list (with its relationships) in the owning query and pass row data down, per [async-loading-cost.md](./async-loading-cost.md).
- MUST flag a Major when a write/lifecycle hook iterates a result set and performs a per-record network call serially (i.e., without batching the independent calls to run concurrently). Match the project's pattern of running independent per-record calls concurrently.

## Single Data Client

Opening a database connection carries real setup cost, and parallel connections to the same SQLite file invite lock contention.

**Guidelines:**

- MUST flag a Critical when the diff opens the database from a non-canonical entry point instead of importing the shared `db` client from `src/core/db/client.ts`. The app intends a single process-global client; alternative construction paths break that singleton.

## Pagination

Unbounded growth is invisible in development, where tables hold a handful of rows; on a device that has accumulated months of data, the same query loads the whole table into memory on every render.

**Guidelines:**

- MUST flag a Critical when a new data-access function reads a growing table without a `limit`/pagination and its consumer renders the result directly. Either bound the query (paginate, window, or aggregate in SQL) or document why the table's size is inherently bounded.
- SHOULD flag a Major when a new collection/table is queried without a defined sort — unsorted queries return records in storage-insertion order, which is not stable across data-layer schema migrations.

## Migration Cost

A migration runs against production data exactly once, and a dropped or renamed column takes its data with it — there is no second pass to recover an oversight.

**Guidelines:**

- MUST flag a Critical when a new data-layer schema migration drops a column or renames a field on a collection/table that holds production data, without a data-backfill step. Defer to the human owner per the project's code-review guideline (escalation rules).
- MUST flag a Major when a new field used in a filter predicate is added without an index — the storage engine will full-scan. Either add an index to the field or document the expected row count.
