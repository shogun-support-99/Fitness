/**
 * IronLog — built-in exercise library.
 *
 * Generic strength-training movements organised by primary muscle group and
 * equipment. Users can add their own; custom entries are merged at runtime by
 * the store, never by editing this file.
 */

export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "core",
  "cardio",
];

export const EQUIPMENT = [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "kettlebell",
  "bodyweight",
  "band",
  "other",
];

/**
 * @typedef {object} Exercise
 * @property {string} id
 * @property {string} name
 * @property {string} muscle
 * @property {string} equipment
 * @property {boolean} [barbell] true when weight is a barbell load (plate maths)
 * @property {string} [note]
 */

/** @type {Exercise[]} */
export const EXERCISES = [
  // ── Chest ────────────────────────────────────────────────────────────────
  { id: "bench-press", name: "Bench Press", muscle: "chest", equipment: "barbell", barbell: true },
  { id: "incline-bench-press", name: "Incline Bench Press", muscle: "chest", equipment: "barbell", barbell: true },
  { id: "decline-bench-press", name: "Decline Bench Press", muscle: "chest", equipment: "barbell", barbell: true },
  { id: "db-bench-press", name: "Dumbbell Bench Press", muscle: "chest", equipment: "dumbbell" },
  { id: "db-incline-press", name: "Dumbbell Incline Press", muscle: "chest", equipment: "dumbbell" },
  { id: "db-fly", name: "Dumbbell Fly", muscle: "chest", equipment: "dumbbell" },
  { id: "cable-crossover", name: "Cable Crossover", muscle: "chest", equipment: "cable" },
  { id: "pec-deck", name: "Pec Deck", muscle: "chest", equipment: "machine" },
  { id: "push-up", name: "Push-Up", muscle: "chest", equipment: "bodyweight" },
  { id: "dip-chest", name: "Chest Dip", muscle: "chest", equipment: "bodyweight" },

  // ── Back ─────────────────────────────────────────────────────────────────
  { id: "deadlift", name: "Deadlift", muscle: "back", equipment: "barbell", barbell: true },
  { id: "rack-pull", name: "Rack Pull", muscle: "back", equipment: "barbell", barbell: true },
  { id: "bent-over-row", name: "Bent-Over Row", muscle: "back", equipment: "barbell", barbell: true },
  { id: "t-bar-row", name: "T-Bar Row", muscle: "back", equipment: "barbell" },
  { id: "db-row", name: "Dumbbell Row", muscle: "back", equipment: "dumbbell" },
  { id: "pull-up", name: "Pull-Up", muscle: "back", equipment: "bodyweight" },
  { id: "chin-up", name: "Chin-Up", muscle: "back", equipment: "bodyweight" },
  { id: "lat-pulldown", name: "Lat Pulldown", muscle: "back", equipment: "cable" },
  { id: "seated-cable-row", name: "Seated Cable Row", muscle: "back", equipment: "cable" },
  { id: "chest-supported-row", name: "Chest-Supported Row", muscle: "back", equipment: "machine" },
  { id: "straight-arm-pulldown", name: "Straight-Arm Pulldown", muscle: "back", equipment: "cable" },
  { id: "back-extension", name: "Back Extension", muscle: "back", equipment: "bodyweight" },

  // ── Shoulders ────────────────────────────────────────────────────────────
  { id: "overhead-press", name: "Overhead Press", muscle: "shoulders", equipment: "barbell", barbell: true },
  { id: "push-press", name: "Push Press", muscle: "shoulders", equipment: "barbell", barbell: true },
  { id: "db-shoulder-press", name: "Dumbbell Shoulder Press", muscle: "shoulders", equipment: "dumbbell" },
  { id: "arnold-press", name: "Arnold Press", muscle: "shoulders", equipment: "dumbbell" },
  { id: "lateral-raise", name: "Lateral Raise", muscle: "shoulders", equipment: "dumbbell" },
  { id: "cable-lateral-raise", name: "Cable Lateral Raise", muscle: "shoulders", equipment: "cable" },
  { id: "front-raise", name: "Front Raise", muscle: "shoulders", equipment: "dumbbell" },
  { id: "reverse-fly", name: "Reverse Fly", muscle: "shoulders", equipment: "dumbbell" },
  { id: "face-pull", name: "Face Pull", muscle: "shoulders", equipment: "cable" },
  { id: "upright-row", name: "Upright Row", muscle: "shoulders", equipment: "barbell" },
  { id: "shrug", name: "Shrug", muscle: "shoulders", equipment: "dumbbell" },

  // ── Biceps ───────────────────────────────────────────────────────────────
  { id: "barbell-curl", name: "Barbell Curl", muscle: "biceps", equipment: "barbell" },
  { id: "db-curl", name: "Dumbbell Curl", muscle: "biceps", equipment: "dumbbell" },
  { id: "hammer-curl", name: "Hammer Curl", muscle: "biceps", equipment: "dumbbell" },
  { id: "incline-db-curl", name: "Incline Dumbbell Curl", muscle: "biceps", equipment: "dumbbell" },
  { id: "preacher-curl", name: "Preacher Curl", muscle: "biceps", equipment: "machine" },
  { id: "cable-curl", name: "Cable Curl", muscle: "biceps", equipment: "cable" },
  { id: "concentration-curl", name: "Concentration Curl", muscle: "biceps", equipment: "dumbbell" },

  // ── Triceps ──────────────────────────────────────────────────────────────
  { id: "close-grip-bench", name: "Close-Grip Bench Press", muscle: "triceps", equipment: "barbell", barbell: true },
  { id: "skull-crusher", name: "Skull Crusher", muscle: "triceps", equipment: "barbell" },
  { id: "tricep-pushdown", name: "Tricep Pushdown", muscle: "triceps", equipment: "cable" },
  { id: "overhead-tricep-ext", name: "Overhead Tricep Extension", muscle: "triceps", equipment: "cable" },
  { id: "dip-triceps", name: "Tricep Dip", muscle: "triceps", equipment: "bodyweight" },
  { id: "kickback", name: "Tricep Kickback", muscle: "triceps", equipment: "dumbbell" },
  { id: "jm-press", name: "JM Press", muscle: "triceps", equipment: "barbell" },

  // ── Forearms ─────────────────────────────────────────────────────────────
  { id: "wrist-curl", name: "Wrist Curl", muscle: "forearms", equipment: "dumbbell" },
  { id: "reverse-wrist-curl", name: "Reverse Wrist Curl", muscle: "forearms", equipment: "dumbbell" },
  { id: "farmers-carry", name: "Farmer's Carry", muscle: "forearms", equipment: "dumbbell" },

  // ── Quads ────────────────────────────────────────────────────────────────
  { id: "back-squat", name: "Back Squat", muscle: "quads", equipment: "barbell", barbell: true },
  { id: "front-squat", name: "Front Squat", muscle: "quads", equipment: "barbell", barbell: true },
  { id: "goblet-squat", name: "Goblet Squat", muscle: "quads", equipment: "kettlebell" },
  { id: "leg-press", name: "Leg Press", muscle: "quads", equipment: "machine" },
  { id: "hack-squat", name: "Hack Squat", muscle: "quads", equipment: "machine" },
  { id: "leg-extension", name: "Leg Extension", muscle: "quads", equipment: "machine" },
  { id: "bulgarian-split-squat", name: "Bulgarian Split Squat", muscle: "quads", equipment: "dumbbell" },
  { id: "lunge", name: "Lunge", muscle: "quads", equipment: "dumbbell" },
  { id: "step-up", name: "Step-Up", muscle: "quads", equipment: "dumbbell" },
  { id: "sissy-squat", name: "Sissy Squat", muscle: "quads", equipment: "bodyweight" },
  { id: "wall-sit", name: "Wall Sit", muscle: "quads", equipment: "bodyweight" },

  // ── Hamstrings ───────────────────────────────────────────────────────────
  { id: "romanian-deadlift", name: "Romanian Deadlift", muscle: "hamstrings", equipment: "barbell", barbell: true },
  { id: "stiff-leg-deadlift", name: "Stiff-Leg Deadlift", muscle: "hamstrings", equipment: "barbell", barbell: true },
  { id: "lying-leg-curl", name: "Lying Leg Curl", muscle: "hamstrings", equipment: "machine" },
  { id: "seated-leg-curl", name: "Seated Leg Curl", muscle: "hamstrings", equipment: "machine" },
  { id: "nordic-curl", name: "Nordic Curl", muscle: "hamstrings", equipment: "bodyweight" },
  { id: "good-morning", name: "Good Morning", muscle: "hamstrings", equipment: "barbell", barbell: true },
  { id: "glute-ham-raise", name: "Glute-Ham Raise", muscle: "hamstrings", equipment: "bodyweight" },

  // ── Glutes ───────────────────────────────────────────────────────────────
  { id: "hip-thrust", name: "Hip Thrust", muscle: "glutes", equipment: "barbell", barbell: true },
  { id: "glute-bridge", name: "Glute Bridge", muscle: "glutes", equipment: "bodyweight" },
  { id: "cable-kickback", name: "Cable Kickback", muscle: "glutes", equipment: "cable" },
  { id: "db-sumo-squat", name: "Dumbbell Sumo Squat", muscle: "glutes", equipment: "dumbbell" },
  { id: "hip-abduction", name: "Hip Abduction", muscle: "glutes", equipment: "machine" },

  // ── Calves ───────────────────────────────────────────────────────────────
  { id: "standing-calf-raise", name: "Standing Calf Raise", muscle: "calves", equipment: "machine" },
  { id: "seated-calf-raise", name: "Seated Calf Raise", muscle: "calves", equipment: "machine" },
  { id: "db-calf-raise", name: "Dumbbell Calf Raise", muscle: "calves", equipment: "dumbbell" },

  // ── Core ─────────────────────────────────────────────────────────────────
  { id: "plank", name: "Plank", muscle: "core", equipment: "bodyweight", note: "Log seconds as reps" },
  { id: "crunch", name: "Crunch", muscle: "core", equipment: "bodyweight" },
  { id: "hanging-leg-raise", name: "Hanging Leg Raise", muscle: "core", equipment: "bodyweight" },
  { id: "cable-crunch", name: "Cable Crunch", muscle: "core", equipment: "cable" },
  { id: "russian-twist", name: "Russian Twist", muscle: "core", equipment: "dumbbell" },
  { id: "ab-wheel", name: "Ab Wheel Rollout", muscle: "core", equipment: "other" },
  { id: "dead-bug", name: "Dead Bug", muscle: "core", equipment: "bodyweight" },
  { id: "side-plank", name: "Side Plank", muscle: "core", equipment: "bodyweight", note: "Log seconds as reps" },

  // ── Cardio / conditioning ────────────────────────────────────────────────
  { id: "treadmill-run", name: "Treadmill Run", muscle: "cardio", equipment: "machine", note: "Log minutes as reps" },
  { id: "rowing-machine", name: "Rowing Machine", muscle: "cardio", equipment: "machine", note: "Log minutes as reps" },
  { id: "cycling", name: "Cycling", muscle: "cardio", equipment: "machine", note: "Log minutes as reps" },
  { id: "jump-rope", name: "Jump Rope", muscle: "cardio", equipment: "other" },
  { id: "kettlebell-swing", name: "Kettlebell Swing", muscle: "cardio", equipment: "kettlebell" },
  { id: "burpee", name: "Burpee", muscle: "cardio", equipment: "bodyweight" },
];

/** Built-in exercises keyed by id. */
export const EXERCISE_INDEX = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

/**
 * Merge built-ins with user-created exercises. Custom entries win on id.
 * @param {Exercise[]} custom
 * @returns {Exercise[]}
 */
export function allExercises(custom = []) {
  const map = new Map(EXERCISES.map((e) => [e.id, e]));
  for (const e of custom) {
    if (e && typeof e.id === "string" && e.id.length > 0) map.set(e.id, e);
  }
  return [...map.values()];
}

/**
 * Case-insensitive search across name, muscle and equipment.
 * @param {Exercise[]} list
 * @param {string} query
 * @param {string} [muscle] optional muscle-group filter
 */
export function searchExercises(list, query, muscle = "all") {
  const q = (query ?? "").trim().toLowerCase();
  return list.filter((e) => {
    if (muscle !== "all" && e.muscle !== muscle) return false;
    if (q.length === 0) return true;
    return (
      e.name.toLowerCase().includes(q) ||
      e.muscle.toLowerCase().includes(q) ||
      e.equipment.toLowerCase().includes(q)
    );
  });
}

/** Slugify a name into a stable custom-exercise id. */
export function makeExerciseId(name) {
  const slug = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `custom-${slug || "exercise"}`;
}
