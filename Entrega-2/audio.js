class AudioManager {
    constructor() {
        this.isInitialized = false;
        this.players = {};
        this.reverb = null;
        this.activeSounds = new Set();
        this.lastHoverSoundTime = 0;
        this.currentSound = null;
        this.isMuted = false;
        this.volumeLevel = 25; 
    }

    async init() {
        if (this.isInitialized) return true;
        if (Tone.context.state !== 'running') {
            try {
                await Tone.start();
            } catch (e) {
                console.error("User gesture needed to start audio.", e);
                return false;
            }
        }

        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            try {
                console.log('🎧 Initializing Tone.js...');
                
                this.reverb = new Tone.Reverb({
                    decay: 1.5,
                    wet: 0.4
                }).toDestination();

                const loadPromises = Object.entries(categoryConfig).map(([category, config]) => {
                    return new Promise((resolve, reject) => {
                        const player = new Tone.Player({
                            url: config.soundFile,
                            onload: () => {
                                console.log(`🔊 ${config.soundFile} loaded.`);
                                resolve();
                            },
                            onerror: (err) => {
                                console.error(`❌ Error loading ${config.soundFile}:`, err);
                                reject(err);
                            }
                        }).connect(this.reverb);
                        this.players[category] = player;
                    });
                });
                
                await Promise.all(loadPromises);
                this.isInitialized = true;
                console.log('✅ All sounds loaded.');
                
                const volumeSlider = document.getElementById('volumeSlider');
                if (volumeSlider) {
                    this.setVolume(parseInt(volumeSlider.value));
                }

                return true;
            } catch (error) {
                console.error('Error initializing audio:', error);
                this.isInitialized = false;
                return false;
            } finally {
                this.initPromise = null;
            }
        })();
        return this.initPromise;
    }

    setVolume(level) {
        this.volumeLevel = level;
        if (this.isMuted && level > 0) {
            this.isMuted = false;
        }

        if (Tone && Tone.Destination) {
            if (this.isMuted || level === 0) {
                Tone.Destination.volume.value = -Infinity;
            } else {
                const db = (level / 100) * 40 - 40;
                Tone.Destination.volume.value = db;
            }
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            Tone.Destination.volume.value = -Infinity;
        } else {
            const newVolume = this.volumeLevel === 0 ? 25 : this.volumeLevel;
            this.setVolume(newVolume);
        }
        const currentVolume = this.isMuted ? 0 : this.volumeLevel;
        return { isMuted: this.isMuted, volume: currentVolume };
    }


    _playSound(event, isHover = false) {
        if (!this.isInitialized || !event) return;

        const player = this.players[event.category];
        if (player && player.loaded) {
            if (this.currentSound && this.currentSound.state === "started") {
                this.currentSound.stop();
            }

            player.start();
            this.currentSound = player;

            if (!isHover) {
                this.activeSounds.add(player);
                player.onstop = () => {
                    this.activeSounds.delete(player);
                    if (this.currentSound === player) {
                        this.currentSound = null;
                    }
                };
            }
        }
    }

    playEventSound(event) {
        this._playSound(event, false);
    }
    
    async playHoverSound(event) {
        const ready = await this.init();
        if (!ready) return;

        const now = Date.now();
        if (now - this.lastHoverSoundTime < 200) {
            return;
        }
        this.lastHoverSoundTime = now;
        
        this._playSound(event, true);
    }

    stopAllSounds() {
        if (this.currentSound && this.currentSound.state === "started") {
            this.currentSound.stop();
        }
        this.activeSounds.forEach(player => {
            if (player.state === "started") {
                player.stop();
            }
        });
        this.activeSounds.clear();
        this.currentSound = null;
    }

    dispose() {
        this.stopAllSounds();
        Object.values(this.players).forEach(player => player.dispose());
        if (this.reverb) this.reverb.dispose();
        this.players = {};
        this.isInitialized = false;
    }
}

const audioManager = new AudioManager();

