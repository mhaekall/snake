class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Play a short "pep" sound for eating food
    playEat() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    // Deep boom for skill activation
    playSkillActivate() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(55, this.ctx.currentTime + 0.5);
        
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }

    // High pitched "ping" for skill ready
    playSkillReady() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    // Glissando for game over
    playGameOver() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 1);
        
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 1);
    }

    // Short whoosh for dodge
    playDodge() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    // --- Dynamic BGM System ---
    initBGM() {
        if (this.bgmLoop) return;

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        this.bgmGain.connect(this.ctx.destination);

        this.tempo = 120; // BPM
        this.isSkillIntense = false;
        
        this.startBGM();
    }

    startBGM() {
        const playTick = () => {
            const now = this.ctx.currentTime;
            const secondsPerBeat = 60.0 / this.tempo;

            // Kick Drum
            this.createKick(now);

            // Bass Synth
            this.createBass(now, this.isSkillIntense ? 110 : 55);

            // Hi-hat (only during skill)
            if (this.isSkillIntense) {
                this.createHat(now + secondsPerBeat / 2);
            }

            this.bgmLoop = setTimeout(playTick, secondsPerBeat * 500); // 8th note feel
        };
        playTick();
    }

    createKick(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.linearRampToValueAtTime(0, time + 0.1);
        osc.connect(gain);
        gain.connect(this.bgmGain);
        osc.start(time);
        osc.stop(time + 0.1);
    }

    createBass(time, freq) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.05, time);
        gain.gain.linearRampToValueAtTime(0, time + 0.15);
        osc.connect(gain);
        gain.connect(this.bgmGain);
        osc.start(time);
        osc.stop(time + 0.15);
    }

    createHat(time) {
        const noise = this.ctx.createBufferSource();
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 5000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.03, time);
        gain.gain.linearRampToValueAtTime(0, time + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);
        noise.start(time);
    }

    setIntensity(isSkillActive) {
        this.isSkillIntense = isSkillActive;
    }

    updateTempo(score) {
        // Tempo increases slightly with score
        this.tempo = 120 + Math.min(60, Math.floor(score / 50) * 5);
    }

    stopBGM() {
        if (this.bgmLoop) {
            clearTimeout(this.bgmLoop);
            this.bgmLoop = null;
        }
    }
}
