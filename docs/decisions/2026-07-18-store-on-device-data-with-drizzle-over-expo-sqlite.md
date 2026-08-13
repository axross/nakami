---
status: accepted
---

# Store on-device data with Drizzle over expo-sqlite

On-device storage arrived in the repository's first commit (`03d0306`): Drizzle ORM over
`expo-sqlite`, a generator pointed at a single schema module, and a shared client that
opens the database at startup.

**No rejected alternative is recorded.** The decision predates this log, and neither the
commit that made it, the issue it landed under (#1), nor any change since says why
Drizzle over `expo-sqlite` was chosen or what else was weighed. This record states what
the repository evidences and stops there — no comparison was written down, so none is
reconstructed here.

What the choice constrains now is the route to a table. Persisting anything structured
on the device goes through the schema module and a generated migration, with no ad-hoc
write reaching the same storage — [conventions/data-layer.md](../conventions/data-layer.md)
holds the convention that follows, and [README.md](../../README.md) the migrator work
still outstanding.

The cost accepted is a data layer that arrived before any feature needed it. Its
dependencies ship in every build whether or not a row is ever stored, and until
something persists, the choice goes untested against a real query. That also leaves it
unusually cheap to overturn: the first feature to need persistence is the one that finds
out whether this was the right answer, and it is the change that could still choose
otherwise.
