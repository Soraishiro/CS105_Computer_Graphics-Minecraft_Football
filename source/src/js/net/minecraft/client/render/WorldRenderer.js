import BlockRenderer from "./BlockRenderer.js";
import EntityRenderManager from "./entity/EntityRenderManager.js";
import MathHelper from "../../util/MathHelper.js";
import Block from "../world/block/Block.js";
import Tessellator from "./Tessellator.js";
import ChunkSection from "../world/ChunkSection.js";
import Random from "../../util/Random.js";
import Vector3 from "../../util/Vector3.js";
import * as THREE from "../../../../../../libraries/three.module.js";
import GUI from "https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm";

export default class WorldRenderer {

    static THIRD_PERSON_DISTANCE = 4;

    constructor(minecraft, window) {
        this.minecraft = minecraft;
        this.window = window;
        this.chunkSectionUpdateQueue = [];

        this.tessellator = new Tessellator();

        // Load terrain texture
        this.textureTerrain = minecraft.getThreeTexture('terrain/terrain_stadium.png');
        this.textureTerrain.magFilter = THREE.NearestFilter;
        this.textureTerrain.minFilter = THREE.NearestFilter;

        // Load sun texture
        this.textureSun = minecraft.getThreeTexture('terrain/sun.png');
        this.textureSun.magFilter = THREE.NearestFilter;
        this.textureSun.minFilter = THREE.NearestFilter;

        // Load moon texture
        this.textureMoon = minecraft.getThreeTexture('terrain/moon.png');
        this.textureMoon.magFilter = THREE.NearestFilter;
        this.textureMoon.minFilter = THREE.NearestFilter;

        // Block Renderer
        this.blockRenderer = new BlockRenderer(this);

        // Entity render manager
        this.entityRenderManager = new EntityRenderManager(this);

        this.equippedProgress = 0;
        this.prevEquippedProgress = 0;
        this.itemToRender = 0;

        this.prevFogBrightness = 0;
        this.fogBrightness = 0;

        this.flushRebuild = false;

        this.lastHitResult = null;

        this.spotLights = new Map();

        this.initialize();
    }

    initialize() {
        // Create world camera
        this.camera = new THREE.PerspectiveCamera(0, 1, 0.001, 1000);
        this.camera.rotation.order = 'ZYX';
        this.camera.up = new THREE.Vector3(0, 0, 1);

        // Frustum
        this.frustum = new THREE.Frustum();

        // Create background scene
        this.background = new THREE.Scene();
        this.background.matrixAutoUpdate = false;

        // Create world scene
        this.scene = new THREE.Scene();
        this.scene.matrixAutoUpdate = false;

        // Create overlay for first person model rendering
        this.overlay = new THREE.Scene();
        this.overlay.matrixAutoUpdate = false;

        // Lighting cho scene chính
        this.ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        this.scene.add(this.ambientLight);

        // Lighting cho overlay scene (góc nhìn thứ nhất)
        this.overlayAmbientLight = new THREE.AmbientLight(0xffffff, 1.2);
        this.overlay.add(this.overlayAmbientLight);

        this.overlaySunLight = new THREE.DirectionalLight(0xfff4e0, 0.1);
        this.overlay.add(this.overlaySunLight);
        this.overlay.add(this.overlaySunLight.target);

        this.sunLight = new THREE.DirectionalLight(0xfff4e0, 1.0);
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;

        // Mo rong vung tinh toan bong cho DirectionalLight (vi mac dinh chi co 5x5)
        let d = 100;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.sunLight.shadow.camera.updateProjectionMatrix();

        this.scene.add(this.sunLight);
        this.scene.add(this.sunLight.target);

        // Helper cho shadow camera của sunlight
        this.sunLightHelper = new THREE.CameraHelper(this.sunLight.shadow.camera);
        this.scene.add(this.sunLightHelper);

        this.overlayMoonLight = new THREE.DirectionalLight(0x88bbff, 0.5);
        this.overlay.add(this.overlayMoonLight);
        this.overlay.add(this.overlayMoonLight.target);

        this.moonLight = new THREE.DirectionalLight(0x88bbff, 1.0);
        this.moonLight.shadow.mapSize.width = 2048;
        this.moonLight.shadow.mapSize.height = 2048;
        this.moonLight.shadow.camera.near = 0.5;
        this.moonLight.shadow.camera.far = 500;

        this.moonLight.shadow.camera.left = -d;
        this.moonLight.shadow.camera.right = d;
        this.moonLight.shadow.camera.top = d;
        this.moonLight.shadow.camera.bottom = -d;
        this.moonLight.shadow.camera.updateProjectionMatrix();

        this.scene.add(this.moonLight);
        this.scene.add(this.moonLight.target);

        this.moonLightHelper = new THREE.CameraHelper(this.moonLight.shadow.camera);
        this.scene.add(this.moonLightHelper);

        // Bo quan ly Event-driven PointLight
        this.dynamicLights = new Map();

        // Create web renderer
        this.webRenderer = new THREE.WebGLRenderer({
            canvas: this.window.canvasWorld,
            antialias: false,
            alpha: true
        });

        // Settings
        this.webRenderer.setSize(this.window.width, this.window.height);
        this.webRenderer.shadowMap.enabled = true;
        this.webRenderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
        this.webRenderer.autoClear = false;
        this.webRenderer.sortObjects = false;
        this.webRenderer.setClearColor(0x000000, 0);
        this.webRenderer.clear();

        // Create sky
        this.generateSky();

        // Create block hit box
        let geometry = new THREE.BoxGeometry(1, 1, 1);
        let edges = new THREE.EdgesGeometry(geometry);
        this.blockHitBox = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
            color: 0x000000
        }));
        this.scene.add(this.blockHitBox);

        // GUI Removed - Migrated to GuiLightingOptions    
    }

    render(partialTicks) {
        // Setup camera
        this.orientCamera(partialTicks);

        // Render chunks
        let player = this.minecraft.player;
        let cameraChunkX = Math.floor(player.x) >> 4;
        let cameraChunkZ = Math.floor(player.z) >> 4;
        this.renderChunks(cameraChunkX, cameraChunkZ);

        // Render sky
        this.renderSky(partialTicks);

        // Render target block
        this.renderBlockHitBox(player, partialTicks);

        // Render particles
        this.minecraft.particleRenderer.renderParticles(player, partialTicks);

        // Hide all entities and make them visible during rendering
        for (let entity of this.minecraft.world.entities) {
            entity.renderer.group.visible = false;
        }

        // Render entities
        for (let entity of this.minecraft.world.entities) {
            if (entity === player && this.minecraft.settings.thirdPersonView === 0) {
                continue;
            }

            // Render entity
            entity.renderer.render(entity, partialTicks);
            entity.renderer.group.visible = true;
        }

        // Render hand
        this.renderHand(partialTicks);

        // Render background scene
        this.webRenderer.render(this.background, this.camera);

        // Render actual scene
        this.webRenderer.render(this.scene, this.camera);

        // Render overlay with a static FOV
        this.camera.fov = 70;
        this.camera.updateProjectionMatrix();
        this.webRenderer.render(this.overlay, this.camera);
    }

    onTick() {
        // Rebuild 2 chunk sections each tick
        for (let i = 0; i < 2; i++) {
            if (this.chunkSectionUpdateQueue.length !== 0) {
                let chunkSection = this.chunkSectionUpdateQueue.shift();
                if (chunkSection != null) {
                    // Rebuild chunk
                    chunkSection.rebuild(this);
                }
            }
        }

        this.prevFogBrightness = this.fogBrightness;
        this.prevEquippedProgress = this.equippedProgress;

        let player = this.minecraft.player;
        let itemStack = player.inventory.getItemInSelectedSlot();

        let showHand = false;
        if (this.itemToRender != null && itemStack != null) {
            if (this.itemToRender !== itemStack) {
                showHand = true;
            }
        } else if (this.itemToRender == null && itemStack == null) {
            showHand = false;
        } else {
            showHand = true;
        }

        // Update equip progress
        this.equippedProgress += MathHelper.clamp((showHand ? 0.0 : 1.0) - this.equippedProgress, -0.4, 0.4);

        if (this.equippedProgress < 0.1) {
            this.itemToRender = itemStack;
        }

        // Update fog brightness
        let brightnessAtPosition = this.minecraft.world.getLightBrightnessForEntity(player);
        let renderDistance = this.minecraft.settings.viewDistance / 32.0;
        let fogBrightness = brightnessAtPosition * (1.0 - renderDistance) + renderDistance;

        // Sanity check for NaN
        if (isNaN(fogBrightness)) fogBrightness = 1.0;
        if (isNaN(this.fogBrightness)) this.fogBrightness = fogBrightness;

        this.fogBrightness += (fogBrightness - this.fogBrightness) * 0.1;
    }

    orientCamera(partialTicks) {
        let player = this.minecraft.player;

        // Reset rotation stack
        let stack = this.camera;

        // Position
        let x = player.prevX + (player.x - player.prevX) * partialTicks;
        let y = player.prevY + (player.y - player.prevY) * partialTicks + player.getEyeHeight();
        let z = player.prevZ + (player.z - player.prevZ) * partialTicks;

        // Rotation
        let yaw = player.prevRotationYaw + (player.rotationYaw - player.prevRotationYaw) * partialTicks;
        let pitch = player.prevRotationPitch + (player.rotationPitch - player.prevRotationPitch) * partialTicks;

        // Add camera offset
        let mode = this.minecraft.settings.thirdPersonView;
        if (mode !== 0) {
            let distance = WorldRenderer.THIRD_PERSON_DISTANCE;
            let frontView = mode === 2;

            // Calculate vector of yaw and pitch
            let vector = player.getVectorForRotation(pitch, yaw);

            // Calculate max possible position of the third person camera
            let maxX = x - vector.x * distance * (frontView ? -1 : 1);
            let maxY = y - vector.y * distance * (frontView ? -1 : 1);
            let maxZ = z - vector.z * distance * (frontView ? -1 : 1);

            // Make 8 different ray traces to make sure we don't get stuck in walls
            for (let i = 0; i < 8; i++) {
                // Calculate all possible offset variations (Basically a binary counter)
                let offsetX = ((i & 1) * 2 - 1) * 0.1;
                let offsetY = ((i >> 1 & 1) * 2 - 1) * 0.1;
                let offsetZ = ((i >> 2 & 1) * 2 - 1) * 0.1;

                // Calculate ray trace from and to position
                let from = new Vector3(x, y, z);
                let to = new Vector3(maxX, maxY, maxZ);

                // Add offset of this variation
                from = from.addVector(offsetX, offsetY, offsetZ);
                to = to.addVector(offsetX, offsetY, offsetZ);

                // Make ray trace
                let target = this.minecraft.world.rayTraceBlocks(from, to);
                if (target === null) {
                    continue;
                }

                // Calculate distance to collision
                let distanceToCollision = target.vector.distanceTo(new Vector3(x, y, z));
                if (distanceToCollision < distance) {
                    distance = distanceToCollision;
                }
            }

            // Move camera to third person sphere
            x -= vector.x * distance * (frontView ? -1 : 1);
            y -= vector.y * distance * (frontView ? -1 : 1);
            z -= vector.z * distance * (frontView ? -1 : 1);

            // Flip camera around if front view is enabled
            if (frontView) {
                pitch *= -1;
                yaw += 180;
            }
        }

        // Update camera rotation
        stack.rotation.x = -MathHelper.toRadians(pitch);
        stack.rotation.y = -MathHelper.toRadians(yaw + 180);
        stack.rotation.z = 0;

        // Update camera position
        stack.position.set(x, y, z);

        // Apply bobbing animation
        if (mode === 0 && this.minecraft.settings.viewBobbing) {
            this.bobbingAnimation(player, stack, partialTicks);
        }

        // Update FOV
        this.camera.fov = this.minecraft.settings.fov + player.getFOVModifier();
        this.camera.updateProjectionMatrix();

        // Update frustum
        this.frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse));

        // Setup fog
        this.setupFog(x, z, player.isHeadInWater(), partialTicks);
    }

    generateSky() {
        // Create background center group
        this.backgroundCenter = new THREE.Object3D();
        this.background.add(this.backgroundCenter);

        let size = 64;
        let scale = 256 / size + 2;

        // Generate sky color
        {
            let y = 16;
            this.listSky = new THREE.Object3D();
            this.tessellator.startDrawing();
            this.tessellator.setColor(1, 1, 1);
            for (let x = -size * scale; x <= size * scale; x += size) {
                for (let z = -size * scale; z <= size * scale; z += size) {
                    this.tessellator.addVertex(x + size, y, z);
                    this.tessellator.addVertex(x, y, z);
                    this.tessellator.addVertex(x, y, z + size);
                    this.tessellator.addVertex(x + size, y, z + size);
                }
            }
            let mesh = this.tessellator.draw(this.listSky);
            mesh.material.depthTest = false;
            this.backgroundCenter.add(this.listSky);
        }

        // Generate sunrise/sunset color
        {
            this.listSunset = new THREE.Object3D();
            this.tessellator.startDrawing();

            let amount = 16;
            let width = (Math.PI * 2.0) / amount;

            for (let index = 0; index < amount; index++) {
                let rotation = (index * Math.PI * 2.0) / amount;

                let x1 = Math.sin(rotation);
                let y1 = Math.cos(rotation);

                let x2 = Math.sin(rotation + width);
                let y2 = Math.cos(rotation + width);

                this.tessellator.setColor(1, 1, 1, 1);
                this.tessellator.addVertex(0.0, 100, 0.0);
                this.tessellator.addVertex(0.0, 100, 0.0);

                this.tessellator.setColor(1, 1, 1, 0);
                this.tessellator.addVertex(x1 * 120, y1 * 120, -y1 * 40);
                this.tessellator.addVertex(x2 * 120, y2 * 120, -y2 * 40);
            }

            let mesh = this.tessellator.draw(this.listSunset);
            mesh.material = mesh.material.clone();
            mesh.material.depthTest = false;
            mesh.material.opacity = 0.6;
            mesh.material.side = THREE.DoubleSide;
            this.backgroundCenter.add(this.listSunset);
        }

        // Create cycle group
        this.cycleGroup = new THREE.Object3D();

        // Generate stars
        {
            this.listStars = new THREE.Object3D();
            this.tessellator.startDrawing();
            this.tessellator.setColor(1, 1, 1);

            // Generate 1500 stars
            let random = new Random(10842);
            for (let i = 0; i < 1500; i++) {
                // Random vector
                let vectorX = random.nextFloat() * 2.0 - 1.0;
                let vectorY = random.nextFloat() * 2.0 - 1.0;
                let vectorZ = random.nextFloat() * 2.0 - 1.0;

                // Skip invalid vectors
                let distance = vectorX * vectorX + vectorY * vectorY + vectorZ * vectorZ;
                if (distance >= 1.0 || distance <= 0.01) {
                    continue;
                }

                // Create sphere
                distance = 1.0 / Math.sqrt(distance);
                vectorX *= distance;
                vectorY *= distance;
                vectorZ *= distance;

                // Increase sphere size
                let x = vectorX * 100;
                let y = vectorY * 100;
                let z = vectorZ * 100;

                // Rotate the stars on the sphere
                let rotationX = Math.atan2(vectorX, vectorZ);
                let sinX = Math.sin(rotationX);
                let cosX = Math.cos(rotationX);

                // Face the stars to the middle of the sphere
                let rotationY = Math.atan2(Math.sqrt(vectorX * vectorX + vectorZ * vectorZ), vectorY);
                let sinY = Math.sin(rotationY);
                let cosY = Math.cos(rotationY);

                // Tilt the stars randomly
                let rotationZ = random.nextFloat() * Math.PI * 2;
                let sinZ = Math.sin(rotationZ);
                let cosZ = Math.cos(rotationZ);

                // Random size of the star
                let size = 0.25 + random.nextFloat() * 0.25;

                // Add vertices for each edge of the star
                for (let edge = 0; edge < 4; edge++) {
                    // Calculate the position of the edge on a 2D plane
                    let tileX = ((edge & 2) - 1) * size;
                    let tileZ = ((edge + 1 & 2) - 1) * size;

                    // Project tile position onto the sphere
                    let sphereX = tileX * cosZ - tileZ * sinZ;
                    let sphereY = tileZ * cosZ + tileX * sinZ;
                    let sphereZ = -sphereX * cosY;

                    // Calculate offset of the edge on the sphere
                    let offsetX = sphereZ * sinX - sphereY * cosX;
                    let offsetY = sphereX * sinY;
                    let offsetZ = sphereY * sinX + sphereZ * cosX;

                    // Add vertex for the edge of the star
                    this.tessellator.addVertex(x + offsetX, y + offsetY, z + offsetZ);
                }
            }

            let mesh = this.tessellator.draw(this.listStars);
            mesh.material = mesh.material.clone();
            mesh.material.depthTest = true;
            mesh.material.side = THREE.BackSide;
            this.cycleGroup.add(this.listStars);
        }

        // Create sun
        let geometry = new THREE.PlaneGeometry(1, 1);
        let materialSun = new THREE.MeshBasicMaterial({
            side: THREE.FrontSide,
            map: this.textureSun,
            alphaMap: this.textureSun,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        this.sun = new THREE.Mesh(geometry, materialSun);
        this.sun.translateZ(-2);
        this.sun.material.depthTest = false;
        this.cycleGroup.add(this.sun);

        // Create moon
        let materialMoon = new THREE.MeshBasicMaterial({
            side: THREE.BackSide,
            map: this.textureMoon,
            alphaMap: this.textureMoon,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        this.moon = new THREE.Mesh(geometry, materialMoon);
        this.moon.translateZ(2);
        this.moon.material.depthTest = false;
        this.cycleGroup.add(this.moon);

        // Add cycle group before the void to hide the cycling elements behind the void
        this.backgroundCenter.add(this.cycleGroup);

        // Generate void color
        {
            let y = -16;
            this.listVoid = new THREE.Object3D();
            this.tessellator.startDrawing();
            this.tessellator.setColor(1, 1, 1);
            for (let x = -size * scale; x <= size * scale; x += size) {
                for (let z = -size * scale; z <= size * scale; z += size) {
                    this.tessellator.addVertex(x, y, z);
                    this.tessellator.addVertex(x + size, y, z);
                    this.tessellator.addVertex(x + size, y, z + size);
                    this.tessellator.addVertex(x, y, z + size);
                }
            }
            let mesh = this.tessellator.draw(this.listVoid);
            mesh.material = mesh.material.clone();
            mesh.material.depthTest = false;
            mesh.material.opacity = 1;
            this.backgroundCenter.add(this.listVoid);
        }
    }

    renderSky(partialTicks) {
        // Center sky
        this.backgroundCenter.position.copy(this.camera.position);

        // Rotate sky cycle
        let angle = this.minecraft.world.getCelestialAngle(partialTicks);
        this.cycleGroup.rotation.set(angle * Math.PI * 2 + Math.PI / 2, 0, 0);

        // ── Sync DirectionalLight (Sun) voi chu ky ngay/dem ──────────
        // Dung cung theta voi cycleGroup de huong sang khop voi vi tri mat troi tren troi
        const theta = angle * Math.PI * 2 + Math.PI / 2;
        this.sunLight.position.set(
            this.camera.position.x,
            Math.sin(theta) * 200 + this.camera.position.y,
            this.camera.position.z - Math.cos(theta) * 200
        );
        this.sunLight.target.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z);
        this.sunLight.target.updateMatrixWorld();
        this.sunLight.updateMatrixWorld();

        // Đồng bộ vị trí và góc nhìn của shadow camera thủ công để helper cập nhật đúng
        this.sunLight.shadow.camera.position.setFromMatrixPosition(this.sunLight.matrixWorld);
        const targetPos = new THREE.Vector3().setFromMatrixPosition(this.sunLight.target.matrixWorld);
        this.sunLight.shadow.camera.lookAt(targetPos);
        this.sunLight.shadow.camera.updateMatrixWorld();

        // ── Sync DirectionalLight (Moon) ──────────
        const moonTheta = angle * Math.PI * 2 - Math.PI / 2;
        this.moonLight.position.set(
            this.camera.position.x,
            Math.sin(moonTheta) * 200 + this.camera.position.y,
            this.camera.position.z - Math.cos(moonTheta) * 200
        );
        this.moonLight.target.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z);
        this.moonLight.target.updateMatrixWorld();
        this.moonLight.updateMatrixWorld();

        this.moonLight.shadow.camera.position.setFromMatrixPosition(this.moonLight.matrixWorld);
        const moonTargetPos = new THREE.Vector3().setFromMatrixPosition(this.moonLight.target.matrixWorld);
        this.moonLight.shadow.camera.lookAt(moonTargetPos);
        this.moonLight.shadow.camera.updateMatrixWorld();

        if (this.sunLightHelper) {
            this.sunLightHelper.update();
            this.sunLightHelper.updateMatrixWorld(true);
            if (this.minecraft.settings) {
                this.sunLightHelper.visible = this.minecraft.settings.showSunLightHelper;
            }
        }

        if (this.moonLightHelper) {
            this.moonLightHelper.update();
            this.moonLightHelper.updateMatrixWorld(true);
            if (this.minecraft.settings) {
                this.moonLightHelper.visible = this.minecraft.settings.showMoonLightHelper;
            }
        }

        if (this.spotLightHelper) {
            this.spotLightHelper.light.target.updateMatrixWorld();
            this.spotLightHelper.update();
            this.spotLightHelper.updateMatrixWorld(true);
        }

        // Chuyen brightness tu cos(angle): ban ngay = 1, ban dem = 0
        let brightness = Math.max(0, Math.min(1, Math.cos(angle * Math.PI * 2) * 2 + 0.5));

        if (this.minecraft.settings && this.minecraft.settings.enableDayNightLighting) {
            this.sunLight.intensity = brightness * 1.2;
            this.moonLight.intensity = (1.0 - brightness) * this.minecraft.settings.moonIntensity; // Tự động set theo setting moonIntensity
            this.ambientLight.intensity = 0.1 + brightness * 0.25;
        }
        this.overlayAmbientLight.intensity = 0.1 + brightness * 0.15;

        // Mau anh sang theo gio trong ngay
        if (brightness > 0.5) {
            this.sunLight.color.set(0xfff4e0);  // ban ngay: vang am
        } else if (brightness > 0.05) {
            this.sunLight.color.set(0xff8844);  // hoang hon / binh minh: cam do
        } else {
            this.sunLight.intensity = 0;         // ban dem: tat hoan toan
        }
    }

    setupFog(x, z, inWater, partialTicks) {
        if (inWater) {
            let color = new THREE.Color(0.2, 0.2, 0.4);
            this.background.background = color;
            this.scene.fog = new THREE.Fog(color, 0.0025, 5);
        } else {
            let world = this.minecraft.world;

            let viewDistance = this.minecraft.settings.viewDistance * ChunkSection.SIZE;
            let viewFactor = 1.0 - Math.pow(0.25 + 0.75 * this.minecraft.settings.viewDistance / 32.0, 0.25);

            let angle = world.getCelestialAngle(partialTicks);

            let skyColor = world.getSkyColor(x, z, partialTicks);
            let fogColor = world.getFogColor(partialTicks);
            let sunsetColor = world.getSunriseSunsetColor(partialTicks);

            let starBrightness = world.getStarBrightness(partialTicks);
            let brightness = this.prevFogBrightness + (this.fogBrightness - this.prevFogBrightness) * partialTicks;

            let red = (fogColor.x + (skyColor.x - fogColor.x) * viewFactor) * brightness;
            let green = (fogColor.y + (skyColor.y - fogColor.y) * viewFactor) * brightness;
            let blue = (fogColor.z + (skyColor.z - fogColor.z) * viewFactor) * brightness;

            // Update background color
            this.background.background = new THREE.Color(red, green, blue);

            // Update fog color
            this.scene.fog = new THREE.Fog(new THREE.Color(red, green, blue), 0.0025, viewDistance * 2);

            let skyMesh = this.listSky.children[0];
            let voidMesh = this.listVoid.children[0];
            let starsMesh = this.listStars.children[0];
            let sunsetMesh = this.listSunset.children[0];

            // Update sky and void color
            skyMesh.material.color.set(new THREE.Color(skyColor.x, skyColor.y, skyColor.z));
            voidMesh.material.color.set(new THREE.Color(
                skyColor.x * 0.2 + 0.04,
                skyColor.y * 0.2 + 0.04,
                skyColor.z * 0.6 + 0.1
            ));

            // Update star brightness
            if (starBrightness > 0) {
                starsMesh.material.opacity = starBrightness;
                starsMesh.material.color.set(new THREE.Color(starBrightness, starBrightness, starBrightness));
            }
            this.listStars.visible = starBrightness > 0;

            // Update sunset
            if (sunsetColor !== null) {
                sunsetMesh.material.opacity = sunsetColor.w;
                sunsetMesh.material.color.set(new THREE.Color(sunsetColor.x, sunsetColor.y, sunsetColor.z));
                sunsetMesh.rotation.x = MathHelper.toRadians(angle <= 0.5 ? 90 : 135);
            }
            sunsetMesh.visible = sunsetColor !== null;
        }

        this.background.fog = this.scene.fog;
    }

    renderChunks(cameraChunkX, cameraChunkZ) {
        let world = this.minecraft.world;
        let renderDistance = this.minecraft.settings.viewDistance;

        // Update chunks
        for (let [index, chunk] of world.getChunkProvider().getChunks()) {
            let distanceX = Math.abs(cameraChunkX - chunk.x);
            let distanceZ = Math.abs(cameraChunkZ - chunk.z);

            // Is in render distance check
            if (distanceX < renderDistance && distanceZ < renderDistance) {
                // Make chunk visible
                chunk.group.visible = true;
                chunk.loaded = true;

                // For all chunk sections
                for (let y in chunk.sections) {
                    let chunkSection = chunk.sections[y];

                    // Is in camera view check
                    if (this.frustum.intersectsBox(chunkSection.boundingBox) && !chunkSection.isEmpty()) {
                        // Make section visible
                        chunkSection.group.visible = true;

                        // Render chunk section
                        chunkSection.render();

                        // Queue for rebuild
                        if (chunkSection.isModified && !this.chunkSectionUpdateQueue.includes(chunkSection)) {
                            this.chunkSectionUpdateQueue.push(chunkSection);
                        }
                    } else {
                        // Hide section
                        chunkSection.group.visible = false;
                    }
                }
            } else {
                // Hide chunk
                chunk.group.visible = false;

                // Unload chunk
                if (chunk.loaded) {
                    chunk.unload();

                    // TODO Implement chunk unloading
                    //let index = chunk.x + (chunk.z << 16);
                    //world.getChunkProvider().getChunks().delete(index);
                    //world.group.remove(chunk.group);
                }
            }
        }

        // Sort update queue, chunk sections that are closer to the camera get a higher priority
        this.chunkSectionUpdateQueue.sort((section1, section2) => {
            let distance1 = Math.floor(Math.pow(section1.x - cameraChunkX, 2) + Math.pow(section1.z - cameraChunkZ, 2));
            let distance2 = Math.floor(Math.pow(section2.x - cameraChunkX, 2) + Math.pow(section2.z - cameraChunkZ, 2));
            return distance1 - distance2;
        });

        // Update render order of chunks
        world.group.children.sort((a, b) => {
            let distance1 = Math.floor(Math.pow(a.chunkX - cameraChunkX, 2) + Math.pow(a.chunkZ - cameraChunkZ, 2));
            let distance2 = Math.floor(Math.pow(b.chunkX - cameraChunkX, 2) + Math.pow(b.chunkZ - cameraChunkZ, 2));
            return distance2 - distance1;
        });

        // Flush by rebuilding 8 chunk sections
        if (this.flushRebuild) {
            this.flushRebuild = false;

            for (let i = 0; i < 8; i++) {
                if (this.chunkSectionUpdateQueue.length !== 0) {
                    let chunkSection = this.chunkSectionUpdateQueue.shift();
                    if (chunkSection != null) {
                        // Rebuild chunk
                        chunkSection.rebuild(this);
                    }
                }
            }
        }
    }

    rebuildAll() {
        let world = this.minecraft.world;
        for (let [index, chunk] of world.getChunkProvider().getChunks()) {
            chunk.setModifiedAllSections();
        }
    }

    renderHand(partialTicks) {
        // Hide hand before rendering
        let player = this.minecraft.player;
        let stack = player.renderer.firstPersonGroup;
        stack.visible = false;

        let firstPerson = this.minecraft.settings.thirdPersonView === 0;
        let itemId = firstPerson ? this.itemToRender : player.inventory.getItemInSelectedSlot();
        let hasItem = itemId !== 0;

        // Hide in third person
        if (!firstPerson) {
            return;
        }

        // Apply matrix mode (Put object in front of camera)
        stack.position.copy(this.camera.position);
        stack.rotation.copy(this.camera.rotation);
        stack.rotation.order = 'ZYX';

        // Scale down
        stack.scale.set(0.0625, 0.0625, 0.0625);

        let equipProgress = this.prevEquippedProgress + (this.equippedProgress - this.prevEquippedProgress) * partialTicks;
        let swingProgress = player.getSwingProgress(partialTicks);

        let pitchArm = player.prevRenderArmPitch + (player.renderArmPitch - player.prevRenderArmPitch) * partialTicks;
        let yawArm = player.prevRenderArmYaw + (player.renderArmYaw - player.prevRenderArmYaw) * partialTicks;

        // Bobbing animation
        if (this.minecraft.settings.viewBobbing) {
            this.bobbingAnimation(player, stack, partialTicks);
        }

        let factor = 0.8;
        let zOffset = Math.sin(swingProgress * Math.PI);
        let yOffset = Math.sin(Math.sqrt(swingProgress) * Math.PI * 2.0);
        let xOffset = Math.sin(Math.sqrt(swingProgress) * Math.PI);

        let sqrtRotation = Math.sin(Math.sqrt(swingProgress) * Math.PI);
        let powRotation = Math.sin(swingProgress * swingProgress * Math.PI);

        // Camera rotation movement
        stack.rotateX(MathHelper.toRadians((player.rotationPitch - pitchArm) * 0.1));
        stack.rotateY(MathHelper.toRadians((player.rotationYaw - yawArm) * 0.1));

        if (hasItem) {
            // Initial offset on screen
            this.translate(stack, -xOffset * 0.4, yOffset * 0.2, -zOffset * 0.2);
            this.translate(stack, 0.7 * factor, -0.65 * factor - (1.0 - equipProgress) * 0.6, -0.9 * factor);

            // Rotation of hand
            stack.rotateY(MathHelper.toRadians(45));
            stack.rotateY(MathHelper.toRadians(-powRotation * 20));
            stack.rotateZ(MathHelper.toRadians(-sqrtRotation * 20));
            stack.rotateX(MathHelper.toRadians(-sqrtRotation * 80));

            // Scale down
            stack.scale.x *= 0.4;
            stack.scale.y *= 0.4;
            stack.scale.z *= 0.4;

            // Render item
            player.renderer.updateFirstPerson(player);
        } else {
            // Initial offset on screen
            this.translate(stack, -xOffset * 0.3, yOffset * 0.4, -zOffset * 0.4);
            this.translate(stack, 0.8 * factor, -0.75 * factor - (1.0 - equipProgress) * 0.6, -0.9 * factor);

            // Rotation of hand
            stack.rotateY(MathHelper.toRadians(45));
            stack.rotateY(MathHelper.toRadians(sqrtRotation * 70));
            stack.rotateZ(MathHelper.toRadians(-powRotation * 20));

            // Post transform
            this.translate(stack, -1, 3.6, 3.5);
            stack.rotateZ(MathHelper.toRadians(120));
            stack.rotateX(MathHelper.toRadians(200));
            stack.rotateY(MathHelper.toRadians(-135));
            this.translate(stack, 5.6, 0.0, 0.0);

            // Render hand
            player.renderer.renderRightHand(player, partialTicks);
        }
    }

    renderBlockHitBox(player, partialTicks) {
        let hitResult = player.rayTrace(5, partialTicks);
        let hitBoxVisible = !(hitResult === null);
        if ((this.blockHitBox.visible = hitBoxVisible)) {
            let x = hitResult.x;
            let y = hitResult.y;
            let z = hitResult.z;

            // Get block type
            let world = this.minecraft.world;
            let typeId = world.getBlockAt(x, y, z);
            let block = Block.getById(typeId);

            if (typeId !== 0) {
                let boundingBox = block.getBoundingBox(world, x, y, z);

                let offset = 0.01;

                let width = boundingBox.width() + offset;
                let height = boundingBox.height() + offset;
                let depth = boundingBox.depth() + offset;

                // Update size of hit box
                this.blockHitBox.scale.set(
                    width,
                    height,
                    depth
                );

                // Update position of hit box
                this.blockHitBox.position.set(
                    x + width / 2 / width - 0.5 + boundingBox.maxX - width / 2 + offset / 2,
                    y + height / 2 / height - 0.5 + boundingBox.maxY - height / 2 + offset / 2,
                    z + depth / 2 / depth - 0.5 + boundingBox.maxZ - depth / 2 + offset / 2,
                );
            }
        }

        this.lastHitResult = hitResult;
    }

    translate(stack, x, y, z) {
        stack.translateX(x);
        stack.translateY(y);
        stack.translateZ(z);
    }

    bobbingAnimation(player, stack, partialTicks) {
        let walked = -(player.prevDistanceWalked + (player.distanceWalked - player.prevDistanceWalked) * partialTicks);
        let yaw = player.prevCameraYaw + (player.cameraYaw - player.prevCameraYaw) * partialTicks;
        let pitch = player.prevCameraPitch + (player.cameraPitch - player.prevCameraPitch) * partialTicks;

        this.translate(
            stack,
            Math.sin(walked * 3.141593) * yaw * 0.5,
            -Math.abs(Math.cos(walked * Math.PI) * yaw),
            0.0
        );

        stack.rotateZ(MathHelper.toRadians(Math.sin(walked * Math.PI) * yaw * 3.0));
        stack.rotateX(MathHelper.toRadians(Math.abs(Math.cos(walked * Math.PI - 0.2) * yaw) * 5.0));
        stack.rotateX(MathHelper.toRadians(pitch));
    }

    addDynamicLight(x, y, z, color, intensity, distance) {
        let key = `${x},${y},${z}`;
        if (this.dynamicLights.has(key)) return;

        // Su dung thong so tu GUI neu co, neu khong thi dung thong so mac dinh
        let finalIntensity = this.minecraft.settings ? this.minecraft.settings.torchIntensity : intensity;
        let finalDistance = this.minecraft.settings ? this.minecraft.settings.torchDistance : distance;

        let pointLight = new THREE.PointLight(color, finalIntensity, finalDistance);
        pointLight.position.set(x + 0.5, y + 0.5, z + 0.5);

        // Turn on shadow map
        pointLight.castShadow = this.minecraft.settings ? this.minecraft.settings.torchCastShadow : false;
        pointLight.shadow.mapSize.width = 512; // Giữ ở mức trung bình để đỡ lag
        pointLight.shadow.mapSize.height = 512;
        // pointLight.shadow.camera.near = 0.1;
        pointLight.shadow.camera.far = finalDistance;
        pointLight.shadow.bias = -0.0001; // Tránh hiện tượng shadow acne

        this.scene.add(pointLight);
        this.dynamicLights.set(key, pointLight);
    }

    removeDynamicLight(x, y, z) {
        let key = `${x},${y},${z}`;
        if (this.dynamicLights.has(key)) {
            let light = this.dynamicLights.get(key);
            this.scene.remove(light);
            this.dynamicLights.delete(key);
        }
    }

    addSpotLight(x, y, z) {
        let key = `${x},${y},${z}`;
        if (this.spotLights.has(key)) return;

        let spotLight = new THREE.SpotLight(0xffffff, this.minecraft.settings.spotLightIntensity, this.minecraft.settings.spotLightDistance);
        spotLight.position.set(x + 0.5, y + 0.5, z + 0.5);
        spotLight.angle = THREE.MathUtils.degToRad(this.minecraft.settings.spotLightAngle);
        spotLight.penumbra = 0.5;
        spotLight.castShadow = this.minecraft.settings.spotLightCastShadow;
        spotLight.shadow.mapSize.width = 1024;
        spotLight.shadow.mapSize.height = 1024;
        spotLight.shadow.bias = -0.0001;

        let targetObj = new THREE.Object3D();

        // Hướng về mặt người chơi lúc đặt block
        let player = this.minecraft.player;
        if (player) {
            targetObj.position.set(
                player.x,
                player.y + player.getEyeHeight(),
                player.z
            );
        } else {
            targetObj.position.set(x + 0.5, y - 10, z + 0.5);
        }

        spotLight.target = targetObj;

        this.scene.add(targetObj);
        this.scene.add(spotLight);

        let helper = new THREE.SpotLightHelper(spotLight);
        helper.visible = this.minecraft.settings.showSpotLightHelper;
        this.scene.add(helper);

        // Bắt buộc cập nhật ma trận để Helper nhận diện đúng hướng ngay lúc vừa tạo
        targetObj.updateMatrixWorld();
        spotLight.updateMatrixWorld();
        helper.update();

        this.spotLights.set(key, { light: spotLight, target: targetObj, helper: helper });
    }

    removeSpotLight(x, y, z) {
        let key = `${x},${y},${z}`;
        if (this.spotLights.has(key)) {
            let obj = this.spotLights.get(key);
            this.scene.remove(obj.light);
            this.scene.remove(obj.target);
            if (obj.helper) this.scene.remove(obj.helper);
            this.spotLights.delete(key);
        }
    }

    reset() {
        if (this.minecraft.world !== null) {
            this.scene.remove(this.minecraft.world.group);
        }

        // Dọn dẹp toàn bộ đèn động (đuốc) khi thoát ra Title
        if (this.dynamicLights) {
            this.dynamicLights.forEach(light => {
                this.scene.remove(light);
            });
            this.dynamicLights.clear();
        }

        if (this.spotLights) {
            this.spotLights.forEach(obj => {
                this.scene.remove(obj.light);
                this.scene.remove(obj.target);
                if (obj.helper) this.scene.remove(obj.helper);
            });
            this.spotLights.clear();
        }

        this.webRenderer.clear();
        this.overlay.clear();
    }

    updateLightingFromSettings() {
        let settings = this.minecraft.settings;

        // Sun Light
        if (!settings.enableDayNightLighting) {
            this.ambientLight.intensity = settings.ambientIntensity;
            this.overlayAmbientLight.intensity = settings.ambientIntensity;
            this.sunLight.intensity = settings.sunIntensity;
            this.moonLight.intensity = settings.moonIntensity;
        }

        this.sunLight.castShadow = settings.sunCastShadow;
        if (this.sunLightHelper) {
            this.sunLightHelper.visible = settings.showSunLightHelper;
        }

        this.moonLight.castShadow = settings.moonCastShadow;
        if (this.moonLightHelper) {
            this.moonLightHelper.visible = settings.showMoonLightHelper;
        }

        // Dynamic Lights (Torches)
        this.dynamicLights.forEach(light => {
            light.intensity = settings.torchIntensity;
            light.distance = settings.torchDistance;
            light.castShadow = settings.torchCastShadow;
        });

        // Spotlights
        this.spotLights.forEach(obj => {
            obj.light.intensity = settings.spotLightIntensity;
            obj.light.angle = THREE.MathUtils.degToRad(settings.spotLightAngle);
            obj.light.castShadow = settings.spotLightCastShadow;
            if (obj.helper) {
                obj.helper.update();
                obj.helper.visible = settings.showSpotLightHelper;
            }
        });
    }

}