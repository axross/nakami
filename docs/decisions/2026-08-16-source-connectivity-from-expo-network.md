---
status: accepted
---

# Source connectivity from expo-network

TanStack Query learns whether the device is online from its `onlineManager`, which
populates itself from browser events React Native never fires. Wiring it meant naming a
connectivity source, and the app had none — so this decision is which module became one.

`expo-network` was taken. It is a first-party Expo SDK module installed through
`expo install`, which resolves it against the installed SDK rather than against whatever
npm currently publishes, so its version stays managed alongside every other native
module here. That matters more than it sounds: a native module whose version has drifted from
the SDK is a hard crash at launch with no JS error behind it, and it is one of the
hazards this repository already tracks by hand. It is also the module TanStack Query's
own React Native documentation gives a recipe for, and it resolves with no transitive
dependencies at all — one entry in the lockfile, two peers already installed.

`@react-native-community/netinfo` was the alternative, and it is the stronger library on
two counts: the larger install base, and TanStack Query lists it first. It also reports
the current connection when a listener is attached, where `expo-network` reports only
changes. That last difference is the whole cost of this choice — the connection the app
launched with has to be read separately and seeded into the manager, which is code that
would not exist under NetInfo, and which carries its own failure path to handle. What
NetInfo trades back is that it sits outside the Expo SDK, so its React Native
compatibility becomes something this repository verifies by hand at every SDK bump
instead of something the installer settles.

Adding no dependency at all was the third option: wire the focus manager, which needs
only React Native's own `AppState`, and leave connectivity alone. It was rejected
because the two halves are not equally serviceable. A stale screen has an obvious human
workaround once the app is foregrounded again; a screen stuck on a connectivity failure
has none but a Try again button the user has to find, which is the case the wiring
exists for.

What this constrains now is that connectivity is read through one module, in one place —
the query client's own module, where both managers register. A later need for
connectivity elsewhere in the app reaches for `expo-network` rather than admitting a
second network module beside it, and a change of mind here is a change to that one
registration rather than to every caller.
