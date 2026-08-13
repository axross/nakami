---
status: accepted
---

# Pin React Native Testing Library to v13

The first test that rendered a route had to go through expo-router's testing library,
whose `renderRouter` calls React Native Testing Library's `render` synchronously. RNTL
v14 made `render` async. The current major and the router's own helper could not both be
had.

React Native Testing Library was pinned to v13, with `react-test-renderer` pinned to
React's exact version alongside it. Taking v14 instead was the alternative, and it was
rejected because v14 breaks `renderRouter` — the helper a test of route-tree behaviour
is built on.

The pin is now a standing constraint on dependency work. RNTL is not bumped to v14 until
expo-router's testing library supports an async `render`, so a routine "update
everything" pass has to skip it rather than resolve the range, and `react-test-renderer`
moves only in lockstep with React. `jest.config.cjs` carries the note where whoever
edits the Jest setup will meet it.

The cost accepted is a testing library a major behind the ecosystem: an API added in v14
is unavailable here, and the constraint lifts on expo-router's schedule rather than on
this repository's.
