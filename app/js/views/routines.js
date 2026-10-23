/**
 * Reusable routine shortcuts shared by Home and the Workout tab.
 *
 * These use the existing split action and curated exercise library, so every
 * card starts a real editable session rather than a decorative demo.
 */

import { esc, icon } from "../ui.js";

const ROUTINES = [
  { label: "Push", detail: "Chest · Shoulders · Triceps", muscles: ["chest", "shoulders", "triceps"] },
  { label: "Pull", detail: "Back · Biceps", muscles: ["back", "biceps"] },
  { label: "Legs", detail: "Quads · Hamstrings · Glutes", muscles: ["quads", "hamstrings", "glutes"] },
  { label: "Full body", detail: "Four foundational movements", muscles: ["chest", "back", "quads", "shoulders"] },
];

export function renderRoutineCards() {
  return `<div class="routine-grid">${ROUTINES.map((routine) => `
    <button class="routine-card" data-action="start-split" data-split="${esc(routine.label)}" data-muscles="${esc(routine.muscles.join(","))}">
      <span class="routine-icon">${icon("dumbbell")}</span>
      <span class="routine-copy"><strong>${esc(routine.label)}</strong><small>${esc(routine.detail)}</small></span>
      <span class="routine-go">${icon("chevron")}</span>
    </button>`).join("")}</div>`;
}
