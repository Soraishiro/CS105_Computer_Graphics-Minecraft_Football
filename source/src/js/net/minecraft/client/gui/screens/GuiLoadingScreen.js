import GuiScreen from "../GuiScreen.js";

export default class GuiLoadingScreen extends GuiScreen {

    constructor() {
        super();
        this.progress = 0;
        this.title = "";
    }

    init() {
        super.init();
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        // Render dirt background
        this.drawBackground(stack, this.textureBackground, this.width, this.height);

        // Render title
        this.drawCenteredString(stack, this.title, this.width / 2, this.height / 2 - 30);

        let progressWidth = 240;
        let progressHeight = 10;
        let left = this.width / 2 - progressWidth / 2;
        let top = this.height / 2 - progressHeight / 2;
        let right = left + progressWidth;
        let bottom = top + progressHeight;

        // Draw outer black border for premium 3D Minecraft HUD bar look
        this.drawRect(stack, left - 1, top - 1, right + 1, bottom + 1, '#000000');

        // Draw empty background inside the bar
        this.drawRect(stack, left, top, right, bottom, '#555555');

        let currentTipX = left + progressWidth * this.progress;

        // Draw progressive bar with light top border and dark bottom shadow
        if (this.progress > 0) {
            // Main green bar
            this.drawRect(stack, left, top, currentTipX, bottom, '#80ff80');
            // Lighter top highlight
            this.drawRect(stack, left, top, currentTipX, top + 2, '#c0ffc0');
            // Darker bottom shadow
            this.drawRect(stack, left, bottom - 2, currentTipX, bottom, '#40c040');
        }

        // Draw percentage text centered below the progress bar
        let percentText = Math.floor(this.progress * 100) + "%";
        this.drawCenteredString(stack, percentText, this.width / 2, bottom + 8, 0xffffff);

        // Render bouncing & spinning soccer ball ⚽ at the leading edge (tip) of the progress bar
        stack.save();
        let bounceY = Math.abs(Math.sin(Date.now() / 150)) * 6; // Bounces up to 6px
        stack.translate(currentTipX, top - 8 - bounceY);
        let spinAngle = (Date.now() / 150) % (Math.PI * 2);
        stack.rotate(spinAngle);
        stack.font = "14px sans-serif";
        stack.textAlign = "center";
        stack.textBaseline = "middle";
        stack.fillText("⚽", 0, 0);
        stack.restore();

        // Render moving yellow percentage text right above the bouncing soccer ball for ultra Pro Max style
        this.drawCenteredString(stack, percentText, currentTipX, top - 24 - bounceY, 0xffff55);

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    setTitle(title) {
        this.title = title;
    }

    setProgress(progress) {
        if (progress < this.progress || progress > 1) {
            return;
        }
        this.progress = progress;
    }

    keyTyped(key) {
        // Cancel key inputs
    }
}