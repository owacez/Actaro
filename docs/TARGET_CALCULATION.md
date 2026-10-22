# Daily target calculation

Actaro offers manual targets and an optional maintenance estimate. Calculation
is local TypeScript; it needs no AI, external API key or paid service.

The energy equations are the **2023 Dietary Reference Intake Estimated Energy
Requirement equations for adults 19 years and older**, published in
[Health Canada's equation tables](https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/equations-estimate-energy-requirement.html).
These estimate total daily maintenance energy from age, equation sex, height
in centimeters, weight in kilograms and usual activity category. They already
include activity; do not add another activity multiplier. BMI is not used to
calculate calorie needs. No automatic deficit, surplus or promised weight change.

The table includes male/female equations for inactive, low active, active and
very active categories. The user chooses activity; workout frequency alone is
not enough to infer it. Existing male/female profile values prefill the equation
setting. Other or missing values require an explicit equation choice or manual
targets; choosing an equation never changes the stored profile.

Age uses the full date of birth and the current civil date in the saved time
zone. The calculator loads the latest dated weight and height, showing both
record dates, and never substitutes a guessed value. Missing/changed values can
be entered for the estimate without saving a body record. The shared personal
details editor offers explicit persistence for height/sex/birth date/location.

For this general calculator, the user confirms applicability: age 19+ and not
pregnant/breastfeeding. Specialized pregnancy/lactation equations and pediatric
plans are not implemented. Manual entry remains available. App input bounds are
19–120 years, 25–455 kg and 90–275 cm; raw estimates outside 1,000–10,000 kcal
are rejected with manual fallback. These are implementation bounds, not health
classifications or universal recommended intakes. Values are never clamped to
a supposed safe calorie floor. Valid energy is rounded to the nearest 50 kcal
to avoid implying measurement precision.

Protein/carbohydrate/fat start at **20%/50%/30%** of generated energy, converted
using 4/4/9 kcal per gram and rounded to whole grams. This chosen starting split
falls within the adult [reference macronutrient ranges](https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/reference-values-macronutrients.html);
it is not a calculation of individualized macro requirements. Rounding means
macro energy can differ slightly from the displayed calorie estimate. Water
retains the user's target and is entered manually when missing; total dietary
water reference values must not be presented as prescribed drinking-water needs.

Generating only fills an editable preview. Save daily targets uses the existing
owned nutrition-target path and dated-history behavior. kg/lb, cm/in and kcal/kJ
preferences convert to/from canonical kg/cm/kcal. Calculation settings and
temporary overrides are not silently persisted. Updating body records does
not automatically overwrite previously saved targets; regenerate/review/save.

Body records opens on weight/date, with optional notes. Personal details use a
separate save, never carried with daily weigh-ins. Unchanged height is not logged
again; existing height history is retained. Editing personal details preserves
an unsaved weigh-in, and uncertain saves keep the retry request intact.

Verification lives in `target-estimate.test.ts`, `nutrition-screens.test.tsx`,
`body-form.test.tsx` and `v05-services.test.ts`. They cover the eight equations,
birthday/leap-day boundaries, unsupported inputs, unit conversion, explicit
preview/save, water preservation, separate writes and date/owner query bounds.

## First-run setup and goal adjustment (user revision, 2026-10-22)

New accounts with no nutrition targets and no weigh-ins are offered a six-step
setup after sign-in: units, sex/date of birth/height, current weight and optional
waist, goal, usual activity, and an editable plan. It can be skipped at any step;
completion or skipping is remembered on the device, and accounts with existing
targets or weigh-ins never see it.

The user chooses Lose fat, Maintain or Build muscle. This revises the earlier
maintenance-only rule: the adjustment is explicit, shown and editable, never
silent. From the published maintenance estimate:

- Lose fat: maintenance − min(500 kcal, 20% of maintenance).
- Build muscle: maintenance + min(300 kcal, 15% of maintenance).
- Maintain: the maintenance estimate and its 20/50/30 split, unchanged.

Energy is rounded to the nearest 50 kcal. For lose/gain, protein starts at
1.6 g/kg bodyweight (a common evidence-based level for retaining or building
muscle during energy change), capped at 35% of energy for very high bodyweights;
fat is 25% of energy and carbohydrate is the remainder. No rate of weight change
is promised. An optional target weight must point the same way as the goal and
creates a Bodyweight goal from today's weigh-in.

Without an available estimate (under 19, an equation setting other than
male/female, or no eligibility confirmation), the plan step explains why and asks
for manual targets. Water is always the user's own entry.

Saving reuses existing owned paths in order: preferences, the atomic body form
(weight, height, sex, date of birth), an optional waist measurement, nutrition
targets and the optional goal. Each is keyed by user/date/goal id, so a retry
after a partial failure repeats the same requests. Verification:
`onboarding-model.test.ts`, `onboarding-service.test.ts`,
`onboarding-screen.test.tsx` and `navigation.test.tsx`.
