// Optimized Audio Manager for faster voice playback
class AudioManager {
    constructor() {
        this.audioPool = new Map(); // Reusable audio objects
        this.audioCache = new Map(); // Cache for generated audio
        this.currentAudio = null;
        this.isPlaying = false;
        this.maxPoolSize = 5;
        this.maxCacheSize = 10;
        this.defaultVoice = 'Zephyr';
        
        // Preload a sample audio object for immediate availability
        this.initializeAudioPool();
    }
    
    initializeAudioPool() {
        // Create a small pool of audio objects
        for (let i = 0; i < 3; i++) {
            const audio = new Audio();
            audio.preload = 'auto';
            // Set up common event listeners
            this.setupAudioEvents(audio);
            this.audioPool.set(`pool_${i}`, audio);
        }
    }
    
    setupAudioEvents(audio) {
        audio.addEventListener('loadstart', () => {
            console.log('Audio loading started');
        });
        
        audio.addEventListener('canplay', () => {
            console.log('Audio can start playing');
        });
        
        audio.addEventListener('playing', () => {
            this.isPlaying = true;
        });
        
        audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.releaseAudio(audio);
        });
        
        audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.isPlaying = false;
            this.releaseAudio(audio);
        });
    }
    
    getAvailableAudio() {
        // Try to get an available audio object from the pool
        for (const [key, audio] of this.audioPool) {
            if (!audio.src || audio.ended || audio.paused) {
                return audio;
            }
        }
        
        // If no available audio in pool, create a new one if pool isn't full
        if (this.audioPool.size < this.maxPoolSize) {
            const audio = new Audio();
            audio.preload = 'auto';
            this.setupAudioEvents(audio);
            const key = `pool_${Date.now()}`;
            this.audioPool.set(key, audio);
            return audio;
        }
        
        // If pool is full, create a temporary audio object
        const audio = new Audio();
        audio.preload = 'auto';
        this.setupAudioEvents(audio);
        return audio;
    }
    
    releaseAudio(audio) {
        // Clean up the audio object for reuse
        if (audio.src) {
            URL.revokeObjectURL(audio.src);
            audio.src = '';
        }
        audio.currentTime = 0;
    }
    
    async playAudio(audioData, options = {}) {
        try {
            // Stop any currently playing audio
            this.stopCurrentAudio();
            
            // Get an available audio object
            const audio = this.getAvailableAudio();
            this.currentAudio = audio;
            
            // Create blob and object URL
            const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Set source and play
            audio.src = audioUrl;
            
            // Set volume if specified
            if (options.volume !== undefined) {
                audio.volume = Math.max(0, Math.min(1, options.volume));
            }
            
            // Play immediately when data is available
            audio.load(); // Force loading
            
            // Return a promise that resolves when playback starts
            return new Promise((resolve, reject) => {
                const onCanPlay = () => {
                    audio.removeEventListener('canplay', onCanPlay);
                    audio.removeEventListener('error', onError);
                    audio.play().then(resolve).catch(reject);
                };
                
                const onError = (e) => {
                    audio.removeEventListener('canplay', onCanPlay);
                    audio.removeEventListener('error', onError);
                    this.releaseAudio(audio);
                    reject(e);
                };
                
                audio.addEventListener('canplay', onCanPlay);
                audio.addEventListener('error', onError);
            });
            
        } catch (error) {
            console.error('Error playing audio:', error);
            throw error;
        }
    }
    
    stopCurrentAudio() {
        if (this.currentAudio && !this.currentAudio.paused) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.releaseAudio(this.currentAudio);
        }
        this.isPlaying = false;
    }
    
    // Cache management for frequently used audio
    cacheAudio(key, audioData) {
        if (this.audioCache.size >= this.maxCacheSize) {
            // Remove oldest entry
            const firstKey = this.audioCache.keys().next().value;
            this.audioCache.delete(firstKey);
        }
        this.audioCache.set(key, audioData);
    }
    
    getCachedAudio(key) {
        return this.audioCache.get(key);
    }
    
    // Optimized TTS request with chunking support
    async requestTTS(text, voice = null, prompt = "Say the following in a natural way") {
        try {
            // Check cache first
            const cacheKey = `${voice || this.defaultVoice}_${text.slice(0, 50)}`;
            const cachedAudio = this.getCachedAudio(cacheKey);
            if (cachedAudio) {
                console.log('Using cached audio');
                return cachedAudio;
            }
            
            const requestData = {
                text: text,
                voice: voice,
                prompt: prompt
            };
            
            // Use generate-tts endpoint for person game, test-voice for settings
            const endpoint = voice ? '/api/test-voice' : '/api/generate-tts';
            
            console.log('Making TTS request to:', endpoint);
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                throw new Error(`TTS request failed: ${response.status} ${response.statusText}`);
            }
            
            const audioData = await response.arrayBuffer();
            
            // Cache the audio data for future use
            this.cacheAudio(cacheKey, audioData);
            
            return audioData;
            
        } catch (error) {
            console.error('TTS request failed:', error);
            throw error;
        }
    }
    
    // High-level interface for playing TTS
    async playTTS(text, voice = null, prompt = "Say the following in a natural way", options = {}) {
        try {
            // Show loading state immediately
            if (options.onStart) {
                options.onStart();
            }
            
            // Request audio data
            const audioData = await this.requestTTS(text, voice, prompt);
            
            // Play the audio
            await this.playAudio(audioData, options);
            
            if (options.onSuccess) {
                options.onSuccess();
            }
            
        } catch (error) {
            console.error('Error playing TTS:', error);
            if (options.onError) {
                options.onError(error);
            }
            throw error;
        }
    }
}

// Create global audio manager instance
window.audioManager = new AudioManager();
