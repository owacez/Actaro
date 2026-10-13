# 006 — Manual nutrition data and serving calculations

Date: 2026-10-13. Scope: v0.4, tasks 3.1–3.13.

Use USDA FoodData Central's final SR Legacy April 2018 JSON download as the initial
shared food catalog. Its data is public domain/CC0-1.0. Import all 7,793 validated
records and 14,449 food-specific portions into our own Supabase database. Runtime
search uses Supabase, not USDA hosting or an external API. No new API key is needed.
The catalog contains common foods and some named products; it is not a complete,
current international branded-product catalog. Current package labels can be
entered as private custom foods. Food photos and barcode scanning remain later work.

References:

- [USDA downloads](https://fdc.nal.usda.gov/download-datasets/)
- [USDA licensing](https://fdc.nal.usda.gov/api-guide/)
- [USDA portion methodology](https://fdc.nal.usda.gov/Foundation_Foods_Documentation/)

Reviewed uncompressed JSON SHA256:
`70d4235ae3a2bdf48a7b9eaa1286a83fa67b6f3270436c9ce8b008213f500129`.
Stable UUIDs derive from the source/FDC ID. Upserts preserve IDs and ownership;
missing required nutrients are rejected rather than replaced with zero. Each
reference record retains source, external ID, revision, license and attribution.
The CLI imports bounded batches, can validate without writing, and can be rerun
after an interrupted import. It uses the existing ignored server-only secret;
the public app never receives it. No dependency was added.

Foods describe calories/protein/carbs/fat for an explicit base amount and unit:
grams, milliliters or serving. USDA uses 100 g. Custom label values need not use
100 g. Each named portion stores its equivalent amount in that food's base unit.
Keep the complete USDA description and its represented quantity: a “2 tbsp”
portion is not mislabeled as one tablespoon. Grams convert to ounces using
28.349523125 g/oz. Volume never assumes a food has water's density. Cups, pieces,
slices, tablespoons, teaspoons and ml conversions appear only when supplied for
that food; users may add known equivalents to their custom foods.

For every nutrient, `base value × portion equivalent × quantity / base amount`.
Use source energy, not an unconditional 4/4/9 macro reconstruction. Store canonical
kcal; display kJ with a factor of 4.184. Keep calculation precision and round only
the displayed values. Water uses canonical ml; L and US fluid ounces are explicit
volume conversions. Input bounds are technical limits, not dietary recommendations.

Recipe creation/editing sums server-calculated ingredient snapshots. Divide by
servings when cooked weight is unknown, allowing serving-only logging. When the
finished edible batch is weighed, normalize to 100 g and offer both arbitrary
grams and its equivalent serving. Added water changes batch weight without adding
ingredient energy. Editing a recipe recalculates the current ingredients; old
diary entries retain their earlier nutrition. Recipes may include other recipes
as finite snapshots; direct self-inclusion is rejected.

Private diary rows preserve food name, source, base nutrients, selected portion
and quantity. PostgreSQL generated columns calculate their nutrition; the client
uses the same tested formula for live previews and totals. Quantity edits retain
the original snapshot. Changing a logged food/unit uses delete and add. Food-library
deletion archives the item, while physical deletion also leaves diary snapshots.
Saved meals copy snapshots, including when a source food is no longer available.
Copy meal/day preserves meal groups unless an explicit destination is selected.

Targets are user-entered tracking goals with no inferred intake prescription.
Date-effective history prevents a new target from rewriting past diary adherence;
changes take effect on today's date in the saved time zone, with the latest save
used for that date. Dates before the first recorded target show no assumed target.
Diary dates are explicit civil dates and retain the recording time zone.

All personal rows use Auth ownership/RLS, FK checks and bounded values. Shared
reference foods are read-only to app accounts. Invoker RPCs verify the expected
account, use an empty search path and revoke anonymous/public execution. Logging
uses a stable request ID; an acknowledged retry retains the original snapshot even
after a source edit. Atomic copy requests retain their acknowledgement so retries
do not duplicate or re-read a changed/deleted source. An uncertain save locks its
inputs for the exact retry; a known database rejection allows correction/reload.
Deletes acknowledge an already-gone owned row safely.

Forms and nutrition save retries are retained while that screen remains mounted;
they are not durable offline drafts. Do not claim an unacknowledged save succeeded.
Advanced offline queues/multi-device reconciliation remain v1.5. Native builds
and physical-device acceptance are user-deferred. Existing verified components
and relevant approved PDF fallback frames guide the UI; no Figma file was edited.
