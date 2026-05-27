export default class GameSettings {
  constructor() {
    this.keyCrouching = "ShiftLeft";
    this.keySprinting = "ControlLeft";
    this.keyTogglePerspective = "F5";
    this.keyOpenChat = "KeyT";
    this.keyOpenInventory = "KeyE";
    this.keyPlayerList = "Tab";

    this.session = null;

    this.thirdPersonView = 0;
    this.fov = 70;
    this.viewBobbing = true;
    this.ambientOcclusion = true;
    this.sensitivity = 100;
    this.viewDistance = 8;
    this.debugOverlay = false;
    this.serverAddress = "server.labystudio.de";
    this.musicVolume = 50; // 0-100; set to 0 to mute the soundtrack

    // Lighting settings
    this.enableDayNightLighting = true;
    this.enableRain = true;
    this.ambientIntensity = 0.4;
    this.sunIntensity = 1.2;
    this.torchIntensity = 2.5;
    this.torchDistance = 15;
    this.showSunLightHelper = false;
    this.torchCastShadow = false;
    this.sunCastShadow = false;
    this.moonIntensity = 0.4;
    this.moonCastShadow = false;
    this.showMoonLightHelper = false;
    this.spotLightIntensity = 5;
    this.spotLightDistance = 100;
    this.spotLightAngle = 30; // degrees
    this.spotLightCastShadow = false;
    this.showSpotLightHelper = false;
  }

  load() {
    for (let prop in this) {
      let nameEQ = prop + "=";
      let ca = document.cookie.split(";");
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
          let value = c.substring(nameEQ.length, c.length);
          // Match integer or float
          if (value.match(/^-?[0-9]+(\.[0-9]+)?$/)) {
            value = parseFloat(value);
          }
          if (value === "true") {
            value = true;
          }
          if (value === "false") {
            value = false;
          }
          if (value === "null") {
            value = null;
          }
          this[prop] = value;
        }
      }
    }
  }

  save() {
    for (let prop in this) {
      document.cookie =
        prop +
        "=" +
        this[prop] +
        "; path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT";
    }
  }
}
