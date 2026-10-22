/**
 * IronLog — Home view.
 *
 * Landing surface for the app: resume or start a session, today's headline
 * numbers, and the most recent workouts.
 */

import { compactNumber, relativeTime, streaks, workoutDurationMinutes, workoutSetCount, workoutVolume } from "../stats.js";
import { emptyState, esc, icon, muscleBadge, statTile } from "../ui.js";

export function renderHome(store) {
  const active = store.activeWorkout();
  const completed = store.completedWorkouts();
  const streak = streaks(completed);
  const recent = completed.slice(0, 4);
  const index = store.exerciseIndex();

  const lastSevenDays = completed.filter((w) => {
    const days = (Date.now() - new Date(w.endedAt ?? w.startedAt).getTime()) / 86_400_000;
    return days <= 7;
  });
  const weekVolume = lastSevenDays.reduce((sum, w) => sum + workoutVolume(w), 0);

  return `
    <section class="view view-home">
      <header class="view-head">
        <div>
          <p class="eyebrow">${esc(homeSubline(streak, completed))}</p>
          <h1>Today</h1>
        </div>
      </header>

      ${active ? renderActiveBanner(active, index) : renderStartPanel(store, completed)}

      <div class="tile-grid">
        ${statTile({ label: "This week", value: compactNumber(weekVolume), unit: "kg", hint: `${lastSevenDays.length} session${lastSevenDays.length === 1 ? "" : "s"}` })}
        ${statTile({ label: "Workouts", value: String(completed.length), hint: "all time" })}
        ${statTile({ label: "Best streak", value: `${streak.best}`, unit: "d", hint: `${streak.activeDays} active days` })}
      </div>

      <section class="panel">
        <div class="panel-head">
          <h2>Recent sessions</h2>
          ${completed.length > 0 ? `<a class="link" href="#/history">View all ${icon("chevron")}</a>` : ""}
        </div>
        ${
          recent.length === 0
            ? emptyState({
                icon: "dumbbell",
                title: "No sessions logged yet",
                body: "Start your first workout and IronLog will track every set, weight and personal record from here on.",
              })
            : `<ul class="session-list">${recent.map((w) => renderSessionRow(w, index)).join("")}</ul>`
        }
      </section>
    </section>`;
}

function renderActiveBanner(workout, index) {
  const sets = workoutSetCount(workout);
  const volume = workoutVolume(workout);
  const elapsed = Date.now() - new Date(workout.startedAt).getTime();
  return `
    <div class="active-banner" role="status">
      <div class="active-banner-text">
        <span class="pill pill-live"><span class="dot"></span>In progress</span>
        <h2>${esc(workout.name)}</h2>
        <p>${workout.exercises.length} exercise${workout.exercises.length === 1 ? "" : "s"} · ${sets} set${sets === 1 ? "" : "s"} · ${compactNumber(volume)} kg · ${Math.max(1, Math.round(elapsed / 60000))} min</p>
      </div>
      <a class="btn btn-primary btn-lg" href="#/workout" data-action="resume-workout">
        ${icon("play")} Resume
      </a>
    </div>`;
}

function renderStartPanel(store, completed) {
  const template = store.lastWorkoutTemplate();
  const quickStarts = [
    { label: "Push", muscles: ["chest", "shoulders", "triceps"] },
    { label: "Pull", muscles: ["back", "biceps"] },
    { label: "Legs", muscles: ["quads", "hamstrings", "glutes"] },
    { label: "Full body", muscles: [] },
  ];

  return `
    <div class="start-panel">
      <button class="btn btn-primary btn-xl" data-action="start-workout">
        ${icon("bolt")} Start empty workout
      </button>

      ${
        template
          ? `<button class="btn btn-ghost btn-wide" data-action="repeat-last">
               ${icon("history")} Repeat last session
               <span class="btn-sub">${esc(template.exercises.length)} exercises</span>
             </button>`
          : ""
      }

      <div class="quick-starts">
        <p class="group-label">Or start from a split</p>
        <div class="chip-row">
          ${quickStarts
            .map(
              (q) =>
                `<button class="chip" data-action="start-split" data-split="${esc(q.label)}" data-muscles="${esc(q.muscles.join(","))}">${esc(q.label)}</button>`,
            )
            .join("")}
        </div>
      </div>
    </div>`;
}

function renderSessionRow(workout, index) {
  const when = relativeTime(workout.endedAt ?? workout.startedAt);
  const summary = workout.summary ?? {
    volume: Math.round(workoutVolume(workout)),
    sets: workoutSetCount(workout),
    minutes: workoutDurationMinutes(workout),
  };
  const muscles = [...new Set(workout.exercises.map((e) => index[e.exerciseId]?.muscle).filter(Boolean))];
  const prCount = summary.records?.length ?? 0;

  return `
    <li>
      <a class="session-row" href="#/history?id=${esc(workout.id)}">
        <span class="session-date">
          <strong>${esc(formatDay(workout.endedAt ?? workout.startedAt))}</strong>
          <span>${esc(when)}</span>
        </span>
        <span class="session-body">
          <span class="session-name">${esc(workout.name)}</span>
          <span class="session-meta">
            ${summary.sets} sets · ${compactNumber(summary.volume)} kg · ${summary.minutes} min
            ${prCount > 0 ? `<span class="pr-flag">${icon("trophy")} ${prCount} PR${prCount === 1 ? "" : "s"}</span>` : ""}
          </span>
          <span class="badge-row">${muscles.slice(0, 4).map((m) => muscleBadge(m)).join("")}</span>
        </span>
        <span class="session-go">${icon("chevron")}</span>
      </a>
    </li>`;
}

function formatDay(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * The line under the title: the day, then where the training stands, in the
 * words a lifter would use. streaks() returns only current/best/activeDays, so
 * the gap since the last session is computed here from the log itself.
 */
function homeSubline(streak, completed, date = new Date()) {
  const day = date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  if (streak.current > 0) return `${day} · ${streak.current}-day streak`;
  if (completed.length === 0) return `${day} · nothing logged yet`;

  const last = new Date(completed[0].endedAt ?? completed[0].startedAt);
  const days = Math.max(0, Math.round((startOfDay(date) - startOfDay(last)) / 86_400_000));
  const gap = days === 0 ? "trained today" : days === 1 ? "trained yesterday" : `last session ${days} days ago`;
  return `${day} · ${gap}`;
}

function startOfDay(d) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}
