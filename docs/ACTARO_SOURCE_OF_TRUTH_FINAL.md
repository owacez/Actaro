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
- **Visual identity:** retain the established athletic Figma design system: warm off-white/stone canvas, charcoal typography, orange-coral primary accent, limited electric-lime performance highlights, crisp compact components.
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

- Warm off-white / soft stone background
- Slightly elevated soft-white/light-stone surfaces
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
- Glassmorphism
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

Primary bottom navigation:

- Today
- Fitness
- Nutrition
- Progress
- More

Inside **More**:

- Habits
- Goals
- Recipes
- Achievements
- Profile
- Settings
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
- Active workout: compact 100–140px technique media
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

Fast table-style logging:

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
Set table
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

Habit types:

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

Goal categories:

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

- Weight
- Body measurements

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
