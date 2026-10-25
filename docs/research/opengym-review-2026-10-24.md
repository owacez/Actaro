# openGym review (2026-10-24)

Reviewed: [openGym](https://github.com/DuarteSantos8/openGym) by Duarte Santos, commit
`7a3ace53` (2026-10-23), AGPL-3.0. Read-only research; no openGym code, data or media
is copied into Actaro.

## How openGym works without a server

- React 19 + Vite web app; the iPhone and Android apps are Capacitor shells.
- There is no client database. The whole app state is one Zustand object, saved as JSON
  in `localStorage` (`gym_state_v1`) and mirrored to a file on mobile. Media use IndexedDB.
- Local mode has no account. A server is optional, and sync is local-first: the client
  pushes the full document with a revision, and on conflict merges by id with
  timestamps and tombstones.
- **Fit for Actaro:** Actaro's data is relational (workouts, sets, foods, habits, goals,
  runs, history queries and server calculations). A single JSON blob would not scale
  to it. `expo-sqlite` (official, in Expo Go, iOS/Android/web) is the better local
  store. Web needs COOP/COEP headers.

## Health integration

- iOS: a custom HealthKit plugin. It writes workouts and body mass, and reads workouts,
  body mass and heart rate.
- Android: a Health Connect plugin, write-only (exercise sessions, weight).
- No Google Fit: Google has replaced the Fit APIs with Health Connect.
- **For Actaro (Expo):** `@kingstinct/react-native-healthkit` (Expo config plugin) and
  `react-native-health-connect`. Neither runs in Expo Go; both need a development build.

## Exercise catalogue comparison

|              | RepDB (Actaro today)                                              | openGym                                                                                                                                                             |
| ------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exercises    | 643                                                               | 6,554 (5,632 without female-figure duplicates)                                                                                                                      |
| Text licence | RepDB Free Tier (commercial in-app use, attribution)              | 1,324 from ExerciseDB v1 under MIT; the rest openGym's own work under **AGPL-3.0**                                                                                  |
| Media        | 1,138 RepDB poses (licensed for in-app use)                       | Gym visual stills and clips, **licensed to openGym only; reuse prohibited**                                                                                         |
| Categories   | strength 526, stretching 79, cardio 18, olympic 16, plyometrics 4 | strength 2,895, calisthenics 1,012, stretching 466, mobility 372, plyometrics 240, isometric 183, cardio 145, yoga 109, olympic 74, pilates 62, rehab 38, combat 36 |

**Name matching**

- Method: normalized tokens, with Jaccard similarity ≥ 0.75 counting as a close match.
- 301 of RepDB's 643 exercises (47%) appear in openGym: 195 exact and 106 close. Close
  matches include some near-misses, such as a seated and a standing calf raise.
- About 5,346 openGym exercises have no RepDB match: 1,172 MIT (ExerciseDB text) and
  4,174 AGPL.
- The comparison script and full row-by-row results are kept outside the repository.

**What can legally be used**

- The 1,172 MIT exercises could be added as text (name, target and secondary muscles,
  equipment, instructions), with attribution and **without images**. ExerciseDB's
  original GIFs are not part of that MIT dataset, and openGym's media cannot be reused.
- The AGPL exercises would require Actaro itself to be licensed under AGPL-3.0.

## Muscle-based selection

- openGym's `/muscles` page shows front and back figures side by side. Single-select
  muscles and chips with counts sit beneath, then an exercise list (primary and
  secondary, labelled) with search and equipment filters.
- The body outlines come from [MuscleMap](https://github.com/melihcolpan/MuscleMap) by
  Melih Colpan (MIT).
- Actaro uses MuscleMap directly: `scripts/musclemap-paths.mjs` generates
  `src/features/muscles/body-paths.ts` with the MIT notice. Actaro's own region mapping
  covers all 31 RepDB muscles. None of openGym's AGPL code or mapping tables is used.
