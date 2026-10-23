<div align="center">

<img src="./assets/img/logo.svg" alt="IronLog" width="88" height="88" />

# IronLog

### The strength training log that respects your data.

**Log the set. Own the numbers.**

[**Open the app**](https://shogun-support-99.github.io/fitness/app/) · [**Landing page**](https://shogun-support-99.github.io/fitness/)

Free · No account · No server · Works offline · MIT licensed

</div>

---

## Live links

| | URL |
| --- | --- |
| 🏠 **Landing page** | https://shogun-support-99.github.io/fitness/ |
| 🏋️ **The app** | https://shogun-support-99.github.io/fitness/app/ |

Both are served from this repository by GitHub Pages. **Every push to `main` redeploys
automatically** — see [Deployment](#deployment).

## What it is

IronLog is a workout journal for strength training. It records what you lifted, how many
reps you got, how long you rested, and whether you beat your previous best — then turns
that into volume trends and personal records you can actually read.

It is a static web app with **no backend**. There is no account system, no database and
no analytics script, because there is no server to have them on. Your training history
lives in your browser's local storage, and you can export all of it as JSON at any time.

## Features

- **Fast set logging** — weight and reps per set, ticked as you go, with your previous
  performance shown beside each field so you never have to recall last week's numbers.
- **Live estimated 1RM** — Epley formula, recalculated as you type.
- **Rest timer** — starts automatically when you complete a set, or on demand. Add 15
  seconds mid-count, and it survives a page reload.
- **Personal records** — three independent records per exercise: heaviest weight, most
  reps, and highest estimated 1RM. The session summary names exactly which you broke.
- **Progress views** — weekly volume bars, muscle-group balance, lifetime totals, and a
  training-day streak. Charts are inline SVG, so no charting library loads.
- **Exercise library** — **1,388 exercises**: around 90 curated staples plus a 1,316-entry
  open catalogue, searchable as you type with relevance ranking, grouped by muscle and
  equipment. Custom exercises persist alongside them.
- **Step-by-step instructions in 10 languages** — every catalogue exercise carries numbered
  form cues in English, Spanish, French, Italian, Polish, Russian, Turkish, Chinese, Hindi
  and Korean. Switch language in Settings; each pack downloads only when you first open an
  exercise in it.
- **Exercise detail** — target muscle, secondary muscles, body part and equipment, plus the
  instructions above, in a sheet that opens from anywhere in the library.
- **Session templates** — repeat your last workout with its sets and weights prefilled,
  or start from a Push / Pull / Legs split.
- **Export, import, erase** — your whole history is one JSON document.

## Try it

Open **[the app](https://shogun-support-99.github.io/fitness/app/)** and:

1. Tap **Start empty workout** (or pick a split).
2. Add an exercise — search "bench", pick **Barbell Bench Press**.
3. Enter `80` and `8`, tick the set. The rest timer starts and the 1RM appears.
4. Add a couple more sets, then **Finish workout** to see the summary.
5. Open **Progress** to see the records and weekly volume.

Everything is written to local storage immediately, so a closed tab never costs a session.

## Running it locally

There is no build step and no dependency to install. Serve the repository root with any
static file server:

```bash
git clone https://github.com/shogun-support-99/fitness.git
cd fitness
python3 -m http.server 8080
```

Then open http://localhost:8080/ for the landing page and http://localhost:8080/app/ for
the app. Relative paths are used throughout, so the site works from any base path.

## Tests

The training maths, persistence layer, rest timer, exercise library, router and HTML
escaping are unit-tested in Node using the built-in test runner — no test framework to
install:

```bash
node --test "tests/*.test.js"
```

```
# tests 228
# suites 54
# pass 228
# fail 0
```

The tests cover the behaviour that is easy to get subtly wrong: Epley rounding without
binary-float drift, personal records ignoring unticked and incomplete sessions, streak
logic across missed days, ISO week bucketing, corrupt-payload recovery, storage quota
failure, and timer completion semantics.

## Project layout

```
.
├── index.html                 # Landing page
├── assets/
│   ├── css/landing.css        # Landing design system
│   ├── js/landing.js          # Native scroll scenes, counters, live sample/rest
│   └── img/                   # Logo and OG cover (inline SVG, no CDN)
├── app/                       # The application
│   ├── index.html             # App shell: sidebar, workspace top bar, outlet
│   ├── manifest.json          # PWA manifest
│   ├── css/app.css            # Working component and motion primitives
│   ├── css/kinetic.css        # True-black / cobalt visual layer and shell geometry
│   ├── data/                  # Generated exercise catalogue (see below)
│   │   ├── exercises-index.json   # 313 KB metadata for 1,316 exercises
│   │   ├── steps.<lang>.json      # instructions per language, lazy-loaded
│   │   └── catalogue-meta.json    # provenance, counts, licensing record
│   └── js/
│       ├── main.js            # Bootstrap, render loop, event delegation
│       ├── store.js           # Persistence (injected storage)
│       ├── stats.js           # Pure training maths
│       ├── timer.js           # Rest timer (injected clock)
│       ├── exercises.js       # Curated starter library + search ranking
│       ├── catalogue.js       # External catalogue: fetch, merge, instructions
│       ├── router.js          # Hash router
│       ├── ui.js              # Escaping, icons, chart primitives
│       └── views/             # home, workout, history, stats, library, settings
├── scripts/
│   ├── build-exercise-data.mjs    # Regenerates app/data/ from the upstream dataset
│   ├── check-links.mjs            # CI check: every local link resolves
│   └── setup-github.sh            # One-shot repo/profile makeover
├── fonts/                     # Self-hosted Geist + Geist Mono (SIL OFL) and their licence
├── app/media/                 # Empty by design: slot for media YOU hold rights to
├── NOTICE                     # Third-party attribution: data, media exclusion, type
├── tests/                     # Node test-runner suites
└── .github/workflows/deploy.yml
```

## Exercise catalogue

The library combines two sources:

| Source | Count | Ships as |
| --- | --- | --- |
| Curated starter library | 90 | inline in `app/js/exercises.js` |
| [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) | 1,316 | generated JSON in `app/data/` |
| **Merged** | **1,388** | 18 name collisions resolved in favour of the curated entry |

The catalogue is fetched after first paint rather than imported, so the 313 KB index never
blocks the app, and a failed fetch leaves the curated library fully working. Instruction
text is split into one file per language and loaded only when you open an exercise in that
language — a monolingual user downloads about 600 KB, not all ten packs. When a curated
staple collides with a catalogue entry, it keeps its own stable id (so saved workouts still
resolve) but is linked to the catalogue record's instructions via `stepsId`.

### Regenerating

```bash
git clone https://github.com/hasaneyldrm/exercises-dataset.git
node scripts/build-exercise-data.mjs                       # or --source /path/to/dataset
```

The generator maps the upstream taxonomy onto IronLog's muscle groups, dedupes by
normalised name, writes the index plus one pack per language, and records the upstream
commit in `catalogue-meta.json`.

### Licensing — data yes, media no

The upstream repository is dual-licensed, and this project takes that seriously:

- **Data — MIT, © 2026 Hasan Emir Yıldırım.** Exercise names, taxonomy and instruction
  text with translations. Used under that licence, with the copyright notice retained in
  `NOTICE`, in `app/data/catalogue-meta.json`, and surfaced to users in Settings and on
  every catalogue exercise.
- **Media — © Gym Visual, NOT licensed.** The upstream `images/` and `videos/` are excluded
  from its MIT grant; the upstream `LICENSE` states that cloning grants no media licence and
  that you must obtain your own from Gym Visual.

IronLog therefore ships **no** third-party media. The generator strips `image`, `gif_url`,
`media_id` and `attribution` from every record and fails closed if any media reference
appears in its output. Two independent guards keep it that way: the
`tests/catalogue.test.js` licensing suite, and a CI step that scans the committed tree for
media references and binary assets before deploy. No exercise displays an image, GIF or
video — they are presented as text plus taxonomy.

See [`NOTICE`](./NOTICE) for the full third-party notice.

## Design

The two surfaces share one training-data language without using the same composition.
The landing page is **sentence-as-layout / Cobalt Field**: split type around real product
frames on a saturated cobalt field. The app is **true-black-flat**: labelled navigation,
a real workspace top bar, lightness-only elevation and inverted primary controls.

| | |
| --- | --- |
| Landing ground | cobalt `#0034eb`, with deep-blue `#002fd6` product surfaces |
| App grounds | true black `#000000` by default; cool white `#f4f6fb` in light mode |
| Action | yellow `#e9e34a` on the landing; white-on-black / black-on-white primary controls in the app |
| Data | cobalt on training figures and charts, never on navigation or primary button fills |
| Record signal | a small yellow PR/status accent, not confetti or a second chrome colour |
| Type | self-hosted Geist; Geist Mono for measurements, timers and updating figures |
| Geometry | 4px landing frames; 16px app cards, 12px fields and pill-shaped app controls |
| Elevation | declared once — a border or a shadow, never both. Only sheets, menus and toasts float |

Deliberate absences: no gradient on a ground, button or card; no glow, glass or backdrop
blur; no icon in a tinted circle on a metric; no sparkline on a KPI; no eyebrow or kicker
above an app heading; no emoji standing in for an icon; no zebra striping or uppercase
tracked table headers. Muscle badges stay neutral because a hue per muscle would put
colour on the frame instead of the data. Landing imagery is the working interface plus
original SVG movement diagrams, not unlicensed exercise photography.

Browser surfaces are themed from the palette rather than left at their defaults: text
selection, the caret, scrollbars, focus rings, underline offset and tabular numerals.
There is a print stylesheet, because a log is a thing people print.

Both faces are **self-hosted** from `fonts/` under the SIL Open Font License, so the site
makes no request to any third party — including for its type. See [`NOTICE`](./NOTICE).

The app ships three appearances: **dark (the crafted default)**, light, and match-system.
An existing browser's saved preference is respected and applied before first paint.

## Motion

Animation is authored around the product's central ritual: **a completed set connects
logging, rest, records and progress**. The landing page has two native-scroll scenes:
a three-frame set/rest/progress reel and a single session interface inspected at three
distances. Their transform origins are solved from the rendered timer and record values,
so the zoom lands on the actual data at every viewport. A quiet reading section separates
the two held scenes.

| Element | Motion |
| --- | --- |
| Landing hero | native scroll scrubs three working product frames; completing the sample advances to rest |
| Landing showcase | pans and scales from the session to its timer, then to its estimated-1RM record |
| Interface controls | shutter/clip reveals, short press feedback and visible focus |
| A chart bar | grows from the baseline, staggered |
| A personal record | **stamped** — overshoot and rotation, with bounded linework |
| SVG linework | draws itself via `stroke-dashoffset` |
| A figure | rolls with tabular numerals and thousands separators intact |
| The rest timer | real countdown state with a draining progress rule and final-fifth warning |
| A completed set | the tick draws its own check |
| App navigation | one active line travels between destinations; route changes are short and never replay on input updates |

The hero sample is functional, not a mock clock: editing weight/reps recomputes volume and
the Epley estimate, and completing the set starts an actual 90-second countdown. The
85 kg × 6 reps example therefore produces 510 kg of volume and a 102 kg estimated 1RM.

Three rules hold everywhere:

1. **Content has a readable default and a finished state.** No script, a failed module or
   reduced motion never leaves a blank stage or hides the product behind an entrance.
2. **Large scene motion stays compositor-friendly.** Scroll work uses one
   `requestAnimationFrame` pass and native scrolling; transforms, opacity, clip paths and
   SVG strokes do the visual work. Countdown progress updates at clock frequency.
3. **`prefers-reduced-motion` removes non-essential motion and leaves the final state.**
   Loops stop outright, scene content becomes a normal readable composition, and useful
   state changes remain visible.

`app/js/motion.js` declines to start observers and loops under reduced motion, and
disconnects every observer before a re-render so a session left open for an hour does not
accumulate leaks on detached nodes. There is no animation runtime or third-party script.

## Exercise visuals, and why there are no GIFs

The upstream dataset ships 180×180 animation GIFs, but its licence carries a
**MEDIA EXCEPTION** removing them from the MIT grant: they are © Gym Visual,
included with the rights holder's written permission, and *"cloning this
repository does not grant you any license to the media."* IronLog therefore ships
none of them. They are also 138 MB against an application that is under 1 MB.

`app/js/diagrams.js` draws originals instead, from the dataset's own
MIT-licensed fields:

- **Movement diagram** — a lever, an arc, a travel path and a force vector. Ten
  movement classes (press, pull, hinge, squat, curl, extend, core, carry, cardio,
  generic) are derived from `category`, `muscle`, `muscleGroup`, `target`,
  `equipment` and `name`, and the load is drawn to match the equipment: plates on
  a barbell, heads on a dumbbell, a handle on a kettlebell. The load rides the
  same path the travel line draws, so the two can never disagree.
- **Muscle graph** — the primary muscle at the centre, secondaries ranged on an
  ellipse, joined by linework that draws in one after another.

Neither is a picture of a person. That is deliberate: figure-bearing illustration
reads as amateur, while crisp vector geometry and animated linework are
first-class media — and geometry is also themeable, resolution-independent and a
few hundred bytes. Across all 1,388 exercises, 99.4% classify into a specific
movement and 0.6% fall back to the neutral diagram.

If you hold rights to media you want to show, `app/media/README.md` explains the
slot that accepts it, with the required attribution already wired.

## Architecture notes

- **No build step.** Plain ES modules loaded by the browser. Nothing to compile, bundle
  or version, so deployment cannot fail on a toolchain change.
- **No runtime dependencies.** No framework, no charting library, no icon font, no
  webfont. The only requests a page makes are for its own files.
- **Views are pure functions of state.** Each view returns an HTML string from the store;
  behaviour is wired once through a delegated listener keyed on `data-action`. That makes
  re-rendering cheap and the flow easy to follow.
- **Testable seams.** `store.js` takes an injected `Storage` and `timer.js` takes an
  injected clock, so both run in Node against fakes instead of a browser.
- **Escape by default.** All user-supplied text passes through `esc()` before reaching
  `innerHTML`; there is a test asserting a stored-XSS payload is neutralised.
- **Relative URLs everywhere.** The app works at `/`, at `/fitness/`, or from a local
  server without any base-path configuration.

## Deployment

Pushes to `main` deploy automatically via GitHub Actions:

1. **`test`** — runs the unit tests, checks every JS module parses, and verifies all local
   links resolve.
2. **`deploy`** — only on `main`, and only after `test` passes. Uploads the repository to
   GitHub Pages and publishes it.

There is nothing to do manually. Commit to `main` and the site updates itself within a
minute or two. Pull requests run the `test` job without deploying, so a broken change is
caught before it can reach production.

Pages is configured with **Source: GitHub Actions** on this repository. Run history:
[Actions](https://github.com/shogun-support-99/fitness/actions).

## Privacy

No data leaves the device. There is no backend, no analytics, no cookies and no
third-party asset. Workouts are stored under a single versioned local storage key and can
be exported or erased from the app's settings screen.

The trade-off is worth stating plainly: because storage is per-browser and per-origin,
clearing site data removes your log, and it does not sync between devices. Export a backup
if your history matters to you.

## License

MIT — see [LICENSE](./LICENSE).

The exercise catalogue data and instruction text come from
[hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset), also MIT
licensed (© 2026 Hasan Emir Yıldırım), and are attributed in [`NOTICE`](./NOTICE) and in the
app itself. That project's exercise media is © Gym Visual and is **not** covered by its MIT
grant, so none of it is redistributed here — see
[Exercise catalogue](#licensing--data-yes-media-no).

This is an independent project. It is not affiliated with, endorsed by, or derived from
any other fitness product.
