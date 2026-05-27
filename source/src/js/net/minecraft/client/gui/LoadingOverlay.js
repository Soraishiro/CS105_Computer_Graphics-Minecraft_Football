/**
 * LoadingOverlay — thin wrapper over the #loading-overlay DOM element.
 *
 * Implements weighted stage progress (each stage owns a slice of 0..100%)
 * plus a minimum-visible-time gate so the user always has time to read tips
 * even when assets load from a warm cache in under a second.
 *
 * Also drives a rotating "Did you know" Mojang-style tip in the banner above
 * the title.
 */

const ROTATING_TIPS = [
  "Press 2× Space to toggle Fly Mode.",
  "Use F5 to switch between 1st and 3rd person view.",
  "Hold Ctrl while moving to Sprint.",
  "Open the settings to tune music volume and FOV.",
  "There are 600 spectators in the stands — each picks a random seat.",
  "Press F3 to inspect coordinates, FPS, and debug info.",
  "The pitch is built at 50% of FIFA standard scale.",
  "Walk through the tunnel to enter the pitch like a real player.",
  "Press T to open chat — try typing /tp to teleport.",
  "The corner flags use 2 blocks for the pole and 1 for the triangular flag.",
];

export default class LoadingOverlay {
  constructor() {
    this.root = document.getElementById("loading-overlay");
    this.barFill = document.getElementById("loading-bar-fill");
    this.percentEl = document.getElementById("loading-percent");
    this.stageEl = document.getElementById("loading-stage");
    this.hintEl = document.getElementById("loading-hint");
    this.tipEl = document.getElementById("mc-rotating-tip");

    this.stages = [];
    this.stageIndex = -1;
    this.fraction = 0;

    // Minimum time the overlay stays on screen after a hide() request — gives
    // the user a beat to read tips even on hot-cached reloads.
    this.minVisibleMs = 10000;
    this.shownAt = Date.now();
    this._hideTimer = null;

    // Rotate the Mojang-style tip every 4 seconds while the overlay is shown.
    this._tipIndex = Math.floor(Math.random() * ROTATING_TIPS.length);
    this._tipInterval = null;
    this._startTipRotation();
  }

  setStages(stages) {
    const total = stages.reduce((acc, s) => acc + s.weight, 0) || 1;
    let acc = 0;
    this.stages = stages.map((s) => {
      const slice = s.weight / total;
      const stage = { ...s, start: acc, slice };
      acc += slice;
      return stage;
    });
    this.stageIndex = -1;
    this.fraction = 0;
    this._renderProgress(0);
  }

  beginStage(id) {
    const idx = this.stages.findIndex((s) => s.id === id);
    if (idx === -1) return;
    this.stageIndex = idx;
    this.fraction = 0;
    if (this.stageEl) this.stageEl.textContent = this.stages[idx].label + "...";
    this._renderProgress(this.stages[idx].start);
  }

  setStageFraction(fraction) {
    if (this.stageIndex < 0) return;
    fraction = Math.max(0, Math.min(1, fraction));
    if (fraction < this.fraction) return;
    this.fraction = fraction;
    const stage = this.stages[this.stageIndex];
    this._renderProgress(stage.start + fraction * stage.slice);
  }

  completeStage() {
    if (this.stageIndex < 0) return;
    const stage = this.stages[this.stageIndex];
    this.fraction = 1;
    this._renderProgress(stage.start + stage.slice);
  }

  setHint(text) {
    if (this.hintEl) this.hintEl.textContent = text;
  }

  show() {
    if (this.root) this.root.classList.add("active");
    this.shownAt = Date.now();
    if (this._hideTimer !== null) {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
    }
    this._startTipRotation();
  }

  /**
   * Hide the overlay, but only AFTER the minimum visible window has elapsed.
   * If the assets loaded in under that window, defer the actual hide until
   * we've shown the loading screen for at least minVisibleMs.
   */
  hide() {
    const elapsed = Date.now() - this.shownAt;
    const remaining = Math.max(0, this.minVisibleMs - elapsed);

    const doHide = () => {
      if (this.root) this.root.classList.remove("active");
      this._stopTipRotation();
      this._hideTimer = null;
    };

    if (remaining === 0) {
      doHide();
    } else {
      if (this._hideTimer !== null) clearTimeout(this._hideTimer);
      this._hideTimer = setTimeout(doHide, remaining);
    }
  }

  _renderProgress(value) {
    const pct = Math.round(value * 100);
    if (this.barFill) this.barFill.style.width = pct + "%";
    if (this.percentEl) this.percentEl.textContent = pct + "%";
  }

  _startTipRotation() {
    if (this._tipInterval !== null) return;
    this._showTip(this._tipIndex);
    this._tipInterval = setInterval(() => {
      this._tipIndex = (this._tipIndex + 1) % ROTATING_TIPS.length;
      this._showTip(this._tipIndex);
    }, 4000);
  }

  _stopTipRotation() {
    if (this._tipInterval !== null) {
      clearInterval(this._tipInterval);
      this._tipInterval = null;
    }
  }

  _showTip(index) {
    if (this.tipEl) {
      this.tipEl.textContent = ROTATING_TIPS[index];
    }
  }
}

let _instance = null;
export function getLoadingOverlay() {
  if (_instance === null) {
    _instance = new LoadingOverlay();
  }
  return _instance;
}
