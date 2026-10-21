/**
 * IronLog — Stats view.
 *
 * Lifetime numbers, weekly volume chart, muscle-group distribution and the
 * personal-record board. All derived from the pure functions in stats.js.
 */

import {
  compactNumber,
  lifetimeStats,
  relativeTime,
  streaks,
  weeklyVolume,
} from "../stats.js";
import { barChart, distributionBars, emptyState, esc, icon, statTile } from "../ui.js";

export function renderStats(store) {
  const completed = store.completedWorkouts();

  if (completed.length === 0) {
    return `
      <section class="view view-stats">
        <header class="view-head">
          <div><p class="eyebrow">Progress</p><h1>Stats</h1></div>
        </header>
        ${emptyState({
          icon: "stats",
          title: "No data to chart yet",
          body: "Log a few sessions and your volume, personal records and muscle balance will build up here.",
        })}
      </section>`;
  }

  const index = store.exerciseIndex();
  const units = store.settings.units;
  const life = lifetimeStats(completed);
  const streak = streaks(completed);
  const weeks = weeklyVolume(completed).slice(-12);
  const records = store.personalRecords();

  return `
    <section class="view view-stats">
      <header class="view-head">
        <div><p class="eyebrow">Across ${life.workouts} sessions</p><h1>Progress</h1></div>
      </header>

      <div class="tile-grid tile-grid-4">
        ${statTile({ label: "Total volume", value: compactNumber(life.volume), unit: units, tone: "tone-accent" })}
        ${statTile({ label: "Total sets", value: compactNumber(life.sets) })}
        ${statTile({ label: "Time training", value: String(life.hours), unit: "h" })}
        ${statTile({ label: "Current streak", value: String(streak.current), unit: "d", hint: `best ${streak.best}d` })}
      </div>

      <section class="panel">
        <div class="panel-head"><h2>Weekly volume</h2><span class="panel-note">last ${weeks.length} weeks</span></div>
        ${barChart(
          weeks.map((w) => ({
            value: w.volume,
            label: `${w.week}: ${compactNumber(w.volume)} ${units} across ${w.workouts} sessions`,
            display: `${compactNumber(w.volume)} ${units}`,
            axis: w.week.replace(/^\d{4}-/, ""),
          })),
          { ariaLabel: "Weekly training volume" },
        )}
      </section>

      <section class="panel">
        <div class="panel-head"><h2>Muscle balance</h2><span class="panel-note">sets per group</span></div>
        ${distributionBars(muscleDistribution(completed, index))}
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>${icon("trophy")} Personal records</h2>
          <span class="panel-note">${records.size} tracked</span>
        </div>
        ${records.size === 0
          ? `<p class="panel-empty">Complete a set with weight to start recording personal bests.</p>`
          : `<ul class="pr-list">
               ${[...records.values()]
                 .sort((a, b) => b.maxOneRm - a.maxOneRm)
                 .slice(0, 25)
                 .map((r) => renderPrRow(r, units)).join("")}
             </ul>`}
      </section>
    </section>`;
}

function renderPrRow(record, units) {
  const latest = record.history[record.history.length - 1];
  return `
    <li class="pr-row">
      <span class="pr-name">
        ${esc(record.name)}
        ${latest?.date ? `<em>${esc(relativeTime(latest.date))}</em>` : ""}
      </span>
      <span class="pr-values">
        <span class="pr-value"><b>${record.maxWeight}</b><i>${esc(units)}</i><u>heaviest</u></span>
        <span class="pr-value"><b>${record.maxReps}</b><i>reps</i><u>most</u></span>
        <span class="pr-value pr-value-accent"><b>${compactNumber(record.maxOneRm)}</b><i>${esc(units)}</i><u>est. 1RM</u></span>
      </span>
    </li>`;
}

function muscleDistribution(workouts, index) {
  const counts = new Map();
  for (const w of workouts) {
    for (const entry of w.exercises ?? []) {
      const muscle = index[entry.exerciseId]?.muscle ?? "other";
      const done = (entry.sets ?? []).filter((s) => s.done).length;
      counts.set(muscle, (counts.get(muscle) ?? 0) + done);
    }
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value, display: `${value} sets` }))
    .sort((a, b) => b.value - a.value);
}
