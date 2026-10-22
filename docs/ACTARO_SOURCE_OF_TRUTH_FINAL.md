# ACTARO — SOURCE OF TRUTH

> **Status:** Canonical product context for development
>
> **Authority:** This file defines **what the product is**. If old notes, prior chats, prototypes, generated comments, or implementation assumptions conflict with this file, **this file wins** unless the user explicitly changes the decision.
>
> **Companion:** `FITNESS_APP_DEVELOPMENT_PLAN_FINAL.md` defines **when and in what order** the product is built.
>
> **Design authority:** Figma file — **Actaro — Product Design (Core + Future Releases)**  
> https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW
>
> Product behavior follows this Source of Truth. Release sequencing follows the Development Plan. Visual implementation follows Figma unless it conflicts with product behavior.

---

## 1.0 Product Identity — Confirmed Decision (2026-10-08)

- **Product / public-facing app name:** **Actaro** (title case); marketing wordmark may use **actaro.** in lowercase.
- **Brand intent:** simple, memorable, athletic, progressive, and broad enough for training, nutrition, habits, daily activity, running, and wellness.
- **Short positioning line:** **Train. Track. Progress.** (working tagline, not a required UI element).
- **Visual identity (user-approved redesign, 2026-10-17):** Chalk and Carbon from `docs/Actaro-v1-redesign.pdf`: cool chalk canvas, solid white/charcoal surfaces, ink typography, ember actions, and limited volt completion/PR highlights. The new PDF supersedes the earlier screen atlas and older visual choices for the core release. Product behavior and release boundaries remain governed here.
- **Technical naming defaults:** repository slug `actaro`, Expo project display name `Actaro`, package/project slug `actaro`. Reverse-DNS bundle/package IDs and production domains must be decided and checked prior to store submission; do not assume ownership of `actaro.com` or any identifier.
- **Scope:** branding decision only. No new feature, deadline, version, architecture, or development-status claims are implied.
- **Publication note:** final trademark, store-name, domain, and social-handle clearance is still required before public launch; the brand selection here is a product decision, not legal clearance.

# 1. Product Vision

Build a polished mobile-first personal fitness and wellness application that combines:

- Strength training and workout logging
- Exercise library and training plans
- Nutrition and calorie/macro tracking
- Habits
- Goals
- Weight and body progress
- Steps and daily activity
- Running / outdoor cardio
- Progress analytics
- Deterministic recommendations
- Selective AI only where normal software is insufficient

The application is initially built for personal daily use but must be designed and engineered well enough to become a public product later.

Core product loop:

> **Plan → Do → Track → Understand → Improve**

Core UX principle:

> **Maximum useful information with minimum friction.**

---

# 2. Non-Negotiable Product Principles

1. Everything important should connect.
2. Logging must be fast.
3. Common actions should usually take 1–2 taps where practical.
4. Users control what they track.
5. Advanced features must not complicate basic features.
6. Data should produce useful insight, not just raw numbers.
7. Rest and recovery must not be treated as failure.
8. The app must remain useful without AI.
9. Use deterministic software first; use AI only when deterministic software is insufficient.
10. User data belongs to the user.
11. Design for evolution, not hypothetical scale.
12. Do not add infrastructure, abstractions, or features without a real requirement.
13. Avoid fake precision, especially for physiological or sensor-derived metrics.
14. Design the complete product, but implement it release-by-release.

---

# 3. Anti-AI-Slop Development Contract

## 3.1 Surgical Scope Rule

When the user asks for one specific change:

> **One request = one precise change + only strictly necessary dependencies.**

Do not:

- Refactor unrelated modules
- Redesign unrelated screens
- Rename unrelated code
- Reorganize folders unnecessarily
- Replace libraries during unrelated work
- Add speculative infrastructure
- Add fashionable features without justification
- Perform broad “cleanup” unless correctness requires it

## 3.2 No Fake Completion

Never claim a feature is complete if:

- UI is only mocked
- data is hardcoded
- persistence is missing
- authorization is bypassed
- acceptance criteria are not met
- tests are failing
- integration is incomplete

## 3.3 Required Workflow

For meaningful implementation work:

1. Read this Source of Truth.
2. Read the Development Plan.
3. Inspect relevant existing code.
4. State/derive acceptance criteria.
5. Check schema/data/security implications.
6. Implement the smallest correct change.
7. Test it.
8. Review the diff.
9. Update development status.
10. Commit the focused change.

Important code must remain understandable to the user.

---

# 4. Product Design System

The interface must feel intentionally designed, not AI-generated or template-driven.

## 4.1 Visual Language

The product should feel:

- Athletic
- Sharp
- Precise
- Compact
- Premium
- Calm but strong
- Metric-first
- High-contrast where needed

Use:

- Chalk `#F1F2EE` / Carbon `#0C0D0C` background
- Solid white `#FFFFFF` / Carbon `#171917` surfaces with distinct neutral fills
- Near-black / charcoal text and strong controls
- **Orange-coral** as the primary action/accent family
- **Electric lime** only for limited high-performance highlights
- Thin borders
- Compact cards
- Strong typography
- Disciplined spacing
- Small purposeful charts
- Clear selected states

Avoid:

- Random gradients
- Glass on content cards; glass is permitted only on navigation, headers, floating controls and pinned action bars, with a solid fallback for Reduce Transparency/unsupported platforms
- Generic AI dashboard cards
- Excessive shadows
- Neon gaming-dashboard styling
- Oversized cards for every metric
- Decorative charts
- Giant exercise hero imagery
- Different accent palettes for different screens

## 4.2 Design Consistency

Training, nutrition, progress, running, auth, habits, and goals must use the same:

- Background logic
- Surface logic
- Border system
- Primary CTA treatment
- Selected chip/tab treatment
- Chart accent behavior
- Typography hierarchy
- Spacing rhythm
- Radius logic

## 4.3 Figma Rule

Figma can contain designs for Core V1 and later releases before they are implemented.

> **A screen being designed does not mean it is approved for the current implementation phase.**

---

# 5. Navigation & Information Architecture

Primary bottom navigation (user-approved redesign, 2026-10-17):

- Today
- Train (workouts, exercise library and plans)
- Food (nutrition diary)
- Progress
- You

A separate **Quick log** button is available from all five tabs for food, water, weight, steps, habits and workouts. It reuses the same owned records and validation as the existing logging flows. Existing internal route paths remain compatible.

Inside **You**:

- Habits
- Goals
- Recipes
- Body records and steps/activity
- Profile and account security
- Preferences, habit reminders, privacy and data
- Achievements later
- Integrations later

---

# 6. Account & Authentication

Core account features:

- Sign up
- Sign in
- Sign out
- Password reset
- Email verification where appropriate
- Profile
- Initial preferences

Preferences:

- kg / lb
- cm / in
- km / mi
- kcal / kJ
- Theme
- Notifications
- Privacy
- Gamification preference
- Dashboard layout later

Authentication screens must match the same athletic visual system as the rest of the app.

---

# 7. Today Dashboard

The Today screen is the daily command center.

## 7.1 Top Metrics

### Bodyweight

Show:

- Latest weight
- This-week change
- Small trend sparkline

### Steps / Activity

Show:

- Current steps
- Daily target
- Progress %
- Remaining steps
- Active Minutes when available

Bodyweight and Steps/Activity should have strong first-class placement.

Steps decision (2026-10-18): no manual step-entry UI or read/review/save button.
After Motion permission, automatically read iPhone full-day steps on app
launch/resume and update the visible count while foregrounded. Throttle cloud
writes and replace the date's total rather than adding counts. Step targets live
in Steps & activity. Expo Go cannot deliver background pedometer events; catch
up from Core Motion history when the app returns. Android/web show synced
records without inventing a full-day sensor total. Existing historical manual
records and optional distance entry are retained; Health integrations stay v2.0.

## 7.2 Recent Run / Activity Preview

When running data exists, the Today activity area may show a compact recent-run card with:

- Mini route/track image
- Duration
- Distance
- Average pace
- Session recency/date
- Calories if reliable

## 7.3 Nutrition Summary

Show compactly:

- Calories consumed / target
- Protein
- Carbs
- Fat

## 7.4 Today's Training

Show:

- Workout name
- Exercise count
- Working sets
- Estimated duration
- Training Status
- Start Workout

## 7.5 Secondary Cards

May include:

- Habits progress
- Recovery Check
- Goal progress
- Hydration

Detailed historical analytics belong in Progress.

Dashboard customization is a later enhancement.

---

# 8. Fitness — Strength Training

## 8.1 Exercise Library

Each exercise may include:

- Name
- Primary muscle
- Secondary muscles
- Equipment
- Movement pattern
- Instructions
- Difficulty if available
- Media reference
- Source
- License / attribution metadata

### Preferred base dataset

Use the **RepDB free exercise dataset** as the base reference library.

Recommended source values:

```text
repdb
system
user
```

RepDB provides reference data/media only.

Our own app owns:

- Workout templates
- Workout sessions
- Sets
- Reps
- Weight
- PRs
- Training volume
- User history

## 8.2 Exercise Media

Exercise media is independent from exercise metadata.

Recommended media fields:

- exercise_id
- media_type
- storage_path
- source
- source_external_id
- license
- attribution

Presentation:

- Exercise list: small monochrome/neutral thumbnail
- Active workout: centered uncropped technique media, about 224px square, without a white frame or side gutters (guided-set revision, 2026-10-18); keep logging controls within easy reach
- Exercise detail: larger start/peak poses and instructions

Do not use large hero imagery in the logging flow.

Recommended storage:

```text
Supabase PostgreSQL
  exercises
  muscles
  equipment
  exercise_media

Supabase Storage
  exercise-media/<exercise-id>/start.webp
  exercise-media/<exercise-id>/peak.webp
```

The app must not depend on Hugging Face, Kaggle, GitHub, or RepDB hosting at runtime.

## 8.3 Equipment Profile

Users may define available equipment so plans/exercises can be filtered.

## 8.4 Custom Workouts

Support:

- Exercises
- Sets
- Reps
- Weight
- Rest time
- Optional RPE
- Notes

Later:

- Warm-up sets
- Supersets
- Drop sets
- Advanced set types

### Real-world workout management — confirmed 2026-10-12

Exercise selection revision (2026-10-19): search-result quick-add buttons keep
the workout picker, query and filters open for multiple additions. Added rows
show set count and an edit action for the same planned set targets. Reuse the
set editor in a sheet without leaving search; changes remain in the workout
draft until Save workout. Quick add avoids accidental duplicate additions and
respects the existing exercise/set limits. General-library Add opens the workout
chooser directly; detail viewing and direct exercise logging remain available.

- Create, reopen, edit and delete reusable workouts. Deleting a workout template
  removes planned targets but preserves recorded sessions and performed sets.
- Create an editable seven-day training split, assigning workouts to days and
  explicitly supporting rest days. Seven calendar days does not mean seven
  mandatory training days. Users can change or delete their split without
  rewriting past logs; workouts can also be performed outside the schedule.
- From exercise search/detail, add an exercise to a new or existing workout,
  or log it directly without first creating a reusable workout. Direct logging
  uses the same owned session/set data and validation as workout logging.
- Reopen, edit and delete recorded logs through workout history; changes must
  update derived volume/PR calculations consistently.
- Figma remains the visual reference. Its example screens are not an exhaustive
  specification of real-world behavior or a substitute for these requirements.

## 8.5 Predefined Training Plans

Initial families:

- Beginner Full Body
- Push / Pull / Legs
- Upper / Lower
- Strength
- Hypertrophy
- Home Workout
- Bodyweight
- Beginner Running

Plans may filter by:

- Goal
- Experience
- Days/week
- Available equipment

No AI required.

---

# 9. Active Workout Experience

Starting a workout must open a **dedicated active-session screen**.

Flow:

```text
Workout Detail
→ Start Workout
→ Choose Session Mode
→ Timed Workout OR Log Only
→ Dedicated Active Workout Screen
→ Workout Summary
```

## 9.1 Timed Workout

Starts the overall session timer.

Record:

- Started at
- Finished at
- Total duration
- Pause/resume state where supported

## 9.2 Log Only

No overall workout duration timer.

Still record:

- Exercises
- Sets
- Reps
- Weight
- Notes
- Workout completion

Use the label:

> **Log Only**

## 9.3 Rest Timer

Separate from the overall session timer.

Available in both modes.

Support:

- Auto-start after a completed set
- Pause/resume
- Skip
- +15 sec
- -15 sec

## 9.4 Set Logging

Fast set logging (user testing revision, 2026-10-20; supersedes guided swipe cards):

- Planned sets, reps and load remain prefilled from the workout.
- Show all sets in a compact Set / Weight (preferred unit) / Reps table. Tap a number to replace it directly; no editor is required for basic logging.
- Highlight the current/selected row. The pinned Log set action completes it and advances to the next unfinished set. Row check buttons log or undo that specific set.
- Set progress bars and row numbers select any set. Logged rows stay visible. Selecting a completed row never logs another row or leaves the workout.
- Undo preserves actual values and the planned row. Completing all sets offers the next exercise or Finish workout; it never finishes automatically.
- Row options expose optional RPE/notes and removal. Add set remains available. Rest and workout notes expands secondary settings.
- Keep previous performance for the selected set, independent rest controls, gym-friendly tap targets and accessible numeric fields. Blank load means unknown; zero means no added external load.
- Native back and in-app back offer Save as draft, Discard workout and Continue workout. Saving waits for device storage, pauses clocks and preserves performed sets without finishing the session. Failed storage keeps the screen open.
- Workout history opens on a month calendar marked from completed sessions. History opens the detailed searchable list and its edit/delete controls.

The detailed fields remain available:

```text
SET | PREVIOUS | WEIGHT | REPS | DONE
```

Requirements:

- Previous performance visible
- Sensible prefill where appropriate
- Add/remove sets
- Mark set complete
- Large gym-friendly tap targets
- Avoid unnecessary modal flows

## 9.5 Active Exercise Layout

Recommended hierarchy:

```text
Workout header
Session timer only if Timed
Exercise X of N
Compact technique image
Exercise name + muscle/equipment
Previous performance
Best performance / PR
Set progress + compact editable set table
Pinned Log set action; secondary set options
Rest timer when active
Previous / Next exercise
Finish workout
```

## 9.6 Workout Summary

May show:

- Exercises completed
- Sets completed
- Total volume
- Duration only for Timed
- PRs
- Optional note

---

# 10. Training Metrics & Recovery

## 10.1 Personal Records

Support:

- Heaviest lift
- Rep PR
- Estimated 1RM PR
- Running PRs later

## 10.2 Training Volume / Load Summary

V1 training load is deterministic, not physiological.

Use:

- Working sets
- Reps
- Weight
- Total volume
- Workout frequency
- Duration
- Muscle-group volume
- Optional RPE later

Prefer labels:

- Training Volume
- Training Load Summary

Do not imply EPOC, VO2 max, HRV, or physiological recovery.

## 10.3 Training Status

Rules-based statuses may include:

- On Track
- Low Training Volume
- High Training Volume
- Missed Sessions
- Recovery Week
- Balanced Training
- Imbalanced Training

## 10.4 Recovery Check

Use:

- Self-reported energy
- Soreness
- Sleep quality
- Stress optional
- Recent workout frequency
- Recent training volume
- Rest days

Prefer:

- Good
- Moderate
- Consider Recovery

Avoid fake 0–100 precision.

---

# 11. Nutrition

## 11.1 Daily Targets

User revision (2026-10-20): offer manual entry or a deterministic maintenance
estimate using the 2023 adult DRI Estimated Energy Requirement equations.
Prefill saved age/weight/height and show source dates. Missing inputs can be
entered locally; a shared personal-details editor can save height, sex, birth
date and location explicitly. Generation makes no write. Review/edit targets
before Save; water remains user-set. A 20/50/30 protein/carbohydrate/fat split is
an editable starting default within adult reference ranges, not individualized
macro requirements. Keep manual entry for unsupported cases. Do not use BMI as
a calorie-needs equation or silently apply weight-loss/gain adjustments.
See `docs/TARGET_CALCULATION.md` for sources, bounds and calculation behavior.

- Calories
- Protein
- Carbohydrates
- Fat

Later:

- Fiber
- Sodium
- Potassium
- Micronutrients

## 11.2 Food Diary

Meal groups:

- Breakfast
- Lunch
- Dinner
- Snacks

Show:

- Food
- Quantity
- Calories
- Macros
- Meal total
- Daily total
- Remaining targets

## 11.3 Food Search & Selection Flow

The complete manual flow:

```text
Choose Meal
→ Search / Recent / Frequent / Favorites / Saved Meals
→ Select Food
→ Choose Serving Unit
→ Adjust Quantity / Portion
→ Live Calories + Macros Recalculate
→ Add to Meal
→ Review Meal
→ Save / Log
```

Interaction may take inspiration from MyFitnessPal while retaining this app's own visual language.

## 11.4 Portion Size & Serving Logic

When logging food, support applicable units such as:

- grams
- ounces
- milliliters
- serving
- piece
- slice
- cup
- tablespoon
- teaspoon
- packaged serving size
- custom numeric quantity

The portion editor should visibly support:

- Serving-unit selector
- Quantity stepper
- Direct numeric input
- Gram/ounce input where relevant
- Live calories/macros preview
- Base-serving explanation
- Immediate meal-total impact

The app must deterministically recalculate:

- Calories
- Protein
- Carbs
- Fat
- Meal totals
- Daily totals

The user should always understand:

- Selected unit
- Quantity
- Base serving
- Final calculated values

## 11.5 Food Sources

Support:

- Common foods
- Packaged foods
- Custom foods
- Favorites
- Recent
- Frequent
- Saved meals

## 11.6 Fast Logging

Support:

- Recent foods
- Frequent foods
- Favorites
- Copy meal
- Copy yesterday
- Repeat meal
- Saved meals

## 11.7 Custom Foods

Manual food creation.

## 11.8 Recipes

User testing revision (2026-10-21): distinguish a custom food copied from a label,
a recipe calculated from ingredient amounts, and a saved meal copied from diary
entries. Your recipes opens a dedicated recipe-only list with create/edit and
portion logging. Ingredient search/portion editing uses a sheet. Calculated
batch, per-serving and optional cooked-weight nutrition stays above ingredients.
Saving a recipe does not log it; choose a portion and diary meal, then confirm.

User revision (2026-10-21): the recipe builder lists each ingredient with its amount,
weight and calories/macros, followed by a combined recipe total, then servings and
optional cooked weight. While choosing an ingredient, the sheet shows what it adds
and the new recipe total. Countable foods default to USDA's measured "1 medium"
portion (for example a 118 g banana); other foods default to their base grams.
Switching between weight units keeps the same amount, and picking a household
portion starts at one. The Food tab has a visible Recipes section to create or open
recipes. No new food data is added: the USDA SR Legacy catalogue already supplies
measured household portions for most foods.

Support:

- Recipe name
- Ingredients
- Ingredient quantities
- Servings
- Total calories/macros
- Per-serving nutrition

## 11.9 Recipe-by-Weight

Support:

- Total cooked weight
- Total recipe nutrition
- Nutrition per gram / 100g
- Logging arbitrary gram quantities

## 11.10 Hydration

Support quantity and daily target.

## 11.11 Later Nutrition Enhancements

- Barcode scanning
- Nutrition label scanning
- What-If Nutrition
- Smart deterministic meal substitutions

---

# 12. Habits

User testing revision (2026-10-18): date fields use calendar controls and reminder
times use a time picker. Confirmed quick completions update the visible habit in
place with a short completion animation that respects Reduce Motion; no success
is shown before the write is acknowledged. Explain habit types in everyday terms.
Today lists all habits scheduled for the current date in horizontally swipeable
cards, with Habit 1 of 3 at the top and a Log button at the bottom of each
unlogged card. Previous/Next buttons provide a non-gesture alternative; swiping
does not write or fetch records. Daily checks log in one tap; an in-place sheet
handles amounts, minutes, limits and edits. Weekly habits count distinct positive
logged dates (1–7 days per Monday–Sunday week), once per date. Logging today
replaces its result with done/not done. After an acknowledged log, replace the
lower log/edit buttons with the result and one three-dot control on the right.
It opens corrections/undo, including partial amounts and explicit zero. Today
keeps the selected card after logging; the Habits list uses compact result rows.
Keep schedule/history and management actions available through the list menu.
The daily Log button returns on the next eligible date with no log (user revision, 2026-10-20).
Today has no Manage all habits shortcut; management remains under You → Habits.
This user correction (2026-10-19) supersedes same-day occurrence increments.
Existing stored counts are retained, but each positive date contributes one
day. Daily numeric totals remain editable through the three-dot control.
Linked goal cards update in place only after an acknowledged save, using the
same date-bounded calculation as a reload, without another API read.
Distinguish not logged, in progress,
over-limit, rest/future days and target met; do not use an unexplained "Not yet".

Habit types:

User testing clarification (2026-10-19): present logging choices in plain
language with examples. Show the three common choices first and retain the
weekly/limit choices under More logging options. Reminders and other optional
settings may collapse without losing their values. These are presentation
changes; all five kinds remain supported.

- Boolean
- Numeric
- Duration
- Frequency
- Avoidance

Configuration:

- Name
- Goal
- Unit
- Frequency
- Start date
- Optional end date
- Reminder

Motivation modes:

- Streaks
- Weekly consistency
- Completion %
- None

Scheduled rest/non-action days should not break progress.

---

# 13. Goals

Explain that habits are repeated actions while goals measure outcomes from saved
records. Show the source record value, target and starting value clearly, with an
action to open the relevant logging section. Missing evidence remains unknown.
Goal record/edit/delete/restore actions use visibly bounded buttons, separate
from explanatory text.

Goal categories:

User testing clarification (2026-10-19): show common outcomes first and retain
all implemented metrics under More goals, without requiring category selection.
Explain the source records for the selected outcome. Label the baseline Starting
value and infer direction from starting/target values where decreases are
supported. Optional dates/settings may collapse without losing their values.
Habits are actions users record; goals calculate progress from saved records.

## Body

- Weight
- Measurements

## Training

- Workouts/week
- Strength target
- Exercise PR

## Running

- Distance
- Pace
- Event later

## Activity

- Steps
- Distance
- Active days

## Nutrition

- Calories
- Protein
- Macro adherence

## Habits

- Completion
- Frequency

---

# 14. Progress & Analytics

## 14.1 Body

User revision (2026-10-20) supersedes the unified daily form below: open on a
dated weigh-in with an optional note. Height, sex, birth date and location live
in a separate explicit personal-details editor, reused by the target calculator.
Daily weight saves never update these details. Reuse the latest saved height;
do not create another height record when it is unchanged. Keep history collapsed
by default and retain measurement/history editing/deletion behind their controls.

- Weight
- Body measurements

User testing revision (2026-10-18): Body records opens one form for optional
weight, height, sex, date of birth and city/country text. The log date applies
only to weight/height; other details are private editable profile fields, with
no location permission or inferred measurements. Save is atomic. Blank dated
measurements preserve existing records; explicit history deletion remains.
Named measurements and their history/goals remain available through an optional
additional-measurement editor, without separate primary logging tabs.

## 14.2 Nutrition

- Calories
- Protein
- Macro adherence

## 14.3 Training

- Workout frequency
- Sets
- Volume
- Strength progression
- PRs
- Muscle balance

## 14.4 Activity

- Steps
- Distance
- Active Minutes
- Running when available

## 14.5 Habits

- Completion
- Consistency

## 14.6 Time Filters

- 7D
- 30D
- 3M
- 6M
- 1Y
- All

## 14.7 Analytics Engine

Prefer:

- SQL
- Statistics
- Rule-based logic
- Deterministic calculations

Core analytics:

- Weekly nutrition summary
- Weekly workout summary
- Monthly comparison
- Muscle volume
- Training balance
- Goal progress
- Plateau detection
- Weight trend
- Habit consistency
- Step trend
- Running trend
- “What changed?”

Do not use AI where normal analytics is enough.

## 14.8 Advanced Analytics

Later capabilities include:

- Performance Dashboard
- Training Block Comparison
- Unified Timeline
- Advanced deterministic cross-metric analysis

Examples:

- Calories vs weight
- Steps vs weight
- Protein vs training progress
- Workout frequency vs strength
- Active Minutes vs activity consistency
- Running volume vs pace trend

Correlation must not be presented as causation.

---

# 15. Active Minutes

Support a **phone-estimated Active Minutes** concept using supported mobile motion/activity signals and step context where available.

Possible labels:

- Active Minutes
- Moderate Activity
- Vigorous Activity

Only use classifications supported reasonably by the platform/data.

Important:

- Accelerometer-only estimates are imperfect.
- Do not present phone-only estimates as heart-rate intensity.
- Do not imply Garmin-equivalent physiological accuracy.
- Heart-rate/wearable-enhanced intensity belongs later.

Active Minutes can feed:

- Today activity
- Progress
- Performance Dashboard
- Badges

---

# 16. Running / Outdoor Cardio

Running is a dedicated product area, designed now and implemented after the deterministic core.

Execution exception approved by the user on 2026-10-21: implement running early,
including background GPS support, with native development-build/device acceptance
deferred. The first implementation records private routes, time, distance and pace;
supports pause, review/save, history/detail and Today/Progress integration; and
draws route outlines. The user's subsequent 2026-10-21 feedback also authorizes
live street maps, a Strava-informed recording flow, GPS drift filtering and
separate live/moving-average pace. User decision (2026-10-21): free, keyless
OpenFreeMap tiles rendered by MapLibre supply the street map on iPhone, Android and
web; Apple Maps is not used. The same decision authorizes a Strava-style recording
layout (large live map, cased route line, start/position/finish markers, prominent
time/distance/pace) and per-km/mi moving-pace splits on run review/detail, derived
from the saved route. Elevation, heart rate and other §16.6 advanced running remain
later. Location
recording remains device-local until explicit save. This does not authorize active
minutes, inferred calories, running goals/events, wearables or advanced analytics.
See `RUNNING_TESTING.md` for limits and the deferred checks. Core release approval
remains separate.

## 16.1 Running Screens

Design and later implement:

- Run Start
- Active Run Session
- Post-Run Summary
- Run Detail
- Run History
- Today recent-run card
- Running-aware Progress cards

## 16.2 Run Session Data

Support:

- Session date/time
- Duration
- Distance
- Average pace
- Calories where reliable
- Step contribution where relevant
- Route/path
- Route thumbnail
- Start/end markers later

## 16.3 Run Start

May show:

- GPS readiness
- Open run
- Distance goal
- Time goal
- Run settings

## 16.4 Active Run

Show prominently:

- Elapsed time
- Distance
- Current/average pace
- GPS/route
- Active Minutes
- Steps if useful
- Pause
- Stop

## 16.5 Run Summary

Show:

- Route
- Distance
- Duration
- Average pace
- Calories
- Splits when available
- Activity contribution

## 16.6 Running in Analytics

Preferred activity/running card:

- Mini route image
- Duration
- Distance
- Pace
- Date/session label
- Calories if reliable

This can sit alongside or directly below Steps/Activity.

Later advanced running:

- Elevation
- Splits
- Heart rate
- Cadence
- Deeper running analytics
- Events

---

# 17. Achievements / Badges

Deterministic milestones only.

Examples:

- First Workout
- 10 / 50 / 100 Workouts
- First PR
- 4-week consistency
- 10K Steps
- 150 Active Minutes
- First 5K
- Protein Goal 7 Days
- Habit consistency
- Weight Goal Reached

Badges should reward real persisted events, not decorative fake progress.

---

# 18. Selective AI Policy

The product is:

> **Fitness App + Analytics Engine + Recommendation Engine + Selective AI where necessary**

No generic chatbot.

No free-form “Ask anything” box.

No autonomous AI coach.

No medical diagnosis.

No injury diagnosis.

No body-fat photo estimate presented as accurate.

## 18.1 Approved AI Scope

### Food Photo Recognition

Flow:

```text
Take photo
→ Vision identifies food
→ Estimate portion
→ Match against nutrition data
→ Editable review
→ User confirms
→ Log through normal nutrition system
```

Mandatory:

- Never auto-log
- Always editable
- User can change food
- User can change portion
- User can remove/add items
- Clearly label estimates

The manual nutrition engine must exist first.

## 18.2 Possible Later AI

Only if justified:

- Semantic search
- Exercise-form computer vision
- Optional explanation generation

---

# 19. Technical Architecture

## 19.1 Mobile

- React Native
- TypeScript
- Expo development builds

## 19.2 Backend Platform

Use Supabase as the V1 backend platform:

- PostgreSQL
- Auth
- Row Level Security
- Storage
- Edge Functions only when required
- Realtime only when useful

A separate Node/NestJS backend is **not required for the Core release**.

## 19.3 App/Data Layer

Preferred shape:

```text
UI
→ hooks / feature services / data layer
→ Supabase
```

Do not scatter raw Supabase queries throughout React components.

## 19.4 State

- TanStack Query for server state
- Zustand only where justified
- React local state where sufficient

User-requested caching (2026-10-18): bounded memory-only read reuse for 60 seconds,
concurrent-request deduplication and visible-data retention during refresh.
Keys include authorization, query parameters, headers and read-RPC input; writes
and auth changes invalidate reads. Remote authentication is not TTL-cached.
Explicit refresh bypasses cached reads. This is not the v1.5 offline sync queue,
and must not retain another account's view or overwrite acknowledged edits with
an older in-flight response.

## 19.5 Exercise Library Architecture

```text
React Native
    ↓
Data/service layer
    ↓
Supabase PostgreSQL
  ├── exercises
  ├── muscles
  ├── equipment
  └── exercise_media
      +
Supabase Storage
  └── exercise images
```

RepDB is imported into our own schema.

## 19.6 Offline Direction

Highest-priority offline case:

> **Never lose an active workout because connectivity disappears.**

Core release may use local persistence for active sessions.

Full offline architecture may later include:

- Local SQLite
- Sync queue
- Idempotency
- Conflict strategy
- Reconciliation

## 19.7 Custom Backend Trigger

Introduce a dedicated backend/Cloud Run only when justified by real requirements such as:

- Complex workflow orchestration
- Many third-party integrations
- Heavy processing
- Background workers
- Central public API
- AI pipelines that cannot be handled safely by Edge Functions

Avoid premature:

- Microservices
- Kubernetes
- Kafka
- Redis
- API gateways

---

# 20. Security & Privacy

From the beginning:

- Secure authentication
- Row Level Security
- Ownership enforcement
- Input validation
- Secure secrets
- Minimal sensitive-data collection
- Safe logging
- Account deletion
- Data export
- No credentials in source control

Users must not access another user's:

- Workouts
- Sets
- Nutrition logs
- Recipes
- Habits
- Goals
- Weight
- Measurements
- Analytics

---

# 21. Core Domain/Data Ownership

Reference/library data may be shared:

- Exercises
- Muscles
- Equipment
- System training plans

User-owned data includes:

- Profile/preferences
- Workout templates created by user
- Workout sessions
- Exercise sets
- Custom exercises
- Foods created by user
- Food logs
- Saved meals
- Recipes
- Habits
- Goals
- Weight/body measurements
- Recovery check-ins
- Running sessions
- User analytics materializations if persisted

All user-owned rows require ownership controls/RLS.

---

# 22. Product Version Boundaries

The app should be developed in small usable releases.

## v0.1 — Foundation

- React Native / Expo
- Design tokens
- Navigation
- Supabase
- Auth
- RLS/security
- Core schema foundation

## v0.2 — Exercise Library

- RepDB import
- Exercise media
- Search
- Filters
- Exercise detail

## v0.3 — Strength Workout Logging

- Custom workouts
- Plans
- Pre-start
- Timed / Log Only
- Active workout
- Sets/reps/weight
- Rest timer
- Workout summary
- History
- PRs

## v0.4 — Manual Nutrition

- Targets
- Search
- Serving units
- Portion editor
- Diary
- Custom foods
- Saved/recent/frequent/favorites
- Recipes
- Recipe-by-weight
- Hydration

## v0.5 — Habits, Goals, Today

- Habits
- Goals
- Real-data Today dashboard

## v0.6 — Basic Progress

- Weight
- Training
- Nutrition
- Steps
- Habits
- Time filters
- Basic deterministic summaries

## v0.9 — Quality / Personal Beta

- Security review
- Accessibility
- Error handling
- Performance
- Notifications
- Active workout resilience
- Personal beta
- Bug fixing

## v1.0 — Core Deterministic Release

The app must already be genuinely useful without GPS, food-photo AI, wearables, or advanced analytics.

## v1.1 — Activity Improvements

- Active Minutes
- Improved phone activity context

## v1.2 — Running / GPS

- Run Start
- GPS route recording
- Active Run
- Run Summary
- Run Detail
- Run History
- Running-aware Today/Progress

## v1.3 — Advanced Analytics & Achievements

- Performance Dashboard
- Training Block Comparison
- Unified Timeline
- Advanced deterministic analytics
- Badges/Achievements

## v1.4 — Food Photo AI

- Image capture
- Food recognition
- Portion estimation
- Nutrition matching
- Editable confirmation

## v1.5 — Advanced Offline / Sync & Polish

- Local relational cache where justified
- Sync queue
- Conflict handling
- Better offline behavior

## v2.0 — Health & Wearables

- Apple Health
- Android Health Connect
- Wearables
- Sleep
- HR / HRV
- Imported activity
- Sensor-enhanced readiness
- Sensor-enhanced training load
- Daily Suggested Workout
- Advanced running analytics

---

# 23. Explicitly Deferred / Rejected

Do not add these unless scope changes:

- Generic AI chatbot
- Autonomous AI coach
- AI motivational spam
- Medical/injury diagnosis
- Fake physiological readiness scores
- Fitness Age
- Body Battery imitation
- AI body-fat estimate presented as accurate
- Microservices for early versions
- Kubernetes/GKE
- Unnecessary custom backend

---

# 24. Source-of-Truth Maintenance

When a product decision changes:

1. Update this file.
2. Update the Development Plan if sequencing is affected.
3. Update Figma if UX is affected.
4. Update development status.
5. Mark removed/replaced behavior explicitly.
6. Do not rely on chat history as the authoritative source.

This file is the single product authority for Codex/Claude/other implementation agents.
