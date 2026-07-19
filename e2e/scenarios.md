# E2E Scenario Catalog

The journey catalog for the Maestro e2e suite. Every row is a user journey the
suite should assert; every asserting flow tags itself with `scenario:<id>` in
its flow-config `tags:` list. The coverage gate
(`npm run test:e2e:coverage`, also the first step of `npm run test:e2e`) fails
when a `must`-priority scenario has no asserting flow or when a flow tags a
scenario that is not cataloged; `should`/`may` gaps are report-only.

Add a row when a feature introduces a new user journey — in the same change as
the flow that asserts it, or with an honest priority if it is a known gap.
Remove rows only when the journey itself is removed from the product.

| Scenario ID | Priority | Journey |
| ----------- | -------- | ------- |
| `app-launch` | must | The app cold-starts and reaches the home screen. |
| `tab-navigation` | must | Switching bottom tabs reaches the Home, Collections, and Settings screens. |
| `settings-menu` | must | The settings menu shows the About and Debug groups with technical details, and License pushes the Licenses screen. |
