---
status: accepted
---

# Mock reanimated through a Jest module-name mapper

Animating the Collections loading skeleton put react-native-reanimated's hooks under
test for the first time. The package's published v4 mock entry is broken — it requires a
file the package does not ship — and expo-router's testing library mocks reanimated by
requiring exactly that entry, catching the throw, and falling back to an empty module
that drops the hooks the skeleton reads.

The fix was a Jest module-name mapper redirecting that one subpath to a hand-written
mock, so the testing library's own factory loads a complete module instead of an empty
one. Mapping the bare specifier instead was rejected: it collides with that same factory
and recurses through the redirected require until the stack overflows.

What the choice constrains is the shape of any later fix here. The redirect stays scoped
to the mock subpath, and jest-expo's `transformIgnorePatterns` stays untouched — this is
a module that is missing, not one that is untransformed. `jest.config.cjs` and the mock's
own header carry the wiring and the reason the mock's imports are restricted.

The cost accepted is that animation is a pass-through under test. A component that
animates mounts and renders, but nothing about its animated output is assertable, so
that behaviour is left to on-device checks. The mapper is removable once
react-native-reanimated ships a mock entry that works.
