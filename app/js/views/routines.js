/**
 * Reusable routine shortcuts shared by Home and the Workout tab.
 *
 * Each split has a recognisable colour and icon while using the existing
 * curated-library action. These are real editable sessions, not demo cards.
 */

import { esc, icon } from "../ui.js";

const ROUTINES = [
  { label: "Push", slug: "push", detail: "Chest · Shoulders · Triceps", muscles: ["chest", "shoulders", "triceps"], icon: "dumbbell" },
  { label: "Pull", slug: "pull", detail: "Back · Biceps", muscles: ["back", "biceps"], icon: "bolt" },
  { label: "Legs", slug: "legs", detail: "Quads · Hamstrings · Glutes", muscles: ["quads", "hamstrings", "glutes"], icon: "flame" },
  { label: "Full body", slug: "full-body", detail: "Four foundational movements", muscles: ["chest", "back", "quads", "shoulders"], icon: "user" },
];

export function renderRoutineCards() {
  return `<div class="routine-grid" data-reveal="rise">${ROUTINES.map((routine, index) => `
    <button class="routine-card routine-${routine.slug}" style="--routine-order:${index}" data-action="start-split" data-split="${esc(routine.label)}" data-muscles="${esc(routine.muscles.join(","))}" aria-label="Start ${esc(routine.label)} routine, ${routine.muscles.length} exercises">
      <span class="routine-icon">${icon(routine.icon)}</span>
      <span class="routine-copy">
        <strong>${esc(routine.label)}</strong>
        <small>${esc(routine.detail)}</small>
        <span class="routine-count">${routine.muscles.length} exercises</span>
      </span>
      <span class="routine-go">${icon("chevron")}</span>
      <span class="routine-shine" aria-hidden="true"></span>
    </button>`).join("")}</div>`;
}
