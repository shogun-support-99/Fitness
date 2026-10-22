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
│   ├── js/landing.js          # Scroll reveal, counters, mock clock
│   └── img/                   # Logo and OG cover (inline SVG, no CDN)
├── app/                       # The application
│   ├── index.html             # App shell: sidebar, tab bar, outlet
│   ├── manifest.json          # PWA manifest
│   ├── css/app.css            # App design system
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

The interface is built as one world rather than a set of screens: **IronLog is a ledger**.
The page is the object, so the landing page is a training log sheet — stone paper on a
bench-lit ground, ruled columns, figures set in mono — and the app is that same sheet
filled in.

| | |
| --- | --- |
| Style | "Achromatic ledger" — no brand colour in the chrome |
| Ground | stone `#f4f3f1` on paper white; true neutral darks for the dark theme |
| Ink | `#0a0a0a`, with grey for comparisons and secondary figures |
| The one hue | `#1d5fbf`, on the data that matters — this session's series, the record that broke |
| Colour budget | under ~3% of pixels; colour goes on data, never on chrome |
| Type | Geist for text, **Geist Mono for every figure**, so weights and reps read as ledger columns |
| Geometry | radii 8 and 6, one gap value, one button shape, row height 44 |
| Elevation | declared once — a border or a shadow, never both. Nothing at rest carries a shadow; only sheets, menus and toasts float |

Deliberate absences: no gradient on a ground, button or card; no glow, glass or backdrop
blur; no icon in a tinted circle on a metric; no sparkline on a KPI; no eyebrow or kicker
above a heading; no emoji standing in for an icon; no zebra striping or uppercase tracked
table headers. Muscle badges are one quiet neutral tint rather than a rainbow, because a
hue per muscle would put colour on the frame instead of the data.

Browser surfaces are themed from the palette rather than left at their defaults: text
selection, the caret, scrollbars, focus rings, underline offset and tabular numerals.
There is a print stylesheet, because a log is a thing people print.

Both faces are **self-hosted** from `fonts/` under the SIL Open Font License, so the site
makes no request to any third party — including for its type. See [`NOTICE`](./NOTICE).

The app ships three appearances: light (the crafted default), dark (true neutral greys,
not navy or slate), and match-system.

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
