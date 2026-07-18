# Asset and Image Optimization

Apply these rules to verify images and other large assets are sized, cached, and rendered through the project's optimized image component — `expo-image`'s `Image` — rather than raw elements.

## Optimized Image Pipeline Usage

Images dominate memory and bandwidth on device, and a raw image element skips caching, downscaling, and progressive placeholders.

**Guidelines:**

- MUST flag a Critical when a new component renders a remote image with React Native core `Image` instead of `expo-image` — core `Image` has no disk cache policy, no placeholder support, and weaker downsampling.
- MUST flag a Major when an image is rendered without explicit dimensions (a sized style or container) — unsized images cause layout shift and force full-resolution decodes.
- SHOULD flag a Minor when a remote image omits an explicit `cachePolicy` where the project has established one for that image class.

## Loading and Priority

Loading hints decide which bytes gate the first meaningful frame, so a wrong hint either delays the hero image or spends bandwidth on imagery nobody has scrolled to.

**Guidelines:**

- MUST flag a Major when a new above-the-fold image lacks a `priority` hint while surrounding imagery competes for bandwidth.
- MUST flag a Major when images inside a virtualized list omit `recyclingKey` — recycled rows briefly show the previous row's image without it.
- SHOULD flag a Minor when a slow-loading remote image has no `placeholder` (e.g., a blurhash/thumbhash) where the layout benefits from one.

## Bundled Asset Discipline

Every bundled asset ships inside the binary to every user, whether or not their session ever renders it.

**Guidelines:**

- MUST flag a Major when a new bundled asset (under `assets/`) is oversized for its largest rendered size — assets should be exported at the maximum needed density, not the design-tool original.
- SHOULD flag a Minor when a simple flat icon is added as a large raster instead of an SVG or a font glyph.
- MUST flag a Major when a screen-specific heavyweight asset is loaded during app startup rather than at the owning screen's moment of need (e.g., via `expo-asset` deferred loading).
