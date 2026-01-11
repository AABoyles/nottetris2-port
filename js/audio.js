// Audio manager for game sounds

class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.7;
        this.enabled = true;
    }

    async init() {
        // Preload all sound effects
        const soundFiles = {
            blockfall: 'sounds/blockfall.ogg',
            lineclear: 'sounds/lineclear.ogg',
            lineclear4: 'sounds/4lineclear.ogg',
            move: 'sounds/move.ogg',
            turn: 'sounds/turn.ogg',
            pause: 'sounds/pause.ogg',
            gameover: 'sounds/gameover1.ogg',
            newlevel: 'sounds/newlevel.ogg',
            boot: 'sounds/boot.ogg'
        };

        const musicFiles = {
            title: 'sounds/titlemusic.ogg',
            themeA: 'sounds/themeA.ogg'
        };

        // Load sound effects
        for (const [name, path] of Object.entries(soundFiles)) {
            try {
                this.sounds[name] = new Audio(path);
                this.sounds[name].volume = this.sfxVolume;
            } catch (e) {
                console.warn(`Failed to load sound: ${path}`);
            }
        }

        // Load music
        for (const [name, path] of Object.entries(musicFiles)) {
            try {
                const audio = new Audio(path);
                audio.volume = this.musicVolume;
                audio.loop = true;
                this.sounds[`music_${name}`] = audio;
            } catch (e) {
                console.warn(`Failed to load music: ${path}`);
            }
        }
    }

    play(name) {
        if (!this.enabled) return;

        const sound = this.sounds[name];
        if (sound) {
            // Clone the audio for overlapping sounds
            const clone = sound.cloneNode();
            clone.volume = this.sfxVolume;
            clone.play().catch(() => {
                // Ignore autoplay errors
            });
        }
    }

    playMusic(name) {
        if (!this.enabled) return;

        // Stop current music
        this.stopMusic();

        const music = this.sounds[`music_${name}`];
        if (music) {
            this.music = music;
            this.music.currentTime = 0;
            this.music.play().catch(() => {
                // Ignore autoplay errors
            });
        }
    }

    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
            this.music = null;
        }
    }

    pauseMusic() {
        if (this.music) {
            this.music.pause();
        }
    }

    resumeMusic() {
        if (this.music && this.enabled) {
            this.music.play().catch(() => {});
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopMusic();
        }
        return this.enabled;
    }
}

export const audio = new AudioManager();
