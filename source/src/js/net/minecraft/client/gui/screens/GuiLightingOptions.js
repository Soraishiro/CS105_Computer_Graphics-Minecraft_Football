import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiSwitchButton from "../widgets/GuiSwitchButton.js";
import GuiSliderButton from "../widgets/GuiSliderButton.js";

export default class GuiLightingOptions extends GuiScreen {
    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
        this.currentTab = "GLOBAL";
    }

    init() {
        super.init();
        this.rebuildButtons();
    }

    rebuildButtons() {
        this.buttonList = [];
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
        let centerX = this.width / 2 - 100;

        // --- Tabs Row ---
        let tabWidth = 100;
        let tabStartX = this.width / 2 - (tabWidth * 3 + 10) / 2;

        let btnGlobal = new GuiButton("Global", tabStartX, startY, tabWidth, 20, () => {
            this.currentTab = "GLOBAL";
            this.rebuildButtons();
        });
        btnGlobal.enabled = this.currentTab !== "GLOBAL";
        this.buttonList.push(btnGlobal);

        let btnSunMoon = new GuiButton("Sun & Moon", tabStartX + tabWidth + 5, startY, tabWidth, 20, () => {
            this.currentTab = "SUN_MOON";
            this.rebuildButtons();
        });
        btnSunMoon.enabled = this.currentTab !== "SUN_MOON";
        this.buttonList.push(btnSunMoon);

        let btnBlocks = new GuiButton("Blocks", tabStartX + (tabWidth + 5) * 2, startY, tabWidth, 20, () => {
            this.currentTab = "BLOCKS";
            this.rebuildButtons();
        });
        btnBlocks.enabled = this.currentTab !== "BLOCKS";
        this.buttonList.push(btnBlocks);

        // --- Options Area ---
        let optionStartY = startY + spacing * 2;

        if (this.currentTab === "GLOBAL") {
            this.buttonList.push(new GuiSwitchButton("Auto Day/Night", settings.enableDayNightLighting, centerX, optionStartY, 200, 20, value => {
                settings.enableDayNightLighting = value;
                updateLighting();
            }));
            this.buttonList.push(new GuiSliderButton("Ambient Light", settings.ambientIntensity * 10, 0, 50, centerX, optionStartY + spacing, 200, 20, value => {
                settings.ambientIntensity = value / 10;
                updateLighting();
            }).setDisplayNameBuilder((name, value) => name + ": " + (value / 10).toFixed(1)));

        } else if (this.currentTab === "SUN_MOON") {
            // Sun (Left)
            this.buttonList.push(new GuiSliderButton("Sun Light", settings.sunIntensity * 10, 0, 50, leftX, optionStartY, colWidth, 20, value => {
                settings.sunIntensity = value / 10;
                updateLighting();
            }).setDisplayNameBuilder((name, value) => name + ": " + (value / 10).toFixed(1)));
            this.buttonList.push(new GuiSwitchButton("Sun Shadow", settings.sunCastShadow, leftX, optionStartY + spacing, colWidth, 20, value => {
                settings.sunCastShadow = value;
                updateLighting();
            }));
            this.buttonList.push(new GuiSwitchButton("Sun Helper", settings.showSunLightHelper, leftX, optionStartY + spacing * 2, colWidth, 20, value => {
                settings.showSunLightHelper = value;
                updateLighting();
            }));

            // Moon (Right)
            this.buttonList.push(new GuiSliderButton("Moon Light", settings.moonIntensity * 10, 0, 50, rightX, optionStartY, colWidth, 20, value => {
                settings.moonIntensity = value / 10;
                updateLighting();
            }).setDisplayNameBuilder((name, value) => name + ": " + (value / 10).toFixed(1)));
            this.buttonList.push(new GuiSwitchButton("Moon Shadow", settings.moonCastShadow, rightX, optionStartY + spacing, colWidth, 20, value => {
                settings.moonCastShadow = value;
                updateLighting();
            }));
            this.buttonList.push(new GuiSwitchButton("Moon Helper", settings.showMoonLightHelper, rightX, optionStartY + spacing * 2, colWidth, 20, value => {
                settings.showMoonLightHelper = value;
                updateLighting();
            }));

        } else if (this.currentTab === "BLOCKS") {
            // Torches (Left)
            this.buttonList.push(new GuiSliderButton("Torch Light", settings.torchIntensity * 10, 0, 100, leftX, optionStartY, colWidth, 20, value => {
                settings.torchIntensity = value / 10;
                updateLighting();
            }).setDisplayNameBuilder((name, value) => name + ": " + (value / 10).toFixed(1)));
            this.buttonList.push(new GuiSliderButton("Torch Dist", settings.torchDistance, 5, 50, leftX, optionStartY + spacing, colWidth, 20, value => {
                settings.torchDistance = value;
                updateLighting();
            }));
            this.buttonList.push(new GuiSwitchButton("Torch Shadow", settings.torchCastShadow, leftX, optionStartY + spacing * 2, colWidth, 20, value => {
                settings.torchCastShadow = value;
                updateLighting();
            }));

            // Spotlights (Right)
            this.buttonList.push(new GuiSliderButton("SpotLight", settings.spotLightIntensity * 10, 0, 200, rightX, optionStartY, colWidth, 20, value => {
                settings.spotLightIntensity = value / 10;
                updateLighting();
            }).setDisplayNameBuilder((name, value) => name + ": " + (value / 10).toFixed(1)));
            this.buttonList.push(new GuiSliderButton("Spot Angle", settings.spotLightAngle, 0, 90, rightX, optionStartY + spacing, colWidth, 20, value => {
                settings.spotLightAngle = value;
                updateLighting();
            }).setDisplayNameBuilder((name, value) => name + ": " + value + ""));
            this.buttonList.push(new GuiSwitchButton("Spot Shadow", settings.spotLightCastShadow, rightX, optionStartY + spacing * 2, colWidth, 20, value => {
                settings.spotLightCastShadow = value;
                updateLighting();
            }));
            this.buttonList.push(new GuiSwitchButton("Spot Helper", settings.showSpotLightHelper, rightX, optionStartY + spacing * 3, colWidth, 20, value => {
                settings.showSpotLightHelper = value;
                updateLighting();
            }));
        }

        // Done button at bottom
        this.buttonList.push(new GuiButton("Done", centerX, this.height - 40, 200, 20, () => {
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
