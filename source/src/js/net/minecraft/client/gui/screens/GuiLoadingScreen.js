import GuiScreen from "../GuiScreen.js";
import { getLoadingOverlay } from "../LoadingOverlay.js";

/**
 * GuiLoadingScreen — thin shim over the HTML #loading-overlay.
 *
 * The canvas-rendered progress bar was replaced by the HTML overlay so the
 * loading view can show rich tips, key bindings, and a styled gradient bar.
 * This class still exists because the GuiScreen lifecycle drives pause/focus.
 */
export default class GuiLoadingScreen extends GuiScreen {
  constructor() {
    super();
    this.progress = 0;
    this.title = "";
    this.overlay = getLoadingOverlay();
  }

  init() {
    super.init();
    this.overlay.show();
  }

  drawScreen(stack, mouseX, mouseY, partialTicks) {
    this.drawBackground(stack, this.textureBackground, this.width, this.height);
    super.drawScreen(stack, mouseX, mouseY, partialTicks);
  }

  setTitle(title) {
    this.title = title;
    if (this.overlay) this.overlay.setHint(title);
  }

  setProgress(progress) {
    if (progress < this.progress || progress > 1) {
      return;
    }
    this.progress = progress;
    if (this.overlay) this.overlay.setStageFraction(progress);
  }

  keyTyped(key) {
    // Cancel key inputs
  }
}
