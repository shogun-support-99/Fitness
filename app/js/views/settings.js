/**
 * IronLog — Settings view.
 *
 * Units, rest-timer defaults, theme, and local data management
 * (export / import / reset). Everything stays in the browser.
 */

import { EQUIPMENT } from "../exercises.js";
import { esc, icon } from "../ui.js";

const REST_PRESETS = [45, 60, 90, 120, 180, 240, 300];

export function renderSettings(store) {
  const s = store.settings;
  const workoutCount = store.doc.workouts.length;
  const customCount = store.doc.customExercises.length;
  const bytes = new Blob([JSON.stringify(store.doc)]).size;

  return `
    <section class="view view-settings">
      <header class="view-head">
        <div><p class="eyebrow">Preferences</p><h1>Settings</h1></div>
      </header>

      <section class="panel">
        <div class="panel-head"><h2>Units</h2></div>
        <div class="segmented" role="radiogroup" aria-label="Weight units">
          ${["kg", "lb"]
            .map(
              (u) => `
            <button role="radio" aria-checked="${s.units === u}"
                    class="segment ${s.units === u ? "is-active" : ""}"
                    data-action="set-units" data-units="${u}">${u}</button>`,
            )
            .join("")}
        </div>
        <p class="panel-hint">Applies to labels and new entries. Existing numbers are left as you typed them.</p>
      </section>

      <section class="panel">
        <div class="panel-head"><h2>${icon("timer")} Rest timer</h2></div>
        <div class="chip-row">
          ${REST_PRESETS.map(
            (secs) => `
            <button class="chip ${s.restSeconds === secs ? "is-active" : ""}"
                    data-action="set-rest" data-seconds="${secs}">${formatPreset(secs)}</button>`,
          ).join("")}
        </div>
        <label class="toggle-row">
          <input type="checkbox" ${s.autoStartRestTimer ? "checked" : ""} data-action="toggle-autorest" />
          <span>
            <strong>Start automatically</strong>
            <em>Begin the countdown as soon as you tick a set done.</em>
          </span>
        </label>
      </section>

      <section class="panel">
        <div class="panel-head"><h2>Your data</h2></div>
        <dl class="fact-list">
          <div><dt>Workouts stored</dt><dd>${workoutCount}</dd></div>
          <div><dt>Custom exercises</dt><dd>${customCount}</dd></div>
          <div><dt>Storage used</dt><dd>${formatBytes(bytes)}</dd></div>
          <div><dt>Where it lives</dt><dd>this browser only</dd></div>
        </dl>
        <p class="panel-hint">
          IronLog has no account system and no server. Everything you log stays in this
          browser's local storage, so it is private by default — and it disappears if you
          clear site data. Export a backup if your training log matters to you.
        </p>
        <div class="settings-actions">
          <button class="btn btn-outline" data-action="export-data">${icon("download")} Export JSON</button>
          <label class="btn btn-outline">
            ${icon("upload")} Import JSON
            <input type="file" accept="application/json,.json" data-action="import-file" hidden />
          </label>
          <button class="btn btn-danger-ghost" data-action="reset-data">${icon("trash")} Erase all data</button>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head"><h2>About</h2></div>
        <p class="panel-hint">
          IronLog is an offline-first strength training log: exercises, sets, volume,
          rest timing and personal records. Built as a static app with no build step and
          no tracking.
        </p>
        <a class="link" href="../" data-action="to-landing">Project landing page ${icon("chevron")}</a>
      </section>
    </section>`;
}

function formatPreset(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = seconds / 60;
  return Number.isInteger(m) ? `${m} min` : `${m.toFixed(1)} min`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
