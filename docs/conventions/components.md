# Components

What this app's shared components are, how one is split across files, and the image
rules its own performance rests on.

Composition itself belongs to the installed `react-component-development` capability —
composing an existing primitive instead of re-creating its look, the private context a
variant reaches its parts through, the hook that throws when a part renders outside its
parent, and when a repeated pattern is promoted. Styling belongs to
`react-component-styling`, and the tokens to [styling.md](./styling.md). Components
here are hand-rolled on React Native primitives with no UI component library, following
the composition pattern of [axross/porousel](https://github.com/axross/porousel).

## The shared catalog

Shared components live under `src/common/components/`, one directory each. This table
is the inventory, and it is only worth anything while it is current — the installed
`living-project-documentation` capability already requires a convention document to be
corrected in the same change that invalidates it, so a change landing a new shared
component adds its row here.

| Component       | Purpose                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `message-state` | Centred mark, title, and subtitle with an optional action slot — the shared shape behind the feature empty, error, and placeholder screens |

## One file per part

A component is a directory, not a file. The main file bears the component's name and
each child part MUST get its own file beside it — `button-text.tsx` and
`button-icon.tsx` next to `button.tsx` — so that a part is found by its file name and
changed without touching its siblings.

The installed `react-component-development` capability leaves that split a SHOULD and
binds only the directory grouping. This repository binds the split itself, because a
component whose parts share one file produces a diff that reads as a change to the
whole component every time one part moves, and a change here is reviewed as a diff.

## Icons

`lucide-react-native` is this app's single icon set, and the one exception to the
no-UI-component-library rule above. A component that chooses its own icon imports the
Lucide component directly and takes its size and colour from the theme; one that lets
its caller choose accepts a `LucideIcon` component prop, which the installed
`react-component-styling` capability requires of any such component in general.

A design needing a vector Lucide does not cover MAY import a bespoke `.svg` as a React
component instead, through `react-native-svg-transformer` — configured in
`metro.config.js` and typed by `declarations.d.ts`, so no per-use setup is needed.

## Images

The installed `expo-app-development` capability owns image rendering: `expo-image`
rather than the core component, explicit dimensions or an aspect ratio, and the
recycling key an image inside a virtualized list needs. Three rules here go beyond that
text.

A remote image MUST carry a **priority hint**. No installed rule asks for one at all. A
priority is what tells the image layer which requests to serve first while several are
in flight, and without one an image the reader is looking at queues behind images they
have not scrolled to yet.

A remote image MUST also carry a **cache policy**, where the installed capability asks
only that a policy be chosen deliberately per use. Leaving it to the library's default
is what that SHOULD permits and this MUST does not, because an unset policy is
invisible in review — the image renders correctly either way, and only the second
launch shows what was decided.

A bundled asset MUST be sized for its largest rendered use rather than exported at the
design tool's original size. Unlike a remote image, it ships inside every install
whether or not any screen draws it, so the cost is paid by every user at download time.

`expo-image` MUST NOT be removed from the dependency manifest while the rules above
stand, even though nothing imports it yet. No surface in `src/` renders an image, so a
sweep that looks for import sites finds the package unreferenced and reads as removable
— and removing it would delete the mechanism those rules mandate, leaving the first
image surface to re-choose one. The keep is deliberate, and this is where a sweep that
reaches `expo-image` finds that answer instead of filing a finding.
