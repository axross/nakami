---
status: accepted
---

# Run e2e flows on Maestro

Maestro arrived in the repository's first commit (`03d0306`), together with the journey
catalog in [`e2e/scenarios.md`](../../e2e/scenarios.md) and the device-free coverage gate
beside it. Every end-to-end flow written since has been a Maestro flow.

**No rejected alternative is recorded.** The decision predates this log, and neither the
commit that made it, the issue it landed under (#1), nor any change since says why
Maestro was chosen or what else was weighed. This record states what the repository
evidences and stops there — a reader looking for the comparison will not find one,
because none was written down.

What the choice constrains now is that e2e coverage is settled by a catalog rather than
by whichever flows happen to exist. `e2e/scenarios.md` owns the journeys and the gate
that enforces them, so a change introducing a journey answers to that catalog rather
than to a reviewer's judgment about whether a flow was worth writing.

The cost accepted is that the runner is a CLI outside `package.json` and its flows need
a simulator, so no CI job runs them — `merge-checks.yml` runs the coverage gate alone. A
change verified without a device is verified against the catalog rather than against the
app.
