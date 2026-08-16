# Data Layer

Where this app's on-device tables are defined, and the shape a read of them has to
take.

Drizzle over `expo-sqlite` in general belongs to the installed `expo-app-development`
capability: choosing a storage mechanism at all, generating a migration from the schema
and committing it, applying pending migrations at startup, and sharing one open
database handle. Two operational warnings that go with it — that a committed migration
is never hand-edited, and that this app has not wired Drizzle's `useMigrations` yet, so
the change landing the first migration has to wire it — are in
[README.md](../../README.md)'s command table, which is where a contributor already
looks for `npm run db-migrate:generate`.

## Where tables are defined

Every table MUST be defined in `src/core/db/schema.ts`. No installed capability says
where a schema lives — each refers to "the schema" without locating it — and
`drizzle.config.ts` points the generator at that one file, so a table defined anywhere
else produces no migration and reaches no device.

`src/core/db/schema.ts` currently defines no tables. Nothing in the app persists
structured data on the device yet: the session lives in the keychain and everything
else is server state held in memory.

`src/core/db/client.ts`, which opens that database and exports the shared `db` handle,
correspondingly has no consumer: its colocated smoke test is the only thing that imports
and executes it, and that test mocks `expo-sqlite`, so the native database open stays
unverified. The module states that at its top, along with what the first consumer owes:
a table here, the generated migration committed with it, and `useMigrations` wired into
`src/app/_layout.tsx`.

## Bounding a read

A data-layer read MUST state its projection and its filter, and MUST state a result
limit wherever the dataset it reads can grow. A list MUST NOT be iterated with a fetch
of each related record inside the loop; the related rows are read in one query instead.

Nothing in the installed skills states either half. The nearest text is a rule about
which fields a public surface exposes, which is about what a response reveals rather
than what a query costs. Both halves matter more here than they would on a server: an
unbounded read and a per-record round trip are paid in memory and battery on the device
in the user's hand, and both grow with data that no contributor's own install ever
holds.
