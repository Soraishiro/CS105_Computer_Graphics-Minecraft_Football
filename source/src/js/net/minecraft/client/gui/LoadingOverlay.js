/**
 * LoadingOverlay — thin wrapper over the #loading-overlay DOM element.
 *
 * Implements weighted stage progress: each stage owns a slice of the 0..100
 * range (sum of weights). Within a stage you push 0..1 progress and the
 * overlay maps it onto the stage's slice. This avoids the classic "stuck at
 * 80% then jumps to 100% in one frame" jank.
 */
export default class LoadingOverlay {
  constructor() {
    this.root = document.getElementById("loading-overlay");
    this.barFill = document.getElementById("loading-bar-fill");
    this.percentEl = document.getElementById("loading-percent");
    this.stageEl = document.getElementById("loading-stage");
    this.hintEl = document.getElementById("loading-hint");

    this.stages = [];
    this.stageIndex = -1;
    this.fraction = 0;
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
    if (this.stageEl) this.stageEl.textContent = this.stages[idx].label;
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
  }

  hide() {
    if (this.root) this.root.classList.remove("active");
  }

  _renderProgress(value) {
    const pct = Math.round(value * 100);
    if (this.barFill) this.barFill.style.width = pct + "%";
    if (this.percentEl) this.percentEl.textContent = pct + "%";
  }
}

let _instance = null;
export function getLoadingOverlay() {
  if (_instance === null) {
    _instance = new LoadingOverlay();
  }
  return _instance;
}
