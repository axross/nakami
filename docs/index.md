# Documentation

Everything this repository knows about itself. Which body answers your question:

- **What does the app do?** → `specs/` — how each product domain behaves today.
- **How is the code written?** → `conventions/` — the rules a change has to satisfy.
- **How is something carried out?** → `operations/` — the procedures someone executes.

`decisions/` sits beside all three and holds why a constraint exists, for the
constraints whose reasoning cannot be recovered from the code. The vocabulary all four
bodies use — the product's words and the repository's alike — is in
[glossary.md](./glossary.md).

The commands, the preview build, and the skill refresh stay in
[README.md](../README.md), and how work runs stays in [CLAUDE.md](../CLAUDE.md);
`operations/` holds the procedures belonging to neither.

Documents under `conventions/` and `operations/` use MUST, MUST NOT, SHOULD, SHOULD
NOT, and MAY as [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119.html) describes.
Documents under `specs/` describe rather than instruct, and use none of them.

## Specifications

- [specs/authentication.md](./specs/authentication.md) — how the app reaches a Payload
  server and stays signed in: the signed-out landing, the sign-in form and what it
  validates, the session held on the device, keeping its token alive, and signing out.
- [specs/collections.md](./specs/collections.md) — browsing what is on the signed-in
  server: which collections an account can read, the record feed inside one and how it
  pages, and the loading, empty, and failure surfaces both screens show.

## Conventions

- [conventions/directory-structure.md](./conventions/directory-structure.md) — where a
  file goes, what it is called, and which module may import which, including the three
  ratified exceptions to the import direction.
- [conventions/styling.md](./conventions/styling.md) — the theme tokens: colour roles,
  tones, and steps, the shared spacing-and-radius scale, the font families, the
  breakpoints, and the adaptive-theme setting.
- [conventions/components.md](./conventions/components.md) — the shared-component
  catalog, splitting a component into one file per part, Lucide as the single icon set,
  and the image rules that go beyond the installed ones.
- [conventions/data-layer.md](./conventions/data-layer.md) — where this app's on-device
  tables are defined, and the projection, filter, and result limit a read has to state.
- [conventions/server-state.md](./conventions/server-state.md) — the single TanStack
  Query client every consumer imports, and the throwaway client a unit test builds
  instead.
- [conventions/logging.md](./conventions/logging.md) — the root logger and its two
  transports, the message-plus-context shape a log call takes, and bracketing an
  operation that can fail.
- [conventions/agent-skills.md](./conventions/agent-skills.md) — where this repository
  departs from an installed skill, or hits a case one is silent on, and how a new
  deviation or gap is recorded.

## Operations

- [operations/github.md](./operations/github.md) — how a session operates GitHub: the
  marker line a session's own comments begin with, assigning what a session creates
  and verifying that the assignment landed, and the route boundary that keeps merging
  a human decision.

## Decisions

- [decisions/](./decisions/) — why a constraint exists, and what was traded away. Each
  record is named for the decision it holds and dated the day it was made; a decision is
  replaced by a new record rather than by editing the old one.
