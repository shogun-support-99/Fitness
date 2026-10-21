/**
 * IronLog — rest timer.
 *
 * A single countdown shared by the whole app. Pure enough to test: the clock is
 * injected, so tests never wait in real time.
 */

export class RestTimer {
  /**
   * @param {object} [options]
   * @param {(callback: Function, ms: number) => number} [options.setInterval]
   * @param {(id: number) => void} [options.clearInterval]
   * @param {() => number} [options.now]
   * @param {(secondsLeft: number) => void} [options.onFinish]
   */
  constructor({
    setInterval: setIntervalFn,
    clearInterval: clearIntervalFn,
    now,
    onFinish,
  } = {}) {
    this._setInterval = setIntervalFn ?? globalThis.setInterval?.bind(globalThis);
    this._clearInterval = clearIntervalFn ?? globalThis.clearInterval?.bind(globalThis);
    this._now = now ?? (() => Date.now());
    this._onFinish = onFinish ?? null;
    this.listeners = new Set();
    this.handle = null;
    this.endsAt = null;
    this.totalSeconds = 0;
    this.running = false;
    this.finished = false;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  #emit() {
    const snapshot = this.snapshot();
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch {
        /* ignore a broken listener */
      }
    }
  }

  /** Start (or restart) a countdown of `seconds`. */
  start(seconds) {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    this.stop();
    if (total === 0) {
      this.#emit();
      return this.snapshot();
    }
    this.totalSeconds = total;
    this.endsAt = this._now() + total * 1000;
    this.running = true;
    this.finished = false;
    this.handle = this._setInterval(() => this.#tick(), 250);
    this.#emit();
    return this.snapshot();
  }

  /** Resume from a stored absolute end timestamp (survives a page reload). */
  resumeFrom(endsAt, totalSeconds) {
    const end = Number(endsAt);
    if (!Number.isFinite(end)) return this.snapshot();
    const remaining = Math.round((end - this._now()) / 1000);
    if (remaining <= 0) {
      this.endsAt = null;
      this.running = false;
      this.#emit();
      return this.snapshot();
    }
    return this.start(remaining);
  }

  #tick() {
    if (!this.running) return;
    const left = this.secondsLeft();
    if (left <= 0) {
      this.running = false;
      this.endsAt = null;
      this.finished = true;
      if (this.handle !== null) {
        this._clearInterval(this.handle);
        this.handle = null;
      }
      this.#emit();
      if (typeof this._onFinish === "function") {
        try {
          this._onFinish(this.totalSeconds);
        } catch {
          /* notification failures must not break the timer */
        }
      }
      return;
    }
    this.#emit();
  }

  addSeconds(delta) {
    if (!this.running || !this.endsAt) return this.snapshot();
    this.endsAt += Math.round(Number(delta) || 0) * 1000;
    this.totalSeconds = Math.max(1, this.totalSeconds + Math.round(Number(delta) || 0));
    this.#emit();
    return this.snapshot();
  }

  stop() {
    if (this.handle !== null) {
      this._clearInterval(this.handle);
      this.handle = null;
    }
    const wasRunning = this.running;
    this.running = false;
    this.endsAt = null;
    this.totalSeconds = 0;
    this.finished = false;
    if (wasRunning) this.#emit();
    return this.snapshot();
  }

  secondsLeft() {
    if (!this.running || !this.endsAt) return 0;
    return Math.max(0, Math.ceil((this.endsAt - this._now()) / 1000));
  }

  /**
   * 0..1 progress through the countdown, for the ring indicator.
   * A countdown that ran to the end reports 1 rather than snapping back to 0,
   * so the bar can be seen full at the moment it completes. An explicitly
   * stopped timer reports 0.
   */
  progress() {
    if (this.finished) return 1;
    if (!this.running || this.totalSeconds <= 0) return 0;
    const left = this.secondsLeft();
    return Math.min(1, Math.max(0, 1 - left / this.totalSeconds));
  }

  snapshot() {
    return {
      running: this.running,
      secondsLeft: this.secondsLeft(),
      totalSeconds: this.totalSeconds,
      progress: this.progress(),
      endsAt: this.endsAt,
    };
  }
}

/** mm:ss */
export function formatSeconds(totalSeconds) {
  const s = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Elapsed workout clock, h:mm:ss above an hour. */
export function formatElapsed(ms) {
  const total = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}
