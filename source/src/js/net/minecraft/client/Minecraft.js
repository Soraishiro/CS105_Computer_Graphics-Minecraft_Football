import Timer from "../util/Timer.js";
import GameSettings from "./GameSettings.js";
import GameWindow from "./GameWindow.js";
import WorldRenderer from "./render/WorldRenderer.js";
import ScreenRenderer from "./render/gui/ScreenRenderer.js";
import ItemRenderer from "./render/gui/ItemRenderer.js";
import IngameOverlay from "./gui/overlay/IngameOverlay.js";
import SoundManager from "./sound/SoundManager.js";
import Block from "./world/block/Block.js";
import BoundingBox from "../util/BoundingBox.js";
import { BlockRegistry } from "./world/block/BlockRegistry.js";
import FontRenderer from "./render/gui/FontRenderer.js";
import GrassColorizer from "./render/GrassColorizer.js";
import GuiMainMenu from "./gui/screens/GuiMainMenu.js";
import GuiLoadingScreen from "./gui/screens/GuiLoadingScreen.js";
import { getLoadingOverlay } from "./gui/LoadingOverlay.js";
import * as THREE from "../../../../../libraries/three.module.js";
import ParticleRenderer from "./render/particle/ParticleRenderer.js";
import GuiChat from "./gui/screens/GuiChat.js";
import CommandHandler from "./command/CommandHandler.js";
import GuiContainerCreative from "./gui/screens/container/GuiContainerCreative.js";
import GameProfile from "../util/GameProfile.js";
import UUID from "../util/UUID.js";
import FocusStateType from "../util/FocusStateType.js";
import Session from "../util/Session.js";
import BallEntity from "/src/js/net/minecraft/client/entity/BallEntity.js";
import PlayerEntity from "/src/js/net/minecraft/client/entity/PlayerEntity.js";
import PlayerControllerMultiplayer from "./network/controller/PlayerControllerMultiplayer.js";
import World from "./world/World.js";
import ChunkProviderGenerate from "./world/provider/ChunkProviderGenerate.js";
import PlayerController from "./network/controller/PlayerController.js";
import Random from "../util/Random.js";
import Long from "../../../../../libraries/long.js";

export default class Minecraft {
  static VERSION = "1.1.8";
  static URL_GITHUB = "https://github.com/labystudio/js-minecraft";
  static PROTOCOL_VERSION = 47; //758;

  // TODO Add to settings
  static PROXY = {
    url: "wss://socket.labystudio.de/minecraft/",
  };

  /**
   * Create Minecraft instance and render it on a canvas
   */
  constructor(canvasWrapperId, resources) {
    this.resources = resources;

    this.currentScreen = null;
    this.loadingScreen = null;
    this.world = null;
    this.player = null;
    this.playerController = null;
    this.fps = 0;
    this.maxFps = 0;

    // Tick timer
    this.timer = new Timer(20);

    this.settings = new GameSettings();
    this.settings.load();

    // Load session from settings
    if (this.settings.session === null) {
      let username = "Player" + Math.floor(Math.random() * 100);
      let profile = new GameProfile(UUID.randomUUID(), username);
      this.setSession(new Session(profile, ""));
    } else {
      this.setSession(Session.fromJson(this.settings.session));
    }

    // Create window and world renderer
    this.window = new GameWindow(this, canvasWrapperId);

    // Create renderers
    this.worldRenderer = new WorldRenderer(this, this.window);
    this.screenRenderer = new ScreenRenderer(this, this.window);
    this.itemRenderer = new ItemRenderer(this, this.window);

    // Create current screen and overlay
    this.ingameOverlay = new IngameOverlay(this, this.window);

    // Command handler
    this.commandHandler = new CommandHandler(this);

    this.frames = 0;
    this.lastTime = Date.now();

    // Create all blocks
    BlockRegistry.create();

    this.itemRenderer.initialize();

    // Create font renderer
    this.fontRenderer = new FontRenderer(this);

    // Grass colorizer
    this.grassColorizer = new GrassColorizer(this);

    this.particleRenderer = new ParticleRenderer(this);

    // Update window size
    this.window.updateWindowSize();

    // Create sound manager
    this.soundManager = new SoundManager();

    // Show main menu on startup
    this.displayScreen(new GuiMainMenu());

    // Texture + atlas + engine boot done — hide the HTML loading overlay
    // so the user sees the main menu. It will be re-shown when the
    // singleplayer world starts loading.
    getLoadingOverlay().hide();

    // Initialize
    this.init();
  }

  startSingleplayerStadium() {
    let seed = Long.fromNumber(105); // Constant seed for consistent stadium placement
    let world = new World(this);
    world.setChunkProvider(new ChunkProviderGenerate(world, seed));
    world.getChunkProvider().findSpawn();

    this.playerController = new PlayerController(this);
    this.loadWorld(world);
  }

  init() {
    // Start render loop
    this.running = true;
    this.requestNextFrame();
  }

  loadWorld(world) {
    if (world === null) {
      this.worldRenderer.reset();
      this.itemRenderer.reset();

      // Disconnect from server
      if (this.playerController instanceof PlayerControllerMultiplayer) {
        let networkHandler = this.playerController.getNetworkHandler();
        if (networkHandler.getNetworkManager().isConnected()) {
          networkHandler.getNetworkManager().close();
        }

        // Reset header and footer
        this.ingameOverlay.playerListOverlay.setHeader(null);
        this.ingameOverlay.playerListOverlay.setFooter(null);
      }
      this.playerController = null;

      if (this.world !== null) {
        this.world.getChunkProvider().getChunks().clear();
        this.world.clearEntities();
        this.world = null;
        this.player = null;
        this.loadingScreen = null;
      }
      this.displayScreen(new GuiMainMenu());
    } else {
      // Re-arm the HTML overlay for the world-load phase. The boot stages
      // (textures/atlas/boot) have already been consumed and hidden after
      // the main menu appeared, so we start a fresh weighted pipeline here.
      const overlay = getLoadingOverlay();
      overlay.setStages([
        { id: "world", label: "Building terrain", weight: 65 },
        { id: "entities", label: "Loading spectators", weight: 30 },
        { id: "finalize", label: "Entering the stadium", weight: 5 },
      ]);
      overlay.show();
      overlay.beginStage("world");
      overlay.setHint("Streaming chunks around the pitch…");

      // Display loading screen
      this.loadingScreen = new GuiLoadingScreen();
      this.loadingScreen.setTitle("Streaming chunks around the pitch…");
      this.displayScreen(this.loadingScreen);

      // Clear previous world
      if (this.world !== null) {
        this.world.getChunkProvider().getChunks().clear();
        this.world.clearEntities();
        this.worldRenderer.reset();
        this.itemRenderer.reset();
      }

      // Create world
      this.world = world;
      this.worldRenderer.scene.add(this.world.group);

      // Create player
      this.player = this.playerController.createPlayer(this.world);
      this.player.username = this.session.getProfile().getUsername();
      this.world.addEntity(this.player);

      // --- Setup Stadium Spectators Pre-calculation ---
      // Plain mob type names matching local vanilla textures in src/resources/mob/
      const MOB_NAMES = [
        "cow",
        "pig",
        "sheep",
        "chicken",
        "wolf",
        "ocelot",
        "villager",
        "creeper",
        "enderman",
        "zombie",
        "skeleton",
        "squid",
        "slime",
        "magmacube",
      ];

      // Stadium geometry constants — must match StadiumGenerator
      let sl = 64; // base Y of stadium surface
      let halfLength = 30; // half-length along X (goal sides)
      let halfWidth = 21; // half-width along Z (side stands)
      let STAND_MARGIN = 9;
      let STAND_TIERS = 6;
      let STAND_SLOPE = 2;

      // Tunnel corridor extent — must match StadiumGenerator's TUNNEL_*.
      // The corridor punches through the south stand from the pitch edge all
      // the way out past the footprint, so no seats (and no spectators) live
      // inside it.
      let footprintZ = halfWidth + STAND_MARGIN + STAND_TIERS * STAND_SLOPE + 3; // 45
      let TUNNEL_INNER_Z = -(halfWidth + 2); // -23
      let TUNNEL_OUTER_Z = -(footprintZ + 4); // -49
      let TUNNEL_HALF_W = 5;

      // Scan ALL FOUR stands. The seat/wall/aisle filters must mirror
      // StadiumGenerator._generateStands so spectators only land on real seat blocks.
      let seatPositions = [];
      let footprintX =
        halfLength + STAND_MARGIN + STAND_TIERS * STAND_SLOPE + 3;
      // footprintZ already declared above with the tunnel constants.

      for (let wx = -footprintX; wx <= footprintX; wx++) {
        for (let wz = -footprintZ; wz <= footprintZ; wz++) {
          let dX = Math.abs(wx) - halfLength;
          let dZ = Math.abs(wz) - halfWidth;
          let dist = Math.max(dX, dZ); // Chebyshev distance from pitch edge

          // Must be inside the stand zone, but not the top border row
          if (dist < STAND_MARGIN) continue;
          let standDist = dist - STAND_MARGIN;
          let tier = Math.floor(standDist / STAND_SLOPE);
          if (tier >= STAND_TIERS - 1) continue;

          // Diagonal corner gap — matches StadiumGenerator line 260
          if (Math.abs(dX - dZ) <= 1) continue;

          let isGoalSide = dX > dZ;

          // Tunnel corridor on the south side — matches StadiumGenerator's
          // _isTunnelCorridor. The corridor now runs the full length of the
          // tunnel so spectators don't spawn where the tunnel structure
          // would physically occlude them from the pitch.
          if (
            wz >= TUNNEL_OUTER_Z &&
            wz <= TUNNEL_INNER_Z &&
            Math.abs(wx) <= TUNNEL_HALF_W
          ) {
            continue;
          }

          // Side boundary walls — matches StadiumGenerator line 272 (edgeDist === 2)
          if (Math.abs(dX - dZ) === 2) continue;

          // Walkway aisles per stand face
          let isAisle;
          if (isGoalSide) {
            let span = halfWidth * 2;
            let step = Math.floor(span / 4);
            let relZ = wz + halfWidth;
            isAisle = relZ > 0 && relZ < span && relZ % step === 0;
          } else {
            let span = halfLength * 2;
            let step = Math.floor(span / 4);
            let relX = wx + halfLength;
            isAisle = relX > 0 && relX < span && relX % step === 0;
          }
          if (isAisle) continue;

          // Yaw so each mob faces the pitch centre. EntityRenderer applies a
          // hard-coded +180° at render time (this.group.rotation.y = -body+180);
          // we pre-compensate by setting the OPPOSITE world yaw here so the
          // final rendered facing lands on the pitch instead of away from it.
          let yawAngle;
          if (isGoalSide) {
            yawAngle = wx > 0 ? 90 : 270; // east stand faces -X, west stand faces +X
          } else {
            yawAngle = wz > 0 ? 180 : 0; // north stand faces -Z, south stand faces +Z
          }

          let height = tier + 1;
          seatPositions.push({
            x: wx + 0.5, // centre of block
            y: sl + height + 1, // feet on top surface of seat block
            z: wz + 0.5,
            yawAngle: yawAngle,
            tier: tier, // 0 = front row, higher = back rows
            wx: wx, // integer block coords for spacing-conflict checks
            wz: wz,
            isGoalSide: isGoalSide,
          });
        }
      }

      // Deterministic Fisher–Yates shuffle so spacing is even and reproducible.
      // Sampling ~50% of seats naturally produces visible gaps between mobs
      // instead of the solid wall you get when every seat is filled.
      let rng = new Random(0x5eed5eed);
      for (let i = seatPositions.length - 1; i > 0; i--) {
        let j = rng.nextInt(i + 1);
        let tmp = seatPositions[i];
        seatPositions[i] = seatPositions[j];
        seatPositions[j] = tmp;
      }

      // Greedy minimum-spacing sampler. Random fill at any percentage still
      // produces adjacent same-tier mobs by chance, which read as visual
      // clumps ("dính chùm"). To guarantee no two mobs ever sit on touching
      // seat blocks within the same tier, we walk the shuffled list and
      // accept a seat only when none of its 8 neighbours in the same tier
      // are already occupied. This produces a clean checkerboard-ish layout
      // with predictable gaps between mobs.
      const MAX_SPECTATORS = 500;
      const occupied = new Set(); // "wx,wz,tier" of already-accepted seats
      // Per-stand-face Z-step direction so the "directly behind on next tier"
      // check works on all four stands. Each stand has tiers stepping AWAY
      // from the pitch — that's +z for north stand, -z for south, etc.
      const stepDirZ = (wz) => (wz > 0 ? +2 : wz < 0 ? -2 : 0);
      const stepDirX = (wx) => (wx > 0 ? +2 : wx < 0 ? -2 : 0);
      const conflicts = (wx, wz, tier, isGoalSide) => {
        // (1) Same-tier 8-neighbour spacing — no touching mobs in a row.
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            if (dx === 0 && dz === 0) continue;
            if (occupied.has(`${wx + dx},${wz + dz},${tier}`)) return true;
          }
        }
        // (2) Same-column tier-above check — don't put a mob directly in
        // front of an already-placed mob on the next-back tier, otherwise
        // the back mob's face peeks through the front mob's leg gap from
        // the pitch-side camera angle.
        const backDz = isGoalSide ? 0 : stepDirZ(wz);
        const backDx = isGoalSide ? stepDirX(wx) : 0;
        if (occupied.has(`${wx + backDx},${wz + backDz},${tier + 1}`)) {
          return true;
        }
        return false;
      };
      let selectedSeats = [];
      for (const seat of seatPositions) {
        if (selectedSeats.length >= MAX_SPECTATORS) break;
        if (conflicts(seat.wx, seat.wz, seat.tier, seat.isGoalSide)) continue;
        occupied.add(`${seat.wx},${seat.wz},${seat.tier}`);
        selectedSeats.push(seat);
      }

      // Per-tier mob pools — each tier holds 4-6 compatible mob types so the
      // crowd has variety along every row (instead of an entire back row of
      // identical endermen). Adjacent tiers overlap so the height transition
      // reads smoothly. Tall mobs (enderman, skeleton, zombie, villager) are
      // still preferred near the back; small mobs (chicken, slime, magmacube,
      // ocelot) near the front.
      // Slime and magmacube are excluded everywhere — their single-cube
      // model has no face/eye detail and reads as a plain coloured block,
      // not a creature. Only mobs with a recognisable creature silhouette
      // are used as spectators.
      const TIER_POOLS = [
        // Tier 0 (front row): small upright shapes only — no horizontal
        // quadrupeds whose 4-deep body becomes an unreadable slab from a
        // low camera angle.
        ["chicken", "chicken", "pig"],
        // Tier 1: small-medium quadrupeds
        ["pig", "wolf", "ocelot", "chicken", "cow"],
        // Tier 2: medium mobs
        ["cow", "sheep", "squid", "creeper", "pig", "wolf"],
        // Tier 3: medium-tall humanoids
        ["villager", "zombie", "skeleton", "creeper", "sheep", "cow"],
        // Tier 4 (back row): tallest — mixed so endermen aren't 100% of it
        ["enderman", "skeleton", "zombie", "villager"],
      ];
      selectedSeats.sort((a, b) => a.tier - b.tier);

      // Deterministic per-tier round-robin cursor (no Math.random() so spawn
      // is reproducible across reloads).
      const tierCursor = [0, 0, 0, 0, 0];
      function pickMobForTier(seatTier) {
        const cap = TIER_POOLS.length - 1;
        const t = Math.max(0, Math.min(cap, seatTier));
        const pool = TIER_POOLS[t];
        const name = pool[tierCursor[t] % pool.length];
        tierCursor[t]++;
        return name;
      }

      let spectatorsToSpawn = [];
      for (let i = 0; i < selectedSeats.length; i++) {
        let seat = selectedSeats[i];
        let mobName = pickMobForTier(seat.tier);
        spectatorsToSpawn.push({
          x: seat.x,
          y: seat.y,
          z: seat.z,
          mobName: mobName,
          yawAngle: seat.yawAngle,
        });
      }

      // Spawned synchronously inside the loadSpawnChunksAsync completion callback,
      // so all spectators are present before the loading screen dismisses.
      this.pendingSpectators = spectatorsToSpawn;

      this.world.loadSpawnChunksAsync(
        (progress) => {
          if (this.loadingScreen !== null) {
            this.loadingScreen.setProgress(progress);
          }
        },
        () => {
          overlay.completeStage();
          overlay.beginStage("entities");
          overlay.setHint("Players warming up on the pitch…");

          // Initialize stadium spotlights pointing to the pitch center
          this.worldRenderer.setupStadiumLights();

          this.player.respawn();

          // Face toward the pitch (+Z direction) from inside the tunnel.
          this.player.rotationYaw = 180;
          this.player.prevRotationYaw = 180;

          // Spawn football
          let ball = new BallEntity(this, this.world, 100);
          ball.setPosition(0, 70, 0);
          this.world.addEntity(ball);

          // Spawn substitutions — first 3 = Barcelona (left), next 3 = Real Madrid (right)
          for (let i = 0; i < 6; i++) {
            let sub = new PlayerEntity(this, this.world, 200 + i);
            sub.username = "Sub " + (i + 1);
            let x = i < 3 ? -4.5 - i * 1.5 : 4.5 + (i - 3) * 1.5;
            let z = -20;
            sub.setPosition(x, this.world.getHeightAt(x, z), z);
            sub.rotationYaw = 0;
            if (i < 3) {
              sub.isBarcelona = true;
            } else {
              sub.isRealMadrid = true;
            }
            this.world.addEntity(sub);
          }

          // Spawn referee in the middle of the pitch
          let referee = new PlayerEntity(this, this.world, 300);
          referee.username = "Referee";
          referee.isReferee = true;
          let refY = this.world.getHeightAt(0, 0);
          referee.setPosition(0, refY, 0);
          referee.rotationYaw = 90;
          referee.prevRotationYaw = 90;
          this.world.addEntity(referee);

          if (this.loadingScreen !== null) {
            this.loadingScreen.setTitle("Filling the stands…");
          }
          overlay.setHint("Filling the stands…");

          // Batched, non-blocking spectator spawn. setTimeout(_, 0) yields
          // to the event loop after each batch so the progress bar repaints
          // instead of freezing on a single big synchronous loop.
          this._batchSpawnSpectators().then(() => {
            overlay.completeStage();
            overlay.beginStage("finalize");
            overlay.setHint("Welcome to the stadium!");

            // Give the renderer one frame to settle so the first visible
            // frame after the overlay fades isn't blank.
            requestAnimationFrame(() => {
              overlay.completeStage();
              overlay.hide();
              this.displayScreen(null);
              this.loadingScreen = null;
            });
          });
        },
      );
    }
  }

  /**
   * Spawn the queued spectators in batches across animation frames.
   *
   * Spawning 600 entities in one synchronous tick freezes the main thread
   * for ~300ms and prevents the progress bar from advancing. Yielding via
   * setTimeout after each batch lets the browser repaint and keeps the
   * loading UI alive even on slower machines.
   */
  _batchSpawnSpectators() {
    return new Promise((resolve) => {
      const overlay = getLoadingOverlay();
      const list = this.pendingSpectators || [];
      if (list.length === 0) {
        resolve();
        return;
      }
      const BATCH_SIZE = 60;
      let i = 0;
      const tick = () => {
        const end = Math.min(i + BATCH_SIZE, list.length);
        for (; i < end; i++) {
          const spec = list[i];
          const spectator = new PlayerEntity(this, this.world, 400 + i);
          spectator.username = spec.mobName;
          spectator.isSpectator = true;
          spectator.setPosition(spec.x, spec.y, spec.z);
          spectator.rotationYaw = spec.yawAngle;
          spectator.prevRotationYaw = spec.yawAngle;
          spectator.rotationYawHead = spec.yawAngle;
          spectator.prevRotationYawHead = spec.yawAngle;
          this.world.addEntity(spectator);
        }
        overlay.setStageFraction(i / list.length);
        if (i < list.length) {
          setTimeout(tick, 0);
        } else {
          this.pendingSpectators = null;
          resolve();
        }
      };
      tick();
    });
  }

  hasInGameFocus() {
    return this.window.isLocked() && this.currentScreen === null;
  }

  isInGame() {
    return (
      this.world !== null && this.worldRenderer !== null && this.player !== null
    );
  }

  addMessageToChat(message) {
    this.ingameOverlay.chatOverlay.addMessage(message);
  }

  requestNextFrame() {
    requestAnimationFrame(() => {
      if (this.running) {
        this.requestNextFrame();
        this.onLoop();
      }
    });
  }

  onLoop() {
    // Update the timer
    if (this.isPaused() && this.isInGame()) {
      let prevPartialTicks = this.timer.partialTicks;
      this.timer.advanceTime();
      this.timer.partialTicks = prevPartialTicks;
    } else {
      this.timer.advanceTime();
    }

    // Call the tick to reach updates 20 per seconds
    for (let i = 0; i < this.timer.ticks; i++) {
      this.onTick();
    }

    // Render the game
    this.onRender(this.timer.partialTicks);

    // Increase rendered frame
    this.frames++;

    // Loop if a second passed
    while (Date.now() >= this.lastTime + 1000) {
      this.fps = this.frames;
      this.maxFps = Math.max(this.maxFps, this.fps);
      this.lastTime += 1000;
      this.frames = 0;
    }
  }

  onRender(partialTicks) {
    if (this.isInGame()) {
      // Player rotation
      if (this.hasInGameFocus()) {
        let deltaX = this.window.pullMouseMotionX();
        let deltaY = this.window.pullMouseMotionY();
        this.player.turn(deltaX, deltaY);
      }

      // Update lights
      while (this.world.updateLights()) {
        // Empty
      }

      // Render the game
      if (this.isInGame() && !this.isPaused()) {
        this.worldRenderer.render(partialTicks);
      }
    }

    // Render items in GUI
    this.itemRenderer.render(partialTicks);

    // Render current screen
    this.screenRenderer.render(partialTicks);
  }

  displayScreen(screen) {
    if (screen === this.currentScreen) {
      return;
    }

    if (typeof screen === "undefined") {
      console.error("Tried to display an undefined screen");
      return;
    }

    // Fallback screen
    if (screen === null && !this.isInGame()) {
      screen = new GuiMainMenu();
    }

    // Close previous screen
    if (this.currentScreen !== null) {
      this.currentScreen.onClose();
    }

    // Switch screen
    this.currentScreen = screen;

    // Update window size
    this.window.updateWindowSize();

    // Initialize new screen
    if (screen === null) {
      this.window.updateFocusState(FocusStateType.REQUEST_LOCK);
    } else {
      this.window.updateFocusState(FocusStateType.REQUEST_EXIT);
      screen.setup(this, this.window.width, this.window.height);
    }

    // Update items
    this.itemRenderer.rebuildAllItems();
  }

  onTick() {
    if (this.isInGame() && !this.isPaused()) {
      // Tick overlay
      this.ingameOverlay.onTick();

      // Tick world
      this.world.onTick();

      // Tick renderer
      this.worldRenderer.onTick();

      // Tick particle renderer
      this.particleRenderer.onTick();
    }

    // Tick the screen
    if (this.currentScreen !== null) {
      this.currentScreen.updateScreen();
    }

    // Update loading progress
    if (this.loadingScreen !== null && this.isInGame()) {
      let cameraChunkX = Math.floor(this.player.x) >> 4;
      let cameraChunkZ = Math.floor(this.player.z) >> 4;

      let renderDistance = this.settings.viewDistance;
      let requiredChunks = this.isSingleplayer()
        ? Math.pow(renderDistance * 2 - 1, 2)
        : 1;
      let loadedChunks = this.world.getChunkProvider().getChunks().size;

      // Load chunks and count
      setTimeout(() => {
        for (let x = -renderDistance + 1; x < renderDistance; x++) {
          for (let z = -renderDistance + 1; z < renderDistance; z++) {
            this.world.getChunkAt(cameraChunkX + x, cameraChunkZ + z);
          }
        }
      }, 0);

      // Update progress
      let progress =
        (1 / requiredChunks) *
        Math.max(0, loadedChunks - this.world.lightUpdateQueue.length / 1000);
      this.loadingScreen.setProgress(progress);

      // Finish loading
      if (progress >= 0.99) {
        this.loadingScreen = null;
        this.displayScreen(null);
      }
    }
  }

  onKeyPressed(button) {
    // Select slot
    for (let i = 1; i <= 9; i++) {
      if (button === "Digit" + i) {
        this.player.inventory.selectedSlotIndex = i - 1;
      }
    }

    // Toggle perspective
    if (button === this.settings.keyTogglePerspective) {
      this.settings.thirdPersonView = (this.settings.thirdPersonView + 1) % 3;
      this.settings.save();
    }

    // Open chat
    if (button === this.settings.keyOpenChat) {
      this.displayScreen(new GuiChat(this));
      this.ingameOverlay.chatOverlay.setDirty();
    }

    // Toggle debug overlay
    if (button === "F3") {
      this.settings.debugOverlay = !this.settings.debugOverlay;
      this.settings.save();
    }

    // Open inventory
    if (button === this.settings.keyOpenInventory) {
      this.displayScreen(new GuiContainerCreative(this.player));
    }
  }

  onMouseClicked(button) {
    if (this.window.isLocked()) {
      let hitResult = this.player.rayTrace(5, this.timer.partialTicks);

      // Destroy block
      if (button === 0) {
        if (hitResult != null) {
          // Get previous block
          let typeId = this.world.getBlockAt(
            hitResult.x,
            hitResult.y,
            hitResult.z,
          );
          let block = Block.getById(typeId);

          if (typeId !== 0) {
            let soundName = block.getSound().getBreakSound();

            // Play sound
            this.soundManager.playSound(
              soundName,
              hitResult.x + 0.5,
              hitResult.y + 0.5,
              hitResult.z + 0.5,
              1.0,
              1.0,
            );

            // Spawn particle
            this.particleRenderer.spawnBlockBreakParticle(
              this.world,
              hitResult.x,
              hitResult.y,
              hitResult.z,
            );

            // Destroy block
            this.world.setBlockAt(hitResult.x, hitResult.y, hitResult.z, 0);
          }
        }

        this.player.swingArm();
      }

      // Pick block
      if (button === 1) {
        if (hitResult != null) {
          let typeId = this.world.getBlockAt(
            hitResult.x,
            hitResult.y,
            hitResult.z,
          );
          if (typeId !== 0) {
            // Switch to slot if item is already in hotbar
            for (const item of this.player.inventory.items) {
              const index = this.player.inventory.items.indexOf(item);
              if (item === typeId && index <= 8) {
                this.player.inventory.selectedSlotIndex = index;
                return;
              }
            }

            // Set item in hotbar
            this.player.inventory.setItemInSelectedSlot(typeId);
          }
        }
      }

      // Place block
      if (button === 2) {
        if (hitResult != null) {
          let x = hitResult.x + hitResult.face.x;
          let y = hitResult.y + hitResult.face.y;
          let z = hitResult.z + hitResult.face.z;

          let placedBoundingBox = new BoundingBox(x, y, z, x + 1, y + 1, z + 1);

          // Don't place blocks if the player is standing there
          if (!placedBoundingBox.intersects(this.player.boundingBox)) {
            let typeId = this.player.inventory.getItemInSelectedSlot();

            // Get previous block
            let prevTypeId = this.world.getBlockAt(x, y, z);

            if (typeId !== 0 && prevTypeId !== typeId) {
              // Place block
              this.world.setBlockAt(x, y, z, typeId);

              // Swing player arm
              this.player.swingArm();

              // Handle block abilities
              let block = Block.getById(typeId);
              block.onBlockPlaced(this.world, x, y, z, hitResult.face);

              // Play sound
              let sound = block.getSound();
              let soundName = sound.getStepSound();
              this.soundManager.playSound(
                soundName,
                hitResult.x + 0.5,
                hitResult.y + 0.5,
                hitResult.z + 0.5,
                1.0,
                sound.getPitch() * 0.8,
              );
            }
          }
        }
      }

      // Rebuild multiple chunk sections
      this.worldRenderer.flushRebuild = true;
    }
  }

  onMouseScroll(delta) {
    if (this.isInGame()) {
      this.player.inventory.shiftSelectedSlot(delta);
    }
  }

  isPaused() {
    return (
      !this.hasInGameFocus() &&
      this.loadingScreen === null &&
      this.isSingleplayer()
    );
  }

  setSession(session, save = false) {
    this.session = session;

    // Save session
    if (save) {
      this.settings.session = session.toJson();
      this.settings.save();
    }
  }

  updateAccessToken(token) {
    this.session.setAccessToken(token);
    this.setSession(this.session, true);
  }

  getSession() {
    return this.session;
  }

  isSingleplayer() {
    return (
      this.isInGame() &&
      !(this.playerController instanceof PlayerControllerMultiplayer)
    );
  }

  stop() {
    if (this.currentScreen !== null) {
      this.currentScreen.onClose();
    }
    this.running = false;
    this.worldRenderer.reset();
    this.itemRenderer.reset();
    this.screenRenderer.reset();
    this.window.close();
  }

  getThreeTexture(id) {
    if (!(id in this.resources)) {
      console.error("Texture not found: " + id);
      return;
    }

    let image = this.resources[id];
    let canvas = document.createElement("canvas");
    let context = canvas.getContext("2d");
    canvas.width = image.width;
    canvas.height = image.height;
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0, image.width, image.height);
    return new THREE.CanvasTexture(canvas);
  }
}
