import Chunk from "/src/js/net/minecraft/client/world/Chunk.js";
import { BlockRegistry } from "/src/js/net/minecraft/client/world/block/BlockRegistry.js";
import Vector3 from "/src/js/net/minecraft/util/Vector3.js";
import NoiseGeneratorPerlin from "/src/js/net/minecraft/client/world/generator/noise/NoiseGeneratorPerlin.js";
import Random from "/src/js/net/minecraft/util/Random.js";
import TreeGenerator from "/src/js/net/minecraft/client/world/generator/structure/TreeGenerator.js";

/**
 * StadiumGenerator — Procedurally builds a FIFA-standard soccer stadium at 50% scale.
 *
 * Scale: 1 block = 2 m  →  pitch = 52 × 34 blocks, half = 26 × 17
 * Coordinate system: origin (0,0) is the pitch centre on the X–Z plane.
 * X axis = along the length of the pitch (goal to goal).
 * Z axis = across the width of the pitch (touchline to touchline).
 */
export default class StadiumGenerator {
  constructor(world, seed) {
    this.world = world;
    this.seed = seed;

    // --- Pitch dimensions (50% of FIFA standard) ---
    this.halfLength = 30;
    this.halfWidth = 21;

    // --- Goal dimensions ---
    this.goalHalfWidth = 4;
    this.goalHeight = 3; // Reduced to 3 blocks
    this.goalDepth = 3;

    // --- Stands settings ---
    this.STAND_MARGIN = 9;
    this.STAND_TIERS = 6;
    this.STAND_SLOPE = 2;
    this.STAND_AISLES = 5;

    this.seaLevel = 64;

    // Stadium footprint half-extents: how far from origin the outer wall reaches.
    // Chunks fully outside this boundary get lightweight procedural terrain.
    this._footprintHalfX =
      this.halfLength +
      this.STAND_MARGIN +
      this.STAND_TIERS * this.STAND_SLOPE +
      3;
    this._footprintHalfZ =
      this.halfWidth +
      this.STAND_MARGIN +
      this.STAND_TIERS * this.STAND_SLOPE +
      3;

    // --- Tunnel + outer vestibule geometry ---
    // The tunnel is a roofed passage that lets a player walk from outside
    // the stadium, through the south stand, onto the pitch. The vestibule
    // is the open-air entrance plaza on the OUTSIDE of the tunnel mouth,
    // bounded by perimeter railing and reached by a 4-step staircase from
    // the surrounding terrain.
    this.TUNNEL_INNER_Z = -(this.halfWidth + 2); // -23: pitch-side mouth
    this.TUNNEL_OUTER_Z = -(this._footprintHalfZ + 4); // -49: outside grand entrance
    this.TUNNEL_HALF_W = 5; // interior + roof overhang
    // Vestibule extends past the outer mouth: wider and deeper than the
    // old plaza so it reads as a proper stadium forecourt.
    this.VESTIBULE_OUTER_Z = this.TUNNEL_OUTER_Z - 9; // -58
    this.VESTIBULE_HALF_W = 11;
    this.STAIR_STEPS = 4;

    let rng = new Random(seed);
    this._heightNoise = new NoiseGeneratorPerlin(rng);
    this._treeRngBase = seed;

    // Spawn player at the OUTER tunnel mouth, looking toward the pitch (+Z).
    // The player walks through the tunnel onto the field — a proper stadium entrance.
    this.world.spawn.x = 0;
    this.world.spawn.y = this.seaLevel + 1;
    this.world.spawn.z = this.TUNNEL_OUTER_Z + 1; // just inside the outer mouth
  }

  /**
   * True if (wx, wz) falls inside the tunnel corridor.
   * Used to suppress stand seats and keep the column free for the tunnel
   * structure built by _generateTunnelGate.
   */
  _isTunnelCorridor(wx, wz) {
    return (
      wz >= this.TUNNEL_OUTER_Z &&
      wz <= this.TUNNEL_INNER_Z &&
      Math.abs(wx) <= this.TUNNEL_HALF_W
    );
  }

  _isVestibule(wx, wz) {
    return (
      wz >= this.VESTIBULE_OUTER_Z &&
      wz < this.TUNNEL_OUTER_Z &&
      Math.abs(wx) <= this.VESTIBULE_HALF_W
    );
  }

  // ---------------------------------------------------------------
  // Chunk API
  // ---------------------------------------------------------------

  newChunk(world, x, z) {
    let chunk = new Chunk(world, x, z);
    this.generateInChunk(chunk);
    return chunk;
  }

  generateInChunk(chunk) {
    let chunkX = chunk.x << 4;
    let chunkZ = chunk.z << 4;

    for (let lx = 0; lx < 16; lx++) {
      for (let lz = 0; lz < 16; lz++) {
        let wx = chunkX + lx;
        let wz = chunkZ + lz;

        if (this._isStadiumArea(wx, wz)) {
          // Stadium area: flat bedrock + dirt fill, then stadium surface
          chunk.setBlockAt(lx, 0, lz, BlockRegistry.BEDROCK.getId());
          for (let y = 1; y < this.seaLevel; y++) {
            chunk.setBlockAt(lx, y, lz, BlockRegistry.DIRT.getId());
          }
          this._setSurface(chunk, lx, wx, lz, wz);
        } else {
          // Outside stadium: Perlin-noise heightmap terrain
          this._generateOutsideTerrain(chunk, lx, wx, lz, wz);
        }

        // Goals and corner flags always check their own coordinate guards
        this._generateGoals(chunk, lx, wx, lz, wz);
        this._generateCornerFlags(chunk, lx, wx, lz, wz);
      }
    }

    chunk.generateSkylightMap();
    chunk.setModifiedAllSections();
  }

  /**
   * Returns true if (wx, wz) falls within the stadium floor area
   * (pitch + apron + stands + tunnel corridor + outer plaza). These columns
   * use the flat-fill pipeline; everywhere else falls through to Perlin terrain.
   */
  _isStadiumArea(wx, wz) {
    if (
      Math.abs(wx) <= this._footprintHalfX &&
      Math.abs(wz) <= this._footprintHalfZ
    ) {
      return true;
    }
    // Tunnel corridor extends past the south stand into outside territory.
    if (this._isTunnelCorridor(wx, wz)) return true;
    // Outer vestibule (wider entrance plaza with stairs + sponsor walls).
    if (this._isVestibule(wx, wz)) return true;
    return false;
  }

  /**
   * Returns true when the chunk does NOT overlap the stadium footprint at all.
   * Used by populateChunk to decide whether to plant trees.
   */
  _isChunkOutsideStadium(cx, cz) {
    let minX = cx * 16;
    let maxX = cx * 16 + 15;
    let minZ = cz * 16;
    let maxZ = cz * 16 + 15;
    if (maxX < -this._footprintHalfX || minX > this._footprintHalfX)
      return true;
    if (maxZ < -this._footprintHalfZ || minZ > this._footprintHalfZ)
      return true;
    return false;
  }

  // ---------------------------------------------------------------
  // Surface placement
  // ---------------------------------------------------------------

  _setSurface(chunk, lx, wx, lz, wz) {
    let sl = this.seaLevel;

    // Tunnel + plaza take priority over normal surface logic. They live in
    // the -Z corridor that punches through the south stand and continues
    // a few blocks past the stadium footprint.
    if (this._isTunnelCorridor(wx, wz)) {
      this._generateTunnelGate(chunk, lx, wx, lz, wz);
      return;
    }
    if (this._isVestibule(wx, wz)) {
      this._generateVestibule(chunk, lx, wx, lz, wz);
      return;
    }

    if (this._isOnPitch(wx, wz)) {
      // Pitch surface: markings take priority
      if (this._isPitchMarking(wx, wz)) {
        chunk.setBlockAt(lx, sl, lz, BlockRegistry.PITCH_LINE.getId());
      } else {
        // Alternating grass stripes every 5 blocks along X
        let stripe = Math.floor(Math.abs(wx) / 5) % 2;
        let block =
          stripe === 0 ? BlockRegistry.TURF_DARK : BlockRegistry.TURF_LIGHT;
        chunk.setBlockAt(lx, sl, lz, block.getId());
      }
    } else if (this._isStadiumFloor(wx, wz)) {
      // Apron between pitch edge and stands base — darker green than turf
      chunk.setBlockAt(lx, sl, lz, BlockRegistry.TURF_DARK.getId());
      this._generateStands(chunk, lx, wx, lz, wz);
    }
  }

  // ---------------------------------------------------------------
  // Geometry helpers
  // ---------------------------------------------------------------

  _isOnPitch(x, z) {
    return Math.abs(x) <= this.halfLength && Math.abs(z) <= this.halfWidth;
  }

  /**
   * Total stadium footprint = pitch + stand margin + tiers × slope
   */
  _isStadiumFloor(x, z) {
    let totalMargin =
      this.STAND_MARGIN + this.STAND_TIERS * this.STAND_SLOPE + 2;
    return (
      Math.abs(x) <= this.halfLength + totalMargin &&
      Math.abs(z) <= this.halfWidth + totalMargin
    );
  }

  // ---------------------------------------------------------------
  // Pitch markings (all at 50% FIFA scale)
  // ---------------------------------------------------------------

  _isPitchMarking(x, z) {
    const E = 0.5; // half-block epsilon for rasterising lines

    // Outer boundary lines
    if (Math.abs(Math.abs(x) - this.halfLength) < E) return true;
    if (Math.abs(Math.abs(z) - this.halfWidth) < E) return true;

    // Centre line (x = 0)
    if (Math.abs(x) < E) return true;

    // Centre circle — radius 5 (FIFA 9.15 m → ~4.5 blocks)
    let d = Math.sqrt(x * x + z * z);
    if (Math.abs(d - 5) < E) return true;

    // --- Penalty areas (both ends) ---
    // Large penalty box: 8 wide (±8 z), 8 deep from goal line
    let pBoxDepth = 8;
    let pBoxHalfW = 8;
    let inLargePenaltyX =
      Math.abs(x) >= this.halfLength - pBoxDepth &&
      Math.abs(x) <= this.halfLength;
    let inLargePenaltyZ = Math.abs(z) <= pBoxHalfW;
    if (inLargePenaltyX && inLargePenaltyZ) {
      if (Math.abs(Math.abs(x) - (this.halfLength - pBoxDepth)) < E)
        return true; // front line
      if (Math.abs(Math.abs(z) - pBoxHalfW) < E) return true; // side lines
    }

    // Small goal box: 3 wide (±3 z), 3 deep from goal line
    let gBoxDepth = 3;
    let gBoxHalfW = 3;
    let inGoalBoxX =
      Math.abs(x) >= this.halfLength - gBoxDepth &&
      Math.abs(x) <= this.halfLength;
    let inGoalBoxZ = Math.abs(z) <= gBoxHalfW;
    if (inGoalBoxX && inGoalBoxZ) {
      if (Math.abs(Math.abs(x) - (this.halfLength - gBoxDepth)) < E)
        return true;
      if (Math.abs(Math.abs(z) - gBoxHalfW) < E) return true;
    }

    // Penalty spot: 5 blocks inside goal line, centred on z = 0
    let penSpotX = this.halfLength - 5;
    if (Math.abs(Math.abs(x) - penSpotX) < E && Math.abs(z) < E) return true;

    // Penalty arc: radius 4 from penalty spot, only portion outside penalty box
    let arcSign = x >= 0 ? 1 : -1;
    let dx = Math.abs(x) - penSpotX;
    let dz = z;
    let distFromSpot = Math.sqrt(dx * dx + dz * dz);
    if (
      Math.abs(distFromSpot - 4) < E &&
      Math.abs(x) < this.halfLength - pBoxDepth
    )
      return true;

    return false;
  }

  // Corner arc function removed (redundant corner curve tile asset)

  // ---------------------------------------------------------------
  // Stands generation
  // ---------------------------------------------------------------

  /**
   * Distance from the nearest pitch edge (positive = outside pitch).
   * Uses Chebyshev-style: takes the maximum of X-distance and Z-distance.
   */
  _distFromPitchEdge(wx, wz) {
    let dX = Math.abs(wx) - this.halfLength;
    let dZ = Math.abs(wz) - this.halfWidth;
    return Math.max(dX, dZ);
  }

  _generateStands(chunk, lx, wx, lz, wz) {
    let dist = this._distFromPitchEdge(wx, wz);

    // Only build stands between margin and (margin + tiers*slope)
    if (dist < this.STAND_MARGIN) return;
    let standDist = dist - this.STAND_MARGIN; // distance into stand zone
    let tier = Math.floor(standDist / this.STAND_SLOPE); // which tier row
    if (tier >= this.STAND_TIERS) return;

    let sl = this.seaLevel;
    let height = tier + 1; // tiers 0..5 → height 1..6

    // Determine which stand face this column belongs to
    let dX = Math.abs(wx) - this.halfLength;
    let dZ = Math.abs(wz) - this.halfWidth;

    // --- Corner gaps ---
    // Giữa các góc sân không làm liền mạch mà tạo khoảng hở (diagonal gap)
    if (Math.abs(dX - dZ) <= 1) return; // 3-block wide diagonal gap at corners

    let isGoalSide = dX > dZ;

    // --- Tunnel Gate Hole ---
    // Create a hole in the south stand for the tunnel corridor to pass through.
    // The corridor covers the FULL tunnel range so spectators can't spawn on
    // seats that would be physically blocked by the tunnel structure.
    if (this._isTunnelCorridor(wx, wz)) {
      return;
    }

    // --- Side Boundary Walls (Requirement 2) ---
    let edgeDist = Math.abs(dX - dZ);
    if (edgeDist === 2) {
      // White concrete wall frame at the very edge of each stand face.
      // Stepped profile that decreases from top to bottom, exactly 1 block higher than the adjacent seats (tier + 2 high).
      let wallHeight = tier + 2;
      for (let y = 1; y <= wallHeight; y++) {
        chunk.setBlockAt(lx, sl + y, lz, BlockRegistry.PITCH_LINE.getId());
      }
      return;
    }

    // --- Normal Stand Column ---
    // Check if this column is a walkway/aisle stair marker
    let isAisle = this._isAisle(wx, wz, isGoalSide);

    // Determine seat/aisle walkway block
    let seatBlock;
    if (tier === this.STAND_TIERS - 1) {
      // Top tier is ALWAYS white border (pitch line) wrapping the entire stadium (Requirement 1)
      seatBlock = BlockRegistry.PITCH_LINE.getId();
    } else if (isAisle) {
      seatBlock = BlockRegistry.SEAT_AISLE.getId();
    } else {
      seatBlock = this._seatColour(wx, wz, isGoalSide, tier);
    }

    // Build structure under the seats/aisles
    if (tier === this.STAND_TIERS - 1) {
      for (let y = 1; y < height; y++) {
        chunk.setBlockAt(lx, sl + y, lz, BlockRegistry.PITCH_LINE.getId());
      }
    } else {
      // Build dark concrete structure under the seats/aisles
      for (let y = 1; y < height; y++) {
        chunk.setBlockAt(lx, sl + y, lz, BlockRegistry.CONCRETE_DARK.getId());
      }
    }

    // Top seat or aisle walkway block
    chunk.setBlockAt(lx, sl + height, lz, seatBlock);
  }

  /**
   * Camp Nou colour scheme:
   *   - Two SIDELINE stands (±Z): dark green (teal)
   *   - Two GOAL-END stands (±X): solid RED
   *   - Aisles: empty air (gap for realism)
   */
  _seatColour(wx, wz, isGoalSide, tier) {
    // Base colour: goal-end = red, sideline = dark green (teal)
    if (isGoalSide) {
      return BlockRegistry.SEAT_RED.getId();
    } else {
      return BlockRegistry.SEAT_GREEN.getId();
    }
  }

  /**
   * Returns true if this column falls on one of the aisle strip positions.
   * Aisles divide each stand face into 4 equal sections (3 gaps).
   */
  _isAisle(wx, wz, isGoalSide) {
    if (isGoalSide) {
      // Goal-end stand: 3 aisle strips dividing the Z span into 4 sections
      let span = this.halfWidth * 2;
      let step = Math.floor(span / 4);
      let relZ = wz + this.halfWidth;
      return relZ > 0 && relZ < span && relZ % step === 0;
    } else {
      // Sideline stand: 3 aisle strips dividing the X span into 4 sections
      let span = this.halfLength * 2;
      let step = Math.floor(span / 4);
      let relX = wx + this.halfLength;
      return relX > 0 && relX < span && relX % step === 0;
    }
  }

  // ---------------------------------------------------------------
  // Tunnel arch portal generation
  // ---------------------------------------------------------------

  /**
   * Classic-Minecraft stadium tunnel — minimal, cohesive palette.
   *
   * Per user feedback, the previous multi-material LED/neon design was
   * "phèn" (tacky). This redesign uses only vanilla-era Minecraft blocks
   * (cobblestone, wood planks, torches, glass) to fit the classic aesthetic:
   *
   *   • Floor:    PITCH_LINE   (clean white concrete underfoot).
   *   • Walls:    COBBLE_STONE (one block — classic stone brick look).
   *   • Ceiling:  WOOD planks  (warm classic Minecraft cabin/dungeon feel).
   *   • Lighting: TORCH        (the iconic vanilla light source).
   *   • Glass strip at the top of each wall as a thin clerestory.
   *
   * The outer mouth opens directly into the vestibule (no busy lintel
   * arrangement); the proper entrance gate is built by _generateVestibule.
   */
  _generateTunnelGate(chunk, lx, wx, lz, wz) {
    if (!this._isTunnelCorridor(wx, wz)) return;

    let sl = this.seaLevel;
    let absX = Math.abs(wx);

    const portalOpen = wz <= this.TUNNEL_OUTER_Z + 1; // last 2 rows: open sky

    const ROOF_Y = 5; // 4 blocks of headroom
    const WALL_TOP = ROOF_Y - 1;

    // Whole tunnel interior — floor, walls, ceiling — is REDSTONE_LAMP_ON
    // so the corridor reads as a warm luminous passage end-to-end. Single
    // block type for the whole tube, completely classic-vanilla aesthetic.
    const LAMP = BlockRegistry.REDSTONE_LAMP_ON.getId();

    // ----- FLOOR -----
    if (absX <= 4) {
      chunk.setBlockAt(lx, sl, lz, LAMP);
    }

    // ----- WALLS -----
    if (absX === 4 && !portalOpen) {
      for (let y = 1; y <= WALL_TOP; y++) {
        chunk.setBlockAt(lx, sl + y, lz, LAMP);
      }
    }

    // ----- CEILING -----
    if (absX <= 4 && !portalOpen) {
      chunk.setBlockAt(lx, sl + ROOF_Y, lz, LAMP);
    }
  }

  /**
   * Outer vestibule + classic stone entrance gate.
   *
   * Replaces the previous stairs + billboards + railing mess with a calm
   * pitch-line plaza and one proper arched COBBLESTONE gate at the outer
   * end. Torches flank the gate for atmospheric lighting.
   */
  _generateVestibule(chunk, lx, wx, lz, wz) {
    let sl = this.seaLevel;
    let absX = Math.abs(wx);

    // ----- PLAZA FLOOR -----
    // Centre path of red carpet runs from the tunnel mouth to the gate so the
    // approach reads as a clear corridor instead of an empty courtyard.
    // Surrounded by pitch-line (white) on either side.
    const isPath = absX <= 2;
    chunk.setBlockAt(
      lx,
      sl,
      lz,
      isPath
        ? BlockRegistry.SEAT_RED.getId()
        : BlockRegistry.PITCH_LINE.getId(),
    );

    // ----- CONCEPT #1: ROMAN TRIUMPHAL ARCH (Arch of Constantine) -----
    // 13 wide × 8 tall stone facade at the outer mouth.
    //
    //   wx:  -6 -5 -4 -3 -2 -1  0  1  2  3  4  5  6     (13 cols)
    //   y=8   .  .  .  .  .  .  .  .  .  .  .  .  .
    //   y=7   A  A  A  A  A  A  A  A  A  A  A  A  A    attic story (PITCH_LINE)
    //   y=6   B  B  B  B  B  B  B  B  B  B  B  B  B    main lintel (COBBLE)
    //   y=5   B  B  B  B  .  .  .  .  .  B  B  B  B    central opening
    //   y=4   B  N  N  B  .  .  .  .  .  B  N  N  B    side niches at y=4 (DARK)
    //   y=3   B  .  .  B  .  .  .  .  .  B  .  .  B    side openings 2w × 3h
    //   y=2   B  .  .  B  .  .  .  .  .  B  .  .  B
    //   y=1   B  .  .  B  .  .  .  .  .  B  .  .  B
    //         ^pillar    ^pier            ^pier ^pillar
    //
    //   • Outer pillars wx = ±6, height 1..7 (COBBLE_STONE)
    //   • Pier dividers wx = ±3, height 1..7 (COBBLE_STONE) — split central
    //     opening from the two side openings.
    //   • Central opening |wx| ≤ 2, y ∈ [1..5] = AIR (5w × 5h main passage).
    //   • Side openings  wx ∈ {-5,-4} and {4,5}, y ∈ [1..3] = AIR.
    //   • Side niches: relief blocks at y=4 over the side openings (CONCRETE_DARK).
    //   • Main lintel y=6 spans full width.
    //   • Attic story y=7 in PITCH_LINE (lighter top course).
    //   • Crown lamps at y=8 over wx ∈ {-3, 0, 3} (REDSTONE_LAMP_ON).
    if (wz === this.VESTIBULE_OUTER_Z && absX <= 6) {
      const isCenterOpen = absX <= 2 && wz === this.VESTIBULE_OUTER_Z;
      const isSideOpen = absX === 4 || absX === 5;
      const isPier = absX === 3 || absX === 6;
      const isNiche = isSideOpen; // marker for the y=4 inset row

      // Y = 1..5: opening pattern
      for (let y = 1; y <= 5; y++) {
        if (y <= 3 && (isCenterOpen || isSideOpen)) {
          // Air for both central + side passages.
          continue;
        }
        if (y === 4 && isCenterOpen) continue; // still air in centre
        if (y === 5 && isCenterOpen) continue; // top of central arch
        if (y === 4 && isNiche) {
          // Side-arch niche — dark relief inset above the side openings.
          chunk.setBlockAt(lx, sl + y, lz, BlockRegistry.CONCRETE_DARK.getId());
          continue;
        }
        // Everything else at y ≤ 5 in this row is stone facade.
        chunk.setBlockAt(lx, sl + y, lz, BlockRegistry.COBBLE_STONE.getId());
      }

      // Main lintel — full width at y=6.
      chunk.setBlockAt(lx, sl + 6, lz, BlockRegistry.COBBLE_STONE.getId());

      // Attic story at y=7 — lighter stone for visual hierarchy.
      chunk.setBlockAt(lx, sl + 7, lz, BlockRegistry.PITCH_LINE.getId());

      // Crown lamps at y=8 above the three pier/pillar centres for nighttime
      // illumination of the arch.
      if (wx === -3 || wx === 0 || wx === 3) {
        chunk.setBlockAt(
          lx,
          sl + 8,
          lz,
          BlockRegistry.REDSTONE_LAMP_ON.getId(),
        );
      }
    }
  }

  // ---------------------------------------------------------------
  // Goal generation
  // ---------------------------------------------------------------

  _generateGoals(chunk, lx, wx, lz, wz) {
    // Process both goal ends
    this._buildGoalAt(chunk, lx, wx, lz, wz, +this.halfLength, +1); // right goal (+X)
    this._buildGoalAt(chunk, lx, wx, lz, wz, -this.halfLength, -1); // left  goal (-X)
  }

  /**
   * Builds one goal frame + net at the given goalLineX.
   * @param {number} goalLineX  - X coordinate of the goal line
   * @param {number} dir        - direction the net extends behind the goal (+1 or -1)
   */
  _buildGoalAt(chunk, lx, wx, lz, wz, goalLineX, dir) {
    let sl = this.seaLevel;
    let hw = this.goalHalfWidth; // ±4 z
    let h = this.goalHeight; // 3 blocks tall
    let dep = this.goalDepth; // 3 blocks net depth
    let netBlock = BlockRegistry.GOAL_NET.getId(); // Custom Goal Net texture

    // Determine if wx is inside the goal depth
    let d = (wx - goalLineX) * dir; // Distance behind goal line

    if (d === 0) {
      // --- Goal posts & crossbar ---
      if (Math.abs(wz) === hw) {
        // Vertical posts
        for (let y = 1; y <= h; y++) {
          chunk.setBlockAt(lx, sl + y, lz, BlockRegistry.GOAL_POST.getId());
        }
      } else if (Math.abs(wz) < hw) {
        // Crossbar
        chunk.setBlockAt(lx, sl + h, lz, BlockRegistry.GOAL_POST.getId());
      }
    } else if (d > 0 && d <= dep) {
      // --- Sloping Net ---
      // The net slopes downwards: at depth d, the roof is at height h - d + 1
      // e.g., h=3: d=1 -> y=3; d=2 -> y=2; d=3 -> y=1.
      let roofY = h - d + 1;

      if (Math.abs(wz) === hw) {
        // Side walls of the net
        for (let y = 1; y <= roofY; y++) {
          chunk.setBlockAt(lx, sl + y, lz, netBlock);
        }
      } else if (Math.abs(wz) < hw) {
        // Sloped back / roof of the net
        if (roofY >= 1) {
          chunk.setBlockAt(lx, sl + roofY, lz, netBlock);
        }
        // If it's the very back of the net (d === dep), fill the vertical space down to the ground
        if (d === dep) {
          for (let y = 1; y < roofY; y++) {
            chunk.setBlockAt(lx, sl + y, lz, netBlock);
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------
  // Corner flags
  // ---------------------------------------------------------------

  _generateCornerFlags(chunk, lx, wx, lz, wz) {
    // 4 corner positions exactly on the pitch corners
    let corners = [
      [+this.halfLength, +this.halfWidth],
      [+this.halfLength, -this.halfWidth],
      [-this.halfLength, +this.halfWidth],
      [-this.halfLength, -this.halfWidth],
    ];

    for (let [cx, cz] of corners) {
      if (wx === cx && wz === cz) {
        // White pole (2 blocks tall)
        chunk.setBlockAt(
          lx,
          this.seaLevel + 1,
          lz,
          BlockRegistry.CORNER_FLAG.getId(),
        );
        chunk.setBlockAt(
          lx,
          this.seaLevel + 2,
          lz,
          BlockRegistry.CORNER_FLAG.getId(),
        );
        // Red triangular-like flag at the top
        chunk.setBlockAt(
          lx,
          this.seaLevel + 3,
          lz,
          BlockRegistry.FLAG_TOP.getId(),
        );
      }
    }
  }

  // ---------------------------------------------------------------
  // Required API
  // ---------------------------------------------------------------

  populateChunk(x, z) {
    // Only plant trees outside the stadium boundary.
    if (!this._isChunkOutsideStadium(x, z)) return;

    // Deterministic per-chunk seed so the same chunk always gets the same trees.
    let chunkSeed = (x * 341873128712 + z * 132897987541) ^ this._treeRngBase;
    let rng = new Random(chunkSeed);

    let absX = x * 16;
    let absZ = z * 16;

    // Plant 3-6 trees per chunk at random positions within the chunk
    let count = 3 + rng.nextInt(4);
    for (let i = 0; i < count; i++) {
      let wx = absX + rng.nextInt(16);
      let wz = absZ + rng.nextInt(16);
      // Find the top block height for this column
      let wy = this.world.getHeightAt(wx, wz);
      // TreeGenerator checks internally that the soil is grass/dirt
      new TreeGenerator(this.world, chunkSeed + i).generateAtBlock(wx, wy, wz);
    }
  }

  // ---------------------------------------------------------------
  // Outside-stadium terrain generation
  // ---------------------------------------------------------------

  /**
   * Fills a single world column at (wx, wz) with Perlin-noise heightmap terrain.
   *
   * Uses one NoiseGeneratorPerlin layer (output ≈ [-1, 1]) scaled by 0.05
   * to produce smooth hills ±10 blocks from sea level.
   *
   * Column layout (top → bottom):
   *   terrainH      → GRASS
   *   terrainH-1..3 → DIRT  (3 blocks)
   *   1..terrainH-4 → STONE
   *   0             → BEDROCK
   */
  _generateOutsideTerrain(chunk, lx, wx, lz, wz) {
    // Single Perlin call — output in approximately [-1, 1]
    let noise = this._heightNoise.perlin(wx * 0.05, wz * 0.05);

    // Map noise to world height: seaLevel ± 10 blocks
    let terrainH = this.seaLevel + Math.round(noise * 10);

    // Clamp so we stay in a valid chunk range
    terrainH = Math.max(2, Math.min(120, terrainH));

    // Bedrock at the bottom
    chunk.setBlockAt(lx, 0, lz, BlockRegistry.BEDROCK.getId());

    // Stone fill from layer 1 up to 3 blocks below surface
    let stoneTop = Math.max(1, terrainH - 3);
    for (let y = 1; y < stoneTop; y++) {
      chunk.setBlockAt(lx, y, lz, BlockRegistry.STONE.getId());
    }

    // Dirt sub-surface (3 blocks)
    for (let y = stoneTop; y < terrainH; y++) {
      chunk.setBlockAt(lx, y, lz, BlockRegistry.DIRT.getId());
    }

    // Grass on top
    chunk.setBlockAt(lx, terrainH, lz, BlockRegistry.GRASS.getId());
  }

  getSeed() {
    return this.seed;
  }

  getSeaLevel() {
    return this.seaLevel;
  }
}
