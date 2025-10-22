class AudioManager {
    constructor() {
        this.isInitialized = false;
        this.isInitializing = false; 
        this.players = {};
        this.reverb = null;
        this.activeSounds = new Set();
        this.lastHoverSoundTime = 0;
        this.lastPlayedSound = null; 
    }

    async init() {
        if (this.isInitialized || this.isInitializing) {
            return;
        }
        this.isInitializing = true;
        console.log('🎧 Iniciando contexto de audio...');

        try {
            await Tone.start();
            console.log('Tone.js inicializado correctamente');

            this.reverb = new Tone.Reverb({
                decay: 1.5,
                wet: 0.4
            }).toDestination();

            const loadPromises = Object.entries(categoryConfig).map(([category, config]) => {
                return new Promise((resolve, reject) => {
                    const player = new Tone.Player({
                        url: config.soundFile,
                        onload: () => {
                            console.log(` -> ${config.soundFile} cargado.`);
                            resolve();
                        },
                        onerror: (err) => {
                            console.error(`Error al cargar ${config.soundFile}:`, err);
                            reject(err);
                        }
                    }).connect(this.reverb);
                    this.players[category] = player;
                });
            });
            
            await Promise.all(loadPromises);
            this.isInitialized = true;
            console.log('✅ Todos los sonidos cargados.');

        } catch (error) {
            console.error('Error al inicializar audio:', error);
        } finally {
            this.isInitializing = false;
        }
    }

    async ensureInitialized() {
        if (!this.isInitialized && !this.isInitializing) {
            await this.init();
        }
        while (this.isInitializing) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    async playEventSound(event) {
        await this.ensureInitialized();
        if (!this.isInitialized || !event) return;

        if (this.lastPlayedSound && this.lastPlayedSound.state === 'started') {
            this.lastPlayedSound.stop();
        }

        const player = this.players[event.category];
        if (player && player.loaded) {
            player.start();
            this.activeSounds.add(player);
            this.lastPlayedSound = player; 
            player.onstop = () => {
                this.activeSounds.delete(player);
            };
        }
    }
    
    async playHoverSound(event) {
        await this.ensureInitialized();
        if (!this.isInitialized || !event) return;

        const now = Tone.now();
        if (now - this.lastHoverSoundTime < 0.4) {
            return;
        }
        this.lastHoverSoundTime = now;

        if (this.lastPlayedSound && this.lastPlayedSound.state === 'started') {
            this.lastPlayedSound.stop();
        }

        const player = this.players[event.category];
        if (player && player.loaded) {
            const tempPlayer = new Tone.Player().toDestination();
            tempPlayer.buffer = player.buffer;
            tempPlayer.volume.value = -10; 
            tempPlayer.start();
            this.lastPlayedSound = tempPlayer; 
        }
    }

    stopAllSounds() {
        this.activeSounds.forEach(player => {
            if (player.state === "started") {
                player.stop();
            }
        });
        this.activeSounds.clear();
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




