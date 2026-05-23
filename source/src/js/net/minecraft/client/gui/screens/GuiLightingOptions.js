import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiSwitchButton from "../widgets/GuiSwitchButton.js";
import GuiSliderButton from "../widgets/GuiSliderButton.js";

export default class GuiLightingOptions extends GuiScreen {
    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
    }

    init() {
        super.init();

        let settings = this.minecraft.settings;
        let renderer = this.minecraft.worldRenderer;

        // Callback helper
        let updateLighting = () => {
            renderer.updateLightingFromSettings();
        };

        let startY = 40;
        let spacing = 24;
        let colWidth = 150;

        let leftX = this.width / 2 - 155;
        let rightX = this.width / 2 + 5;

        // --- Column 1 (Left: General & Sun) ---
        this.buttonList.push(new GuiSwitchButton("Auto Day/Night", settings.enableDayNightLighting, leftX, startY, colWidth, 20, value => {
            settings.enableDayNightLighting = value;
            updateLighting();
        }));
        this.buttonList.push(new GuiSliderButton("Ambient Light", settings.ambientIntensity * 10, 0, 50, leftX, startY + spacing, colWidth, 20, value => {
            settings.ambientIntensity = value / 10;
            updateLighting();
        }).setDisplayNameBuilder((name, value) => name + ": " + (value / 10).toFixed(1)));

        this.buttonList.push(new GuiSliderButton("Sun Light", settings.sunIntensity * 10, 0, 50, leftX, startY + spacing * 2, colWidth, 20, value => {
            settings.sunIntensity = value / 10;
            updateLighting();
        }).setDisplayNameBuilder((name, value) => name + ": " + (value / 10).toFixed(1)));

        this.buttonList.push(new GuiSwitchButton("Sun Shadow", settings.sunCastShadow, leftX, startY + spacing * 3, colWidth, 20, value => {
            settings.sunCastShadow = value;
            updateLighting();
        }));

        this.buttonList.push(new GuiSwitchButton("Sun Helper", settings.showSunLightHelper, leftX, startY + spacing * 4, colWidth, 20, value => {
            settings.showSunLightHelper = value;
            updateLighting();
        }));

        this.buttonList.push(new GuiSliderButton("Moon Light", settings.moonIntensity * 10, 0, 50, leftX, startY + spacing * 5, colWidth, 20, value => {
            settings.moonIntensity = value / 10;
            updateLighting();
        }).setDisplayNameBuilder((name, value) => name + ": " + (value / 10).toFixed(1)));

        this.buttonList.push(new GuiSwitchButton("Moon Shadow", settings.moonCastShadow, leftX, startY + spacing * 6, colWidth, 20, value => {
            settings.moonCastShadow = value;
            updateLighting();
        }));

        this.buttonList.push(new GuiSwitchButton("Moon Helper", settings.showMoonLightHelper, leftX, startY + spacing * 7, colWidth, 20, value => {
            settings.showMoonLightHelper = value;
            updateLighting();
        }));

        // --- Column 2 (Right: Torches & Spotlights) ---
        this.buttonList.push(new GuiSliderButton("Torch Light", settings.torchIntensity * 10, 0, 100, rightX, startY, colWidth, 20, value => {
            settings.torchIntensity = value / 10;
            updateLighting();
        }).setDisplayNameBuilder((name, value) => name + ": " + (value / 10).toFixed(1)));

        this.buttonList.push(new GuiSliderButton("Torch Dist", settings.torchDistance, 5, 50, rightX, startY + spacing, colWidth, 20, value => {
            settings.torchDistance = value;
            updateLighting();
        }));

        this.buttonList.push(new GuiSwitchButton("Torch Shadow", settings.torchCastShadow, rightX, startY + spacing * 2, colWidth, 20, value => {
            settings.torchCastShadow = value;
            updateLighting();
        }));

        this.buttonList.push(new GuiSliderButton("SpotLight", settings.spotLightIntensity * 10, 0, 200, rightX, startY + spacing * 3, colWidth, 20, value => {
            settings.spotLightIntensity = value / 10;
            updateLighting();
        }).setDisplayNameBuilder((name, value) => name + ": " + (value / 10).toFixed(1)));

        this.buttonList.push(new GuiSliderButton("Spot Angle", settings.spotLightAngle, 0, 90, rightX, startY + spacing * 4, colWidth, 20, value => {
            settings.spotLightAngle = value;
            updateLighting();
        }).setDisplayNameBuilder((name, value) => name + ": " + value + ""));

        this.buttonList.push(new GuiSwitchButton("Spot Shadow", settings.spotLightCastShadow, rightX, startY + spacing * 5, colWidth, 20, value => {
            settings.spotLightCastShadow = value;
            updateLighting();
        }));

        this.buttonList.push(new GuiSwitchButton("Spot Helper", settings.showSpotLightHelper, rightX, startY + spacing * 6, colWidth, 20, value => {
            settings.showSpotLightHelper = value;
            updateLighting();
        }));

        // Done button at bottom
        let maxSpacing = 7;
        this.buttonList.push(new GuiButton("Done", this.width / 2 - 100, startY + spacing * maxSpacing + 10, 200, 20, () => {
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Lighting Settings", this.width / 2, 15);
        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    onClose() {
        this.minecraft.settings.save();
    }
}
