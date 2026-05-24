import Block from "../world/block/Block.js";
import * as THREE from "../../../../../../libraries/three.module.js";

export default class SoundManager {

    constructor() {
        this.audioLoader = new THREE.AudioLoader();
        this.audioListener = null;

        this.soundPool = {};
        this._trackChanging = false;
        this.rainAudio = null;
    }

    create(worldRenderer) {
        this.scene = worldRenderer.scene;

        this.audioListener = new THREE.AudioListener();
        worldRenderer.camera.add(this.audioListener);

        // Load initial sound pool
        for (let i in Block.sounds) {
            let sound = Block.sounds[i];

            // Load sound types
            this.loadSoundPool(sound.getStepSound());
        }

        // Khởi tạo và tải âm thanh mưa loop
        this.rainAudio = new THREE.Audio(this.audioListener);
        this.audioLoader.load('src/resources/sound/ambient/weather/rain.ogg', buffer => {
            this.rainAudio.setBuffer(buffer);
            this.rainAudio.setLoop(true);
            this.rainAudio.setVolume(0);
        });

        // Initialize and start the soundtrack
        this.initSoundtrack();
    }

    loadSoundPool(name) {
        let pool = [];
        let amount = 4;

        // Load all sounds into pool
        let path = name.replace(".", "/");
        for (let i = 0; i < amount; i++) {
            let sound = this.loadSound('src/resources/sound/' + path + (i + 1) + '.ogg');
            pool.push(sound);
        }

        // Register sound pool
        this.soundPool[name] = pool;
    }

    loadSound(path) {
        if (!this.isCreated()) {
            return;
        }

        // Create sound
        let sound = new THREE.PositionalAudio(this.audioListener);
        sound.setRefDistance(0.1);
        sound.setRolloffFactor(6);
        sound.setFilter(sound.context.createBiquadFilter());
        sound.setVolume(0);

        // Load sound
        this.audioLoader.load(path, buffer => {
            sound.setBuffer(buffer);
            this.scene.add(sound);
        });

        return sound;
    }

    playSound(name, x, y, z, volume, pitch) {
        let pool = this.soundPool[name];

        if (typeof pool === "undefined") {
            // Load sound pool
            this.loadSoundPool(name);
        } else if (pool.length > 0) {
            // Play random sound in pool
            let sound = pool[Math.floor(Math.random() * pool.length)];
            if (typeof volume === "undefined" || typeof sound === "undefined") {
                return;
            }

            // Stop previous sound
            if (sound.isPlaying) {
                sound.stop();
            }

            // Update position
            sound.position.set(x, y, z);

            // Update volume and pitch
            sound.setVolume(volume);
            sound.filters[0].frequency.setValueAtTime(12000 * pitch, sound.context.currentTime);

            // Play sound
            sound.offset = 0;
            sound.play();
        }
    }

    initSoundtrack() {
        this.soundtrackAudio = new THREE.Audio(this.audioListener);
        this.soundtrackAudio.setVolume(0.05); // moderate background music volume

        this.playlist = [];
        this.currentTrackIndex = 0;

        this.buildPlaylist();
        this.playNextTrack();
    }

    buildPlaylist() {
        const clOpener = 'src/resources/sound/soundtrack/UEFAChampions LeagueAnthem2009-2024(stadium version).ogg';
        const plOpeners = [
            'src/resources/sound/soundtrack/PremierLeaguesong.ogg',
            'src/resources/sound/soundtrack/TheOfficialPremierLeagueAnthem(OfficialAudio).ogg'
        ];
        const otherSongs = [
            'src/resources/sound/soundtrack/Ride.ogg',
            'src/resources/sound/soundtrack/RatherBe.ogg',
            'src/resources/sound/soundtrack/alorsondanse.ogg',
            'src/resources/sound/soundtrack/NorthLondonForever.ogg'
        ];

        // 1. Pick opener category: Champions League (false) or Premier League (true)
        const isPL = Math.random() < 0.5;
        let opener = '';
        let unusedOpeners = [];

        if (isPL) {
            // Pick a random PL opener
            const plIndex = Math.floor(Math.random() * plOpeners.length);
            opener = plOpeners[plIndex];
            unusedOpeners = [clOpener, ...plOpeners.filter((_, idx) => idx !== plIndex)];
        } else {
            opener = clOpener;
            unusedOpeners = [...plOpeners];
        }

        // 2. The remaining tracks are unused openers + other songs
        const remainingTracks = [...unusedOpeners, ...otherSongs];

        // Shuffle the remaining tracks
        for (let i = remainingTracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remainingTracks[i], remainingTracks[j]] = [remainingTracks[j], remainingTracks[i]];
        }

        // 3. Construct the playlist starting with the opener
        this.playlist = [opener, ...remainingTracks];
        this.currentTrackIndex = 0;
    }

    playNextTrack() {
        if (this._trackChanging) return;
        this._trackChanging = true;

        if (this.currentTrackIndex >= this.playlist.length) {
            // Rebuild playlist with a freshly rolled opener
            this.buildPlaylist();
        }

        let trackPath = this.playlist[this.currentTrackIndex];
        console.log('[Soundtrack] Playing track ' + (this.currentTrackIndex + 1) + '/' + this.playlist.length + ': ' + trackPath);

        this.audioLoader.load(trackPath, buffer => {
            if (this.soundtrackAudio.isPlaying) {
                this.soundtrackAudio.stop();
            }
            this.soundtrackAudio.setBuffer(buffer);
            this.soundtrackAudio.play();

            this._trackChanging = false;

            // Hook onto the underlying AudioBufferSourceNode to detect track end
            const src = this.soundtrackAudio.source;
            if (src) {
                src.onended = () => {
                    // Ignore if another transition is already in progress
                    if (this._trackChanging) return;
                    this.currentTrackIndex++;
                    this.playNextTrack();
                };
            } else {
                // Fallback: schedule next track after the buffer duration
                const durationMs = (buffer.duration || 30) * 1000;
                setTimeout(() => {
                    if (this._trackChanging) return;
                    this.currentTrackIndex++;
                    this.playNextTrack();
                }, durationMs);
            }
        }, undefined, error => {
            console.error('[Soundtrack] Failed to load track: ' + trackPath, error);
            this._trackChanging = false;
            this.currentTrackIndex++;
            this.playNextTrack();
        });
    }

    updateWeatherSound(isRaining, rainStrength) {
        if (!this.rainAudio || !this.rainAudio.buffer) return;

        if (isRaining && rainStrength > 0) {
            if (!this.rainAudio.isPlaying) {
                this.rainAudio.play();
            }
            // Giảm âm lượng một chút để không lấn át nhạc nền (tối đa 0.25)
            this.rainAudio.setVolume(rainStrength * 0.25);
        } else {
            if (this.rainAudio.isPlaying) {
                this.rainAudio.pause();
            }
        }
    }

    isCreated() {
        return !(this.audioListener === null);
    }

}