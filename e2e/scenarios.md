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
| `app-launch` | must | The app cold-starts and reaches the welcome screen (the signed-out landing). |
| `tab-navigation` | should | Signed in, switching bottom tabs reaches the Home, Collections, and Settings screens. The tab UI mounts only once authenticated (which needs a live Payload server), so it is covered by unit/component tests and manual/on-device verification rather than an automated flow. |
| `settings-menu` | should | Signed in, the Settings menu shows the About group with technical details, and License pushes the Licenses screen. Settings is a tab, reachable only once authenticated (which needs a live Payload server), so it is covered by the settings/licenses unit tests and manual/on-device verification rather than an automated flow. |
| `auth-signed-out` | must | Signed out, the app shows the welcome screen with a Sign in call to action and no tab bar. |
| `auth-sign-in-form` | must | From the welcome screen, the sign-in screen opens with its fields, the Collection value toggles to an editable input, and an unreachable server surfaces an inline error. |
| `auth-session` | should | After signing in, the tab UI mounts — the Home, Collections, and Settings tabs and the Settings Account section appear — and Sign out returns to the welcome screen. Requires a live Payload server, so it is covered by unit/component tests and manual/on-device verification rather than an automated flow. |
| `auth-last-server-url` | should | After a successful sign-in and sign-out, reopening the sign-in screen pre-fills the Server URL field with the last-used endpoint. Requires a prior successful sign-in against a live Payload server, so it is covered by unit/component tests and manual/on-device verification rather than an automated flow. |
| `collections-list` | should | Signed in, the Collections tab lists the server's readable, non-system collections, and tapping one opens the collection's records list. Requires a live Payload server, so it is covered by unit/component tests and manual/on-device verification rather than an automated flow. |
| `collections-records` | should | Signed in, opening a collection lists its records as a scrollable card feed — each record a derived title over a metadata line — with loading, empty, and failure-aware error states, and scrolling to the end loads more. Requires a live Payload server, so it is covered by unit/component tests and manual/on-device verification rather than an automated flow. |
| `collections-offline` | should | Signed in with no connection, opening the Collections tab or a collection states that the device is offline, offers nothing to press, and loads on its own once the connection returns. Requires a live Payload server and a device whose connectivity can be cut, so it is covered by unit/component tests and manual/on-device verification rather than an automated flow. |
