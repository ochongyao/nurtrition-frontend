# nurtrition

## Product Vision

nurtrition is a competitive and emotional family wellness app, not a single-player calorie counter.
Target: families, especially those living apart (e.g., a student studying abroad + parents back home).

- **Primary love language:** food / "Have you eaten yet?"
- **Core mechanic:** AI food-photo scanning that produces a **0 to 100 Health Score** (plant diversity,
  fiber, and low ultra-processed food / NOVA score) instead of pure calorie restriction.
- **Multiplayer loop:** a shared family meal feed (candid meal photos + quick reaction emojis) and a
  weekly **normalized** family leaderboard / co-op goal (e.g., "Family greens goal: 18/25").

## Tech Stack & Hackathon Rules

1. **React Native + Expo**, must run cleanly on Android via **Expo Go**.
2. **Camera:** `expo-image-picker` `launchCameraAsync` with `quality: 0.5`. No custom viewfinders
   (they break Expo Go lifecycles).
3. **Architecture:** `App.js` is the central state holder + view switcher (`meals`,
   `familyMembers`, `userProfile`). Code lives in:
   - `components/NavBar.js`: pill switcher `[ 🍲 Table ] [ 📸 Share Meal ] [ 🌿 Rhythm ]`.
   - `components/ScanView.js`: camera capture + sample loads + nourishment card + share.
   - `components/StreamView.js`: "The Kitchen Table" feed with care reactions.
   - `components/StandingsView.js`: "Family Rhythm" harmony card + member rows; embeds Insights.
   - `components/InsightsView.js`: demographics form + weekly notes.
   - `components/AuthView.js`: account panel (sign in, register, family circle).
   - `api/`: `client.js`, `endpoints.js`, `adapters.js` (FamilyCareEats integration).
   - `context/FamilyCareContext.js`: auth + data state with offline fallback.
   - `data/mockFamily.js`: seed meals/roster + all local scoring/audit utilities.
4. **Backend:** the live API is FamilyCareEats (full contract in `API_docs.md`). The app talks to it
   through `api/`, and every call is wrapped so the app still runs with no backend. The offline demo
   uses `data/mockFamily.js`. Never let a network failure block a screen.
5. **No breaking native modules:** stick to Expo-managed packages only
   (`expo-image-picker`, `expo-status-bar`, `react-native-safe-area-context`). Do not add native
   modules.

### CRITICAL ANDROID RULE

Always wrap top-level screens in `SafeAreaView` or apply `insets.top` from
`react-native-safe-area-context`. Never allow headers or absolute-positioned elements to render
under the Android status bar.

- Root is wrapped in `<SafeAreaProvider>`; the shell reads `useSafeAreaInsets()` and applies
  `paddingTop: insets.top` / `paddingBottom: insets.bottom`.
- Android is **edge-to-edge** (SDK 54+), so the status bar is always translucent and content draws
  beneath it. `<StatusBar style="dark" />` sets dark icons; the warm `#FAF7F2` canvas shows through
  behind it. Do NOT pass `backgroundColor` or `translucent`: those props no longer exist in
  `expo-status-bar` SDK 57.

## Backend Integration (FamilyCareEats)

- Base URL `https://wheatless-jermaine-aftmost.ngrok-free.dev`. Full contract in `API_docs.md`.
- `api/client.js`: `request()` wrapper, JWT bearer token via `setAuthToken`, 15s default timeout
  (45s for uploads), `ngrok-skip-browser-warning` header, and a normalized `ApiError`.
- `api/endpoints.js`: register, login, getMe, createFamily, joinFamily, getFamilyFeed,
  getWeeklyDigest, getMeal, reactToMeal, and uploadMeal (multipart FormData).
- `api/adapters.js`: maps API payloads to the UI shapes and back (`feedItemToMeal`,
  `uploadResultToMeal`, `weeklyToRows`, `profileFromMe`, `PLANT_COLOR_HEX`).
- `context/FamilyCareContext.js`: owns auth and data. `mode` is `offline` or `live`. Exposes
  signIn, signUp, signOut, createFamily, joinFamily, refresh, uploadMealPhoto, transmit, react.
- `components/AuthView.js`: the account panel (sign in, create account, family circle, sign out).
- Fallback rule: any live call that fails falls back to local demo data or a local analysis, so the
  app never blocks. Camera upload uses `expo-image-picker` at `quality: 0.5`.

## Design System (LOCKED): Warm & Cozy Minimalist

This is a hard rule for all future UI work. The look is inspired by Muji / Kinfolk / warm
lifestyle journals: calm, uncluttered, kitchen-table warmth. Do NOT reintroduce the harsh
institutional/Swiss style (black grid lines, dense tables, zero-radius boxes, "DEFICIT" labels).

- **Palette (strict):**
  - Canvas / background: warm oat milk `#FAF7F2`
  - Cards / surfaces: soft white `#FFFFFF`
  - Borders: `1px solid #EFEAE2` (very faint warm)
  - Primary text: deep warm charcoal / espresso `#2B2826`, never pure black
  - Muted text: warm taupe `#756D65` (darkened from `#8C847C` to pass WCAG AA)
  - Accents: deep matcha `#4F7059` (primary) and warm terracotta `#B25A3E` (care/CTA), both AA-tuned
  - Tints: matcha `#E8EFE9`, terracotta `#F6E5DE`. No gradients, no neon.
- **Geometry:** generous radii, `18` to `24px` on cards and `999px` (pill) on buttons and tags.
- **Breathing room:** vertical `gap: 16`, card padding `20+`. No dense tables, no grid lines.
- **Shadows:** soft and warm only (`#2B2826` at ~5% opacity, elevation 1 to 2), and only on
  elements that truly float (the nav pill). Flat cards rely on the warm border instead.
- **Typography:** warm serif for headings/dish names/scores
  (`Platform.select({ ios: 'Georgia', android: 'serif' })`); system sans for body; sentence case
  (NOT uppercase). Friendly, gentle microcopy. `@expo/vector-icons` is NOT used; emoji carry
  warmth (🍲 📸 🌿 ❤️ 🍵 🌱).
- **Tone:** never competitive or judgmental. No ranks, no "DEFICIT", no pressure.
- **Emoji (owner override):** emoji are deliberate in the nav, the two care reactions, the
  snap/share buttons, and the garden line. Do not add emoji elsewhere; food and avatar emoji are
  accepted as image placeholders only.

### Component contracts
- `App.js`: warm serif brand header (`FamBite` + tagline); 3-tab `NavBar` at the bottom.
  Transmitting a meal prepends it to `meals` and switches to the Table tab.
- `NavBar.js`: pill switcher `[ 🍲 Table ] [ 📸 Share Meal ] [ 🌿 Rhythm ]`
  (active = matcha pill, white text; inactive = transparent, taupe text).
- `ScanView.js`: rounded `24px` viewfinder; `📷 Snap Today's Plate` (matcha pill); sample tags;
  calm result card with dish name in serif, circular matcha score ring (`88 / 100 Nourishment
  Score`), friendly note, stat pills, and `Share with Family ❤️` (terracotta pill).
- `StreamView.js` ("The Kitchen Table"): fridge-photo cards (`20px` radii); warm headers like
  `Mom · Kuala Lumpur`; nutrition summary; care reactions `❤️ Proud of you · N` and
  `🍵 Stay hydrated · N`.
- `StandingsView.js` ("Family Rhythm"): collective "Family Harmony: N% of meals this week were
  wholesome & home-cooked 🌱" garden card + soft member cards with friendly streaks; embeds
  `InsightsView`.
- `InsightsView.js`: cozy, non-scrolling section: "Your Week, Gently" demographics form and
  "Little Notes" warm feedback (🌿 / 🍂), no PASS/FLAG or deficit language.

## Navigation

This hackathon build uses a **single lean `App.js` state-based view controller**
(Table / Share Meal / Rhythm) driven by `NavBar`, intentionally NOT Expo Router, to keep the demo
surface small and Expo Go-safe. Insights lives inside the Rhythm tab.

## Expo has changed: do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or
removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json` (currently **SDK 57**).
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt, an index of all Expo docs with
   corrections to common LLM misconceptions. Follow its links to the specific page; never answer
   from memory.

**SDK 57 gotcha already hit:** `ImagePicker.MediaTypeOptions` is deprecated. Use
`mediaTypes: ['images']` instead of `MediaTypeOptions.Images`.

## Commands

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn add, resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Environment Notes (Windows)

- Project path contains brackets (`[1] Projects`), which breaks PowerShell `Set-Location`/`workdir`.
  Run directory-dependent commands via `cmd /c 'cd /d "<abs path>" && <command>'`.

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (CNG). Never create or edit
  them by hand; configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. Adding a library with native code requires a
  development build (`npx expo run:android` or `eas build --profile development`).
- Prefer recommended Expo modules over third-party libraries. Docs:
  https://docs.expo.dev/versions/latest/index.md

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read these installed skill files directly (use these paths even if a same-named global skill exists):
- Core filter, always on: `antislop`: `.opencode/skills/antislop/SKILL.md`
- Copy & text: `antislop-copywriting`: `.opencode/skills/antislop-copywriting/SKILL.md`
- People: `antislop-human`: `.opencode/skills/antislop-human/SKILL.md`
- Mobile / responsive: `antislop-layoutmobile`: `.opencode/skills/antislop-layoutmobile/SKILL.md`
- Code comments: `antislop-code`: `.opencode/skills/antislop-code/SKILL.md`
- UI / visual: `antislop-ui`: `.opencode/skills/antislop-ui/SKILL.md`
Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
To update antislop later: `npx antislop-ai --update`, or run `npx antislop-ai` and pick Overwrite them.
<!-- antislop:end -->
