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
    this.buttonList.push(
      new GuiSwitchButton(
        "Auto Day/Night",
        settings.enableDayNightLighting,
        leftX,
        startY,
        colWidth,
        20,
        (value) => {
          settings.enableDayNightLighting = value;
          updateLighting();
        },
      ),
    );
    this.buttonList.push(
      new GuiSliderButton(
        "Ambient Light",
        settings.ambientIntensity * 10,
        0,
        50,
        leftX,
        startY + spacing,
        colWidth,
        20,
        (value) => {
          settings.ambientIntensity = value / 10;
          updateLighting();
        },
      ).setDisplayNameBuilder(
        (name, value) => name + ": " + (value / 10).toFixed(1),
      ),
    );

    this.buttonList.push(
      new GuiSliderButton(
        "Sun Light",
        settings.sunIntensity * 10,
        0,
        50,
        leftX,
        startY + spacing * 2,
        colWidth,
        20,
        (value) => {
          settings.sunIntensity = value / 10;
          updateLighting();
        },
      ).setDisplayNameBuilder(
        (name, value) => name + ": " + (value / 10).toFixed(1),
      ),
    );

    this.buttonList.push(
      new GuiSwitchButton(
        "Sun Shadow",
        settings.sunCastShadow,
        leftX,
        startY + spacing * 3,
        colWidth,
        20,
        (value) => {
          settings.sunCastShadow = value;
          updateLighting();
        },
      ),
    );

    this.buttonList.push(
      new GuiSwitchButton(
        "Sun Helper",
        settings.showSunLightHelper,
        leftX,
        startY + spacing * 4,
        colWidth,
        20,
        (value) => {
          settings.showSunLightHelper = value;
          updateLighting();
        },
      ),
    );

    this.buttonList.push(
      new GuiSwitchButton(
        "Rain Weather",
        settings.enableRain,
        leftX,
        startY + spacing * 5,
        colWidth,
        20,
        (value) => {
          settings.enableRain = value;
          if (this.minecraft.world) {
            const w = this.minecraft.world;
            if (!value) {
              w.isRaining = false;
              w.rainStrength = 0.0;
            } else if (w.nextRainAt - w.time > 5000) {
              // Schedule rain to start soon so dev sees immediate feedback
              w.nextRainAt = w.time + 500;
              w.rainEndsAt = w.nextRainAt + 3000;
              w._resyncRainSchedule();
            }
          }
          updateLighting();
        },
      ),
    );

    let initialTime = 0;
    if (this.minecraft.world) {
      initialTime = this.minecraft.world.time % 24000;
    }

    this.buttonList.push(
      new GuiSliderButton(
        "Time",
        initialTime,
        0,
        24000,
        leftX,
        startY + spacing * 6,
        colWidth,
        20,
        (value) => {
          if (this.minecraft.world) {
            let world = this.minecraft.world;
            world.setTime(value); // resyncs rain schedule automatically

            // Sync skylight subtracted and rebuild chunks immediately for real-time visualization
            let lightLevel = world.calculateSkylightSubtracted(1.0);
            if (lightLevel !== world.skylightSubtracted) {
              world.skylightSubtracted = lightLevel;
              this.minecraft.worldRenderer.rebuildAll();
            }
            updateLighting();
          }
        },
      ).setDisplayNameBuilder((name, value) => {
        let hour = Math.floor((value / 1000 + 6) % 24);
        let minutes = Math.floor(((value % 1000) * 60) / 1000);
        return (
          name +
          ": " +
          hour.toString().padStart(2, "0") +
          " : " +
          minutes.toString().padStart(2, "0")
        );
      }),
    );

    // --- Column 2 (Right: Torches & Spotlights) ---
    this.buttonList.push(
      new GuiSliderButton(
        "Torch Light",
        settings.torchIntensity * 10,
        0,
        100,
        rightX,
        startY,
        colWidth,
        20,
        (value) => {
          settings.torchIntensity = value / 10;
          updateLighting();
        },
      ).setDisplayNameBuilder(
        (name, value) => name + ": " + (value / 10).toFixed(1),
      ),
    );

    this.buttonList.push(
      new GuiSliderButton(
        "Torch Dist",
        settings.torchDistance,
        5,
        50,
        rightX,
        startY + spacing,
        colWidth,
        20,
        (value) => {
          settings.torchDistance = value;
          updateLighting();
        },
      ),
    );

    this.buttonList.push(
      new GuiSwitchButton(
        "Torch Shadow",
        settings.torchCastShadow,
        rightX,
        startY + spacing * 2,
        colWidth,
        20,
        (value) => {
          settings.torchCastShadow = value;
          updateLighting();
        },
      ),
    );

    this.buttonList.push(
      new GuiSliderButton(
        "SpotLight",
        settings.spotLightIntensity * 10,
        0,
        200,
        rightX,
        startY + spacing * 3,
        colWidth,
        20,
        (value) => {
          settings.spotLightIntensity = value / 10;
          updateLighting();
        },
      ).setDisplayNameBuilder(
        (name, value) => name + ": " + (value / 10).toFixed(1),
      ),
    );

    let initialAngleDeg = Math.round((settings.spotLightAngle * 180) / Math.PI);
    this.buttonList.push(
      new GuiSliderButton(
        "Spot Angle",
        initialAngleDeg,
        0,
        90,
        rightX,
        startY + spacing * 4,
        colWidth,
        20,
        (value) => {
          settings.spotLightAngle = (value * Math.PI) / 180;
          updateLighting();
        },
      ).setDisplayNameBuilder((name, value) => name + ": " + value + ""),
    );

    this.buttonList.push(
      new GuiSwitchButton(
        "Spot Shadow",
        settings.spotLightCastShadow,
        rightX,
        startY + spacing * 5,
        colWidth,
        20,
        (value) => {
          settings.spotLightCastShadow = value;
          updateLighting();
        },
      ),
    );

    this.buttonList.push(
      new GuiSwitchButton(
        "Spot Helper",
        settings.showSpotLightHelper,
        rightX,
        startY + spacing * 6,
        colWidth,
        20,
        (value) => {
          settings.showSpotLightHelper = value;
          updateLighting();
        },
      ),
    );

    // Done button at bottom
    let maxSpacing = 8;
    this.buttonList.push(
      new GuiButton(
        "Done",
        this.width / 2 - 100,
        startY + spacing * maxSpacing + 10,
        200,
        20,
        () => {
          this.minecraft.displayScreen(this.previousScreen);
        },
      ),
    );
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
