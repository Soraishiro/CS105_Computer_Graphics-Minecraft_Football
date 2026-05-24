import Minecraft from './net/minecraft/client/Minecraft.js';
import * as aesjs from '../../libraries/aes.js';

class Start {
  // Load a list of textures and return a resources map
  loadTextures(textures) {
    let resources = [];
    let index = 0;

    return textures
      .reduce((currentPromise, texturePath) => {
        return currentPromise.then(() => {
          return new Promise((resolve, reject) => {
            let image = new Image();
            image.src = 'src/resources/' + texturePath + '?v=' + Date.now();
            image.onload = () => resolve();
            image.onerror = (err) => {
              console.error('Failed to load texture: ' + texturePath, err);
              resolve(); // Resolve anyway so game doesn't hang
            };
            resources[texturePath] = image;

            index++;
          });
        });
      }, Promise.resolve())
      .then(() => {
        return resources;
      });
  }

  /**
   * Stitch all stadium asset PNGs into the terrain_stadium atlas canvas.
   * Each PNG maps to a texture slot (StadiumTextures values 200-239).
   * Slot N => col = N%16, row = floor(N/16) in a 16×16 tile grid of 16px tiles.
   */
  buildStadiumAtlas(resources) {
    // Mapping: slot ID -> individual PNG path
    const SLOT_MAP = {
      200: 'stadium_assets/01_dark_turf_block.png',
      201: 'stadium_assets/02_light_turf_block.png',
      202: 'stadium_assets/03_worn_turf_block.png',
      203: 'stadium_assets/04_white_pitch_line.png',
      204: 'stadium_assets/05_center_circle_tile.png',
      205: 'stadium_assets/06_corner_arc_tile.png',
      206: 'stadium_assets/07_goal_post_block.png',
      207: 'stadium_assets/08_goal_crossbar_block.png',
      208: 'stadium_assets/09_goal_net_texture.png',
      209: 'stadium_assets/10_back_support_block.png',
      210: 'stadium_assets/11_goal_anchor_base_block.png',
      211: 'stadium_assets/12_purple_seat_block.png',
      212: 'stadium_assets/13_red_seat_block.png',
      213: 'stadium_assets/14_navy_seat_block.png',
      214: 'stadium_assets/15_teal_seat_block.png',
      215: 'stadium_assets/16_light_concrete_block.png',
      216: 'stadium_assets/17_dark_concrete_block.png',
      217: 'stadium_assets/18_aisle_stair_marker_block.png',
      218: 'stadium_assets/19_metal_railing_block.png',
      219: 'stadium_assets/20_roof_panel_block.png',
      220: 'stadium_assets/21_steel_truss_block.png',
      221: 'stadium_assets/22_dugout_glass_panel.png',
      222: 'stadium_assets/23_dugout_dark_panel.png',
      223: 'stadium_assets/24_bench_seat_block.png',
      224: 'stadium_assets/25_technical_area_line.png',
      225: 'stadium_assets/26_tunnel_wall_block.png',
      226: 'stadium_assets/27_floodlight_panel_block.png',
      227: 'stadium_assets/27b_tunnel_neon_strip_block.png',
      228: 'stadium_assets/28_scoreboard_screen_block.png',
      229: 'stadium_assets/29_led_text_goal_panel.png',
      230: 'stadium_assets/30_led_board_purple.png',
      231: 'stadium_assets/31_led_board_red.png',
      232: 'stadium_assets/32_corner_flag_texture.png',
      233: 'stadium_assets/33_crowd_block_red.png',
      234: 'stadium_assets/34_crowd_block_purple.png',
      235: 'stadium_assets/35_crowd_block_white.png',
      236: 'stadium_assets/36_crowd_block_skin.png',
      237: 'stadium_assets/37_crowd_block_dark.png',
      238: 'stadium_assets/38_decorative_banner_block.png',
      239: 'stadium_assets/39_soccer_ball_texture.png',
      240: 'stadium_assets/40_redstone_lamp.png',
      241: 'stadium_assets/41_redstone_lamp_on.png',
    };

    // Get the base atlas canvas (256×256)
    let atlasImg = resources['terrain/terrain_stadium.png'];
    let canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    let ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(atlasImg, 0, 0, 256, 256); // draw existing vanilla tiles

    // Load all individual slot PNGs and stitch them in
    let promises = Object.entries(SLOT_MAP).map(([slotStr, path]) => {
      return new Promise((resolve) => {
        let slot = parseInt(slotStr, 10);
        let col = slot % 16;
        let row = Math.floor(slot / 16);
        let px = col * 16;
        let py = row * 16;

        // Use already-loaded image from resources if available
        let key = path;
        if (resources[key]) {
          ctx.clearRect(px, py, 16, 16);
          ctx.drawImage(resources[key], px, py, 16, 16);
          resolve();
        } else {
          let img = new Image();
          img.src = 'src/resources/' + path + '?v=' + Date.now();
          img.onload = () => {
            ctx.clearRect(px, py, 16, 16);
            ctx.drawImage(img, px, py, 16, 16);
            resolve();
          };
          img.onerror = () => resolve();
        }
      });
    });

    return Promise.all(promises).then(() => {
      // Replace the terrain atlas with our stitched canvas
      let stitchedImg = new Image();
      stitchedImg.src = canvas.toDataURL();
      resources['terrain/terrain_stadium.png'] = stitchedImg;
      return resources;
    });
  }

  launch(canvasWrapperId) {
    this.loadTextures([
      'misc/grasscolor.png',
      'misc/rain.png',
      'gui/font.png',
      'gui/gui.png',
      'gui/background.png',
      'gui/icons.png',
      'terrain/terrain_stadium.png',
      'terrain/terrain_bump.jpg',
      'terrain/sun.png',
      'terrain/moon.png',
      '2026_05_12_ahmad-jamal-24047479.png',
      '2025_04_12_italian-referee-23186559.png',
      '2026_03_01_messi-2018--remake--23896589.png',
      '2025_11_29_real-madrid-number-7-23682272.png',
      'gui/title/minecraft.png',
      'gui/title/background/panorama_0.png',
      'gui/title/background/panorama_1.png',
      'gui/title/background/panorama_2.png',
      'gui/title/background/panorama_3.png',
      'gui/title/background/panorama_4.png',
      'gui/title/background/panorama_5.png',
      'gui/container/creative.png',
      'entity/football.png',
      'entity/football_2.png',
      'entity/football_bump.png',
    ]).then((resources) => {
      return this.buildStadiumAtlas(resources);
    }).then((resources) => {
      window.app = new Minecraft(canvasWrapperId, resources);
    });
  }
}

window.addEventListener('pageshow', function (event) {
  if (window.app) {
    if (!window.app.running) {
      window.location.reload();
    }
  } else {
    new Start().launch('canvas-container');
  }
});

export function require(module) {
  return window[module];
}
