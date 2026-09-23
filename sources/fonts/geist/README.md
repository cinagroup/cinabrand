# Geist source font

Unmodified **Geist Regular (400)** from the official [Geist v1.7.2 release](https://github.com/vercel/geist-font/releases/tag/v1.7.2), archive `geist-font-v1.7.2.zip`, member `geist-font/Geist/otf/Geist-Regular.otf`.

- Copyright 2024 The Geist Project Authors.
- License: [SIL Open Font License 1.1](OFL.txt).
- SHA-256: `16cb657f0dde448dccfe57cbe39a5b59c03cb709922a3451914495c273359f51`.

The original font binary is unchanged. `scripts/geist-wordmark.mjs` extracts only the `CINAGROUP` outlines with kerning, then rounds their corners to make a logo illustration. No modified font software is distributed.

The reference stem is uppercase I: 86 font units at 1000 units per em. The nominal circular fillet radius is **43 units (half the stem width)**. Tangent circular arcs replace sharp line/curve junctions; untouched curve segments retain their original Bezier geometry. Adjacent fillets are reduced locally where necessary to avoid overlap. The generated manifest records the number of affected corners.

Starting with brand v2.1.1, **N's upper and lower inner acute joins retain their original sharp vertices**. Its other corners and the remaining letters keep the existing rounding. The exception vertices are read directly from N's outline at its kerning-aware wordmark position.

`assets/heritage/cinagroup-wordmark-en.svg` is the resulting vector illustration; the other logo SVGs embed this English path alongside the original symbol and Chinese raster artwork. No system font is needed to display the assets.
