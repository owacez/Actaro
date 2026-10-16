# Current application screen atlas

Status: **DONE** - offline PDF and reusable screen-image export, 2026-10-16.

- [Open the screen atlas](../output/pdf/Actaro-Current-Screen-Atlas.pdf)
- [Download the screen PNGs](../output/pdf/Actaro-Screen-Images.zip)

The atlas contains **91 PDF pages**: a cover, three linked index pages and
**87 screen/state artboards**. Each artboard includes its full captured scrolling
content; tall PDF pages are intentional. Text is selectable. The archive contains
87 PNG images at twice the 390-pixel logical content width, plus an image index
and asset attribution. Loose PNGs are also saved locally under
`output/pdf/actaro-screen-images/` and excluded from Git to avoid duplicating the
archive.

This documents the current implementation from source commit `2bdfb31` using
fictional sample data, current Inter fonts, the approved light/dark colors and
the local RepDB illustrations. All 66 image placements loaded from local assets;
the export does not use the Figma image previews that appeared blank. No Figma
connector calls, live Supabase requests or real-user records were needed for the
PDF/image generation.

Normal artboards use settled reference states with transient success/info notices
hidden, so headings remain readable. Dedicated web-toast and mobile-snackbar
examples retain their notification UI.

Most artboards reconstruct the measured mobile web rendering from the existing
app captures. Four additional source-derived views are labelled explicitly:
native habit reminders, iPhone step reading, mobile snackbar placement and
expanded progress date controls. They reuse their implemented source text and
shared controls. OS permission sheets, device chrome, variable safe-area insets
and physical-device visual acceptance are excluded. These are design references,
not claims of additional device testing or new functionality.

The PDF is a static design reference, not an editable Figma component library.
The supplied `docs/Actaro Design.pdf` remains untouched. The separate Figma sync
is still blocked by its connector quota; its remaining editor corrections are
recorded in [the Figma sync report](FIGMA_IMPLEMENTATION_SYNC.md).

Verification covers PDF page count, all-page raster rendering, nonblank pages,
selectable source text, in-page text bounds, expected native/date controls and
absence of credentials, raw fixture addresses or environment paths. Representative
pages and contact sheets are visually inspected before delivery. App source,
dependencies, schema, release weights and deferred acceptance remain unchanged.

`npm run check` passed: TypeScript, ESLint, formatting, 58 Jest suites / 288 tests
and six dataset-script tests (294 tests total). The exercise-screen test emitted
a React `act(...)` warning; it did not fail. `git diff --check` passed.

Next actions: review the atlas and annotate desired visual changes; implement
each approved adjustment separately; reconcile Figma when connector access returns.
