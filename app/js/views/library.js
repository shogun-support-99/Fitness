/**
 * IronLog — Exercise library view.
 *
 * Browsable, searchable catalogue plus custom-exercise creation.
 */

import { MUSCLE_GROUPS, EQUIPMENT, searchExercises } from "../exercises.js";
import { emptyState, esc, icon, muscleBadge } from "../ui.js";

export function renderLibrary(store, { query = "", muscle = "all" } = {}) {
  const all = store.exercises();
  const results = searchExercises(all, query, muscle);
  const customCount = store.doc.customExercises.length;

  return `
    <section class="view view-library">
      <header class="view-head">
        <div>
          <p class="eyebrow">${all.length} exercises${customCount ? ` · ${customCount} custom` : ""}</p>
          <h1>Library</h1>
        </div>
        <button class="btn btn-primary" data-action="open-custom-exercise">${icon("plus")} New</button>
      </header>

      <div class="search-bar">
        ${icon("search")}
        <input type="search" id="library-search" placeholder="Search by name, muscle or equipment…"
               value="${esc(query)}" autocomplete="off" data-action="library-search" />
        ${query ? `<button class="icon-btn" data-action="clear-search" aria-label="Clear search">${icon("back")}</button>` : ""}
      </div>

      <div class="chip-row chip-scroll" id="library-muscles">
        <button class="chip ${muscle === "all" ? "is-active" : ""}" data-action="filter-muscle" data-muscle="all">All</button>
        ${MUSCLE_GROUPS.map(
          (m) => `<button class="chip ${muscle === m ? "is-active" : ""}" data-action="filter-muscle" data-muscle="${esc(m)}">${esc(m)}</button>`,
        ).join("")}
      </div>

      ${results.length === 0
        ? emptyState({
            icon: "search",
            title: "No matches",
            body: `Nothing in the library matches "${query}". Try a different term, or create it as a custom exercise.`,
            action: `<button class="btn btn-outline" data-action="open-custom-exercise">${icon("plus")} Create "${esc(query)}"</button>`,
          })
        : `<ul class="library-list">${results.map((e) => renderLibraryRow(e)).join("")}</ul>`}
    </section>

    ${renderCustomSheet()}
  `;
}

function renderLibraryRow(exercise) {
  return `
    <li class="library-row">
      <div class="library-main">
        <span class="library-name">
          ${esc(exercise.name)}
          ${exercise.custom ? `<em class="pill pill-custom">custom</em>` : ""}
        </span>
        <span class="library-meta">
          ${muscleBadge(exercise.muscle)}
          <span class="equip">${esc(exercise.equipment)}</span>
          ${exercise.note ? `<span class="note">${icon("info")} ${esc(exercise.note)}</span>` : ""}
        </span>
      </div>
      ${exercise.custom
        ? `<button class="icon-btn" data-action="delete-custom" data-id="${esc(exercise.id)}" aria-label="Delete ${esc(exercise.name)}">${icon("trash")}</button>`
        : ""}
    </li>`;
}

function renderCustomSheet() {
  return `
    <div class="sheet" id="custom-exercise-sheet" hidden>
      <div class="sheet-backdrop" data-action="close-custom-exercise"></div>
      <div class="sheet-panel sheet-panel-sm" role="dialog" aria-modal="true" aria-label="Create custom exercise">
        <header class="sheet-head">
          <h2>Custom exercise</h2>
          <button class="icon-btn" data-action="close-custom-exercise" aria-label="Close">${icon("back")}</button>
        </header>
        <form class="sheet-form" data-action="submit-custom-exercise">
          <label class="field">
            <span>Name</span>
            <input name="name" required maxlength="60" placeholder="e.g. Landmine Press" autocomplete="off" />
          </label>
          <label class="field">
            <span>Muscle group</span>
            <select name="muscle">
              ${MUSCLE_GROUPS.map((m) => `<option value="${esc(m)}">${esc(m)}</option>`).join("")}
              <option value="other">other</option>
            </select>
          </label>
          <label class="field">
            <span>Equipment</span>
            <select name="equipment">
              ${EQUIPMENT.map((e) => `<option value="${esc(e)}">${esc(e)}</option>`).join("")}
            </select>
          </label>
          <label class="field">
            <span>Note <em>(optional)</em></span>
            <input name="note" maxlength="80" placeholder="e.g. Log minutes as reps" autocomplete="off" />
          </label>
          <p class="form-error" data-role="custom-error" hidden></p>
          <button class="btn btn-primary btn-wide" type="submit">${icon("save")} Save exercise</button>
        </form>
      </div>
    </div>`;
}
