# 004 — RepDB reference data and media import

Date: 2026-10-12. Scope: v0.2 Exercise Library.

Use the canonical free RepDB dataset, not manually entered exercise/image arrays.
Reviewed revision: `d86f9612bee19db1069557bcac5c957021057eb9`, containing 643 exercises,
31 muscle slugs, 59 equipment slugs and 1,138 poses. Preserve provider exercise IDs;
normalize underscore taxonomy slugs to hyphens and derive display names from them.
English names/instructions are the current app language; the source remains the
authority. Null secondary-muscle arrays and no-equipment moves are legitimate.

The [free-tier data license](https://github.com/RepDB/exercise-dataset/blob/d86f9612bee19db1069557bcac5c957021057eb9/LICENSE-DATA.md)
permits commercial in-app use with attribution. Keep a visible RepDB link in the
library/detail and README. Do not publish a repackaged dataset/API, use generative-AI
image derivatives or ship `premium-samples`. No paid dataset/API is introduced.

`scripts/import-repdb.mjs` downloads the pinned snapshot into ignored local tooling,
validates IDs/counts/instructions/taxonomy/pose paths and imports through one
administrative SECURITY INVOKER RPC. The `(source, source_external_id)` conflict key
preserves UUIDs and replaces relationships atomically. Missing equipment remains
an empty relationship, never an invented equipment record. Exercise/media metadata
retains source, license and attribution; exercise rows also retain the source revision.

Image uploads use UUID/pose paths in private Supabase Storage, WebP validation,
SHA-256 checksums and bounded four-exercise batches. Metadata is upserted only after
upload succeeds. Repeating the same import preserves exercise/media IDs and paths;
failed uploads can resume by rerunning. Local downloads are not committed. Licensed
reference imagery is not private health data, but only authenticated app clients
can sign/read it; client uploads and anonymous catalog access are denied.

The server-only import key lives in ignored `.env` and is read only by an explicit
Node command. It is not an Expo public variable or imported mobile module. No Edge
Function, independent backend, data cache framework or additional app package is
needed. Search runs in an invoker RPC with literal text matching and bounded
pagination; images use installed Expo Image caching. Owned equipment replacement is
an atomic invoker RPC derived from Auth identity and protected by owner RLS.

The approved PDF supplies compact library rows/chips and detail technique media.
Use real dataset thumbnails and all poses; defer its Add to workout action and
set-count examples to v0.3, where actual workouts exist. Additional required
equipment filters/editor reuse current verified controls. Figma MCP remains limited;
exact unavailable equipment/dark node parity is not claimed.

Verification evidence is maintained in Development Status. Hosted rollback SQL
tests, authenticated API checks, checksum/image retrieval and repeat imports are
distinct from mocked SDK/UI regressions and JS exports. Device smoke tests remain
reported separately; no native build is submitted under the existing user deferral.
