import BlockLog from "./type/BlockLog.js";
import BlockStone from "./type/BlockStone.js";
import BlockGrass from "./type/BlockGrass.js";
import BlockDirt from "./type/BlockDirt.js";
import BlockLeave from "./type/BlockLeave.js";
import BlockWater from "./type/BlockWater.js";
import BlockSand from "./type/BlockSand.js";
import BlockTorch from "./type/BlockTorch.js";
import Sound from "./sound/Sound.js";
import Block from "./Block.js";
import BlockWood from "./type/BlockWood.js";
import BlockBedrock from "./type/BlockBedrock.js";
import BlockGlass from "./type/BlockGlass.js";
import SoundGlass from "./sound/SoundGlass.js";
import BlockGravel from "./type/BlockGravel.js";
import BlockCobblestone from "./type/BlockCobblestone.js";
import { StadiumTextures } from "./StadiumTextureMappings.js";
import BlockTurf from "./type/BlockTurf.js";
import BlockGoalPost from "./type/BlockGoalPost.js";
import BlockGoalNet from "./type/BlockGoalNet.js";
import BlockCornerFlag from "./type/BlockCornerFlag.js";
import BlockFlagTop from "./type/BlockFlagTop.js";
import BlockRedstoneLamp from "./type/BlockRedstoneLamp.js";
import BlockRedstoneLampOn from "./type/BlockRedstoneLampOn.js";

export class BlockRegistry {
  static create() {
    // Sounds
    Block.sounds.stone = new Sound("stone", 1.0);
    Block.sounds.wood = new Sound("wood", 1.0);
    Block.sounds.gravel = new Sound("gravel", 1.0);
    Block.sounds.grass = new Sound("grass", 1.0);
    Block.sounds.cloth = new Sound("cloth", 1.0);
    Block.sounds.sand = new Sound("sand", 1.0);
    Block.sounds.glass = new SoundGlass("stone", 1.0);

    // Blocks
    BlockRegistry.STONE = new BlockStone(1, 0);
    BlockRegistry.GRASS = new BlockGrass(2, 1);
    BlockRegistry.DIRT = new BlockDirt(3, 2);
    BlockRegistry.COBBLE_STONE = new BlockCobblestone(4, 14);
    BlockRegistry.WOOD = new BlockWood(5, 10);
    BlockRegistry.BEDROCK = new BlockBedrock(7, 11);
    BlockRegistry.GRAVEL = new BlockGravel(13, 13);
    BlockRegistry.LOG = new BlockLog(17, 4);
    BlockRegistry.LEAVE = new BlockLeave(18, 6);
    BlockRegistry.GLASS = new BlockGlass(20, 12);
    BlockRegistry.WATER = new BlockWater(9, 7);
    BlockRegistry.SAND = new BlockSand(12, 8);
    BlockRegistry.TORCH = new BlockTorch(50, 9);

    // Stadium Blocks
    BlockRegistry.TURF_DARK = new BlockTurf(
      100,
      StadiumTextures.DARK_TURF_BLOCK,
    );
    BlockRegistry.TURF_LIGHT = new BlockTurf(
      101,
      StadiumTextures.LIGHT_TURF_BLOCK,
    );
    // Pitch lines must be pure solid white block (light concrete) instead of turf-line texture
    BlockRegistry.PITCH_LINE = new BlockTurf(
      102,
      StadiumTextures.LIGHT_CONCRETE_BLOCK,
    );
    BlockRegistry.GOAL_POST = new BlockGoalPost(
      103,
      StadiumTextures.GOAL_POST_BLOCK,
    );
    BlockRegistry.GOAL_NET = new BlockGoalNet(
      104,
      StadiumTextures.GOAL_NET_TEXTURE,
    );
    BlockRegistry.SEAT_RED = new BlockTurf(105, StadiumTextures.RED_SEAT_BLOCK);
    BlockRegistry.SEAT_PURPLE = new BlockTurf(
      106,
      StadiumTextures.PURPLE_SEAT_BLOCK,
    );
    BlockRegistry.CONCRETE_LIGHT = new BlockTurf(
      107,
      StadiumTextures.LIGHT_CONCRETE_BLOCK,
    );
    BlockRegistry.CONCRETE_DARK = new BlockTurf(
      108,
      StadiumTextures.DARK_CONCRETE_BLOCK,
    );
    // Correct color mappings for stands
    BlockRegistry.SEAT_BLUE = new BlockTurf(
      109,
      StadiumTextures.NAVY_SEAT_BLOCK,
    );
    BlockRegistry.SEAT_AISLE = new BlockTurf(
      110,
      StadiumTextures.AISLE_STAIR_MARKER_BLOCK,
    );
    BlockRegistry.CORNER_FLAG = new BlockCornerFlag(
      111,
      StadiumTextures.CONCRETE_LIGHT,
    );
    BlockRegistry.FLAG_TOP = new BlockFlagTop(
      112,
      StadiumTextures.RED_SEAT_BLOCK,
    );
    BlockRegistry.CORNER_ARC = new BlockTurf(
      113,
      StadiumTextures.CORNER_ARC_TILE,
    );
    // Dark green for sideline stands (teal asset)
    BlockRegistry.SEAT_GREEN = new BlockTurf(
      114,
      StadiumTextures.TEAL_SEAT_BLOCK,
    );

    // Stadium Lights
    BlockRegistry.REDSTONE_LAMP = new BlockRedstoneLamp(
      115,
      StadiumTextures.REDSTONE_LAMP,
    );
    BlockRegistry.REDSTONE_LAMP_ON = new BlockRedstoneLampOn(
      116,
      StadiumTextures.REDSTONE_LAMP_ON,
    );

    // Tunnel + decorative architecture blocks. They reuse BlockTurf so
    // they render as standard opaque cubes with their atlas tile.
    BlockRegistry.TUNNEL_WALL = new BlockTurf(
      117,
      StadiumTextures.TUNNEL_WALL_BLOCK,
    );
    // Glowing LED neon strip — emissive so it stays lit when wedged into walls.
    BlockRegistry.TUNNEL_NEON = new BlockRedstoneLampOn(
      118,
      StadiumTextures.TUNNEL_NEON_STRIP_BLOCK,
    );
    BlockRegistry.ROOF_PANEL = new BlockTurf(
      119,
      StadiumTextures.ROOF_PANEL_BLOCK,
    );
    BlockRegistry.STEEL_TRUSS = new BlockTurf(
      120,
      StadiumTextures.STEEL_TRUSS_BLOCK,
    );
    BlockRegistry.METAL_RAILING = new BlockTurf(
      121,
      StadiumTextures.METAL_RAILING_BLOCK,
    );
    // Stadium screens / LED boards are self-illuminating signage.
    BlockRegistry.SCOREBOARD = new BlockRedstoneLampOn(
      122,
      StadiumTextures.SCOREBOARD_SCREEN_BLOCK,
    );
    BlockRegistry.LED_BOARD_RED = new BlockRedstoneLampOn(
      123,
      StadiumTextures.LED_BOARD_RED,
    );
    BlockRegistry.LED_BOARD_PURPLE = new BlockRedstoneLampOn(
      124,
      StadiumTextures.LED_BOARD_PURPLE,
    );
    BlockRegistry.LED_TEXT_GOAL = new BlockRedstoneLampOn(
      125,
      StadiumTextures.LED_TEXT_GOAL_PANEL,
    );
    BlockRegistry.BANNER = new BlockTurf(
      126,
      StadiumTextures.DECORATIVE_BANNER_BLOCK,
    );
    // Floodlight panels emit the brightest light in the stadium.
    BlockRegistry.FLOODLIGHT = new BlockRedstoneLampOn(
      127,
      StadiumTextures.FLOODLIGHT_PANEL_BLOCK,
    );

    // Procedural tunnel-decoration blocks (textures generated at runtime in
    // src/js/net/minecraft/client/render/ProceduralTextures.js).
    BlockRegistry.TUNNEL_GLASS = new BlockTurf(
      128,
      StadiumTextures.TUNNEL_GLASS_PANEL,
    );
    BlockRegistry.TUNNEL_MARBLE = new BlockTurf(
      129,
      StadiumTextures.TUNNEL_MARBLE_FLOOR,
    );
    BlockRegistry.TUNNEL_CARPET = new BlockTurf(
      130,
      StadiumTextures.TUNNEL_RED_CARPET,
    );
    BlockRegistry.TUNNEL_ARCH = new BlockTurf(
      131,
      StadiumTextures.TUNNEL_ARCH_SEGMENT,
    );
    // Recessed ceiling downlight — must glow even when surrounded by ROOF_PANEL.
    BlockRegistry.TUNNEL_LED_RING = new BlockRedstoneLampOn(
      132,
      StadiumTextures.TUNNEL_LED_RING,
    );
    BlockRegistry.TUNNEL_SPONSOR = new BlockTurf(
      133,
      StadiumTextures.TUNNEL_SPONSOR_PANEL,
    );
    BlockRegistry.TUNNEL_TRIM = new BlockTurf(
      134,
      StadiumTextures.TUNNEL_ACCENT_TRIM,
    );
    BlockRegistry.TUNNEL_FLUTED = new BlockTurf(
      135,
      StadiumTextures.TUNNEL_FLUTED_PANEL,
    );
  }
}
