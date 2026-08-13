---
status: accepted
---

# Mock Lucide icons through a Jest module-name mapper

Migrating every in-app icon to Lucide put `lucide-react-native` in the import graph of
most screens. Its React Native entry ships ESM that jest-expo's transform does not
process, so importing an icon under test threw a syntax error and failed the test file
at import.

The module is mapped to a hand-written stub instead, which answers every named export
with a component that renders nothing. Widening `transformIgnorePatterns` until Babel
reached the package was the alternative and was rejected: jest-expo's default list is
deliberately left as it ships, and a hand-rolled replacement is what breaks on the next
dependency to publish untranspiled ESM.

What the choice constrains is what a unit test may assert. No test asserts on an icon —
a surface is identified by test ID and copy, and the real SVG rendering is left to the
build and to on-device checks. A screen adopting a new Lucide icon needs no test setup
in exchange, because the stub answers for every export the package has.

The fix also stays a mapper. An icon that breaks under test is fixed here or in the
stub, never by reaching for the transform this decision declined to widen.
