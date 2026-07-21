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
| `app-launch` | must | The app cold-starts and reaches the home screen (the signed-out empty state). |
| `tab-navigation` | must | Switching bottom tabs reaches the Home and Settings screens available while signed out. |
| `settings-menu` | must | The settings menu shows the About and Debug groups with technical details, and License pushes the Licenses screen. |
| `auth-signed-out` | must | Signed out, Home shows the sign-in call to action and the Collections tab is hidden. |
| `auth-sign-in-form` | must | The sign-in screen opens with its fields, the Collection value toggles to an editable input, and an unreachable server surfaces an inline error. |
| `auth-settings-sign-in` | must | Signed out, the Settings screen shows a Sign in row that opens the sign-in screen. |
| `auth-session` | should | After signing in, the Collections tab and the Settings Account section appear and Sign out returns to the signed-out state. Requires a live Payload server, so it is covered by unit/component tests and manual/on-device verification rather than an automated flow. |
