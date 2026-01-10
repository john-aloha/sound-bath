/**
 * Sound Bath Sanctuary - Audio Engine
 * Uses Web Audio API to synthesize realistic instrument sounds
 */

class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.analyser = null;
        this.isInitialized = false;
        this.activeOscillators = new Map();
        this.reverbNode = null;
    }

    async initialize() {
        if (this.isInitialized) return true;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Master gain
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.7;

            // Create reverb
            this.reverbNode = await this.createReverb();

            // Analyser for visualization
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;

            // Connect: reverb -> analyser -> master -> destination
            this.reverbNode.connect(this.analyser);
            this.analyser.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Audio initialization failed:', error);
            return false;
        }
    }

    async createReverb() {
        const convolver = this.audioContext.createConvolver();
        const duration = 4;
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }

        convolver.buffer = impulse;
        return convolver;
    }

    setMasterVolume(value) {
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(value, this.audioContext.currentTime, 0.1);
        }
    }

    getAnalyserData() {
        if (!this.analyser) return null;
        const data = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(data);
        return data;
    }

    // Crystal Singing Bowl - Pure sine waves with harmonics
    playCrystalBowl(frequency, style = 'strike', duration = 8) {
        const id = `crystal_${frequency}_${Date.now()}`;
        const now = this.audioContext.currentTime;

        // Create oscillators for fundamental and harmonics
        const oscillators = [];
        const gains = [];
        const harmonicRatios = [1, 2, 3, 4.2, 5.4];
        const harmonicAmplitudes = [1, 0.3, 0.15, 0.08, 0.04];

        const masterGain = this.audioContext.createGain();
        masterGain.connect(this.reverbNode);

        harmonicRatios.forEach((ratio, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = frequency * ratio;

            // Add slight detuning for richness
            osc.detune.value = (Math.random() - 0.5) * 5;

            gain.gain.value = 0;

            osc.connect(gain);
            gain.connect(masterGain);

            oscillators.push(osc);
            gains.push(gain);
        });

        // Envelope based on style
        let attack, sustain, release;
        if (style === 'strike') {
            attack = 0.01;
            sustain = duration * 0.2;
            release = duration * 0.8;
        } else if (style === 'rim') {
            attack = 0.5;
            sustain = duration * 0.5;
            release = duration * 0.5;
        } else { // gentle
            attack = 0.3;
            sustain = duration * 0.3;
            release = duration * 0.5;
        }

        // Apply envelope
        gains.forEach((gain, index) => {
            const amplitude = harmonicAmplitudes[index] * 0.15;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(amplitude, now + attack);
            gain.gain.setValueAtTime(amplitude, now + attack + sustain);
            gain.gain.exponentialRampToValueAtTime(0.001, now + attack + sustain + release);
        });

        oscillators.forEach(osc => {
            osc.start(now);
            osc.stop(now + duration);
        });

        this.activeOscillators.set(id, { oscillators, gains, masterGain });

        setTimeout(() => {
            this.activeOscillators.delete(id);
        }, duration * 1000);

        return id;
    }

    // Tibetan Bowl - Rich metallic overtones
    playTibetanBowl(frequency, style = 'mallet', duration = 10) {
        const id = `tibetan_${frequency}_${Date.now()}`;
        const now = this.audioContext.currentTime;

        const oscillators = [];
        const gains = [];
        // Tibetan bowls have inharmonic partials
        const partials = [1, 2.71, 5.19, 8.5, 12.3];
        const amplitudes = [1, 0.5, 0.25, 0.12, 0.06];

        const masterGain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 4000;
        filter.Q.value = 1;

        masterGain.connect(filter);
        filter.connect(this.reverbNode);

        partials.forEach((partial, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = frequency * partial;

            // Tibetan bowls have slight beating
            osc.detune.value = (Math.random() - 0.5) * 10;

            gain.gain.value = 0;

            osc.connect(gain);
            gain.connect(masterGain);

            oscillators.push(osc);
            gains.push(gain);
        });

        let attack = style === 'mallet' ? 0.005 : 0.3;
        let amplitude = style === 'water' ? 0.08 : 0.12;

        gains.forEach((gain, index) => {
            const amp = amplitudes[index] * amplitude;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(amp, now + attack);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        });

        oscillators.forEach(osc => {
            osc.start(now);
            osc.stop(now + duration);
        });

        this.activeOscillators.set(id, { oscillators, gains, masterGain });

        setTimeout(() => {
            this.activeOscillators.delete(id);
        }, duration * 1000);

        return id;
    }

    // Gong - Complex wash of frequencies
    playGong(baseFreq, style = 'soft', duration = 15) {
        const id = `gong_${baseFreq}_${Date.now()}`;
        const now = this.audioContext.currentTime;

        const oscillators = [];
        const gains = [];

        // Gongs have very complex spectra
        const numPartials = 20;
        const masterGain = this.audioContext.createGain();

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = style === 'crash' ? 8000 : 3000;

        masterGain.connect(filter);
        filter.connect(this.reverbNode);

        for (let i = 0; i < numPartials; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            // Random-ish partial frequencies for gong complexity
            const freq = baseFreq * (1 + i * 0.7 + Math.random() * 0.3);
            osc.type = 'sine';
            osc.frequency.value = freq;
            osc.detune.value = (Math.random() - 0.5) * 20;

            gain.gain.value = 0;
            osc.connect(gain);
            gain.connect(masterGain);

            oscillators.push(osc);
            gains.push(gain);
        }

        let attack, peak;
        if (style === 'soft') {
            attack = 0.5;
            peak = 0.08;
        } else if (style === 'crescendo') {
            attack = 3;
            peak = 0.15;
        } else { // crash
            attack = 0.01;
            peak = 0.2;
        }

        gains.forEach((gain, index) => {
            const amp = peak / (1 + index * 0.3);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(amp, now + attack);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        });

        oscillators.forEach(osc => {
            osc.start(now);
            osc.stop(now + duration);
        });

        this.activeOscillators.set(id, { oscillators, gains, masterGain });

        setTimeout(() => {
            this.activeOscillators.delete(id);
        }, duration * 1000);

        return id;
    }

    // Didgeridoo - Drone with formants
    playDidgeridoo(frequency = 65, style = 'sustained', duration = 8) {
        const id = `didge_${Date.now()}`;
        const now = this.audioContext.currentTime;

        // Base drone
        const droneOsc = this.audioContext.createOscillator();
        droneOsc.type = 'sawtooth';
        droneOsc.frequency.value = frequency;

        // Formant filters
        const formant1 = this.audioContext.createBiquadFilter();
        formant1.type = 'bandpass';
        formant1.frequency.value = 200;
        formant1.Q.value = 10;

        const formant2 = this.audioContext.createBiquadFilter();
        formant2.type = 'bandpass';
        formant2.frequency.value = 800;
        formant2.Q.value = 8;

        const masterGain = this.audioContext.createGain();
        const gain1 = this.audioContext.createGain();
        const gain2 = this.audioContext.createGain();

        droneOsc.connect(gain1);
        droneOsc.connect(gain2);
        gain1.connect(formant1);
        gain2.connect(formant2);
        formant1.connect(masterGain);
        formant2.connect(masterGain);
        masterGain.connect(this.reverbNode);

        // Add wobble for rhythmic style
        if (style === 'rhythmic') {
            const lfo = this.audioContext.createOscillator();
            const lfoGain = this.audioContext.createGain();
            lfo.frequency.value = 4;
            lfoGain.gain.value = 0.3;
            lfo.connect(lfoGain);
            lfoGain.connect(masterGain.gain);
            lfo.start(now);
            lfo.stop(now + duration);
        }

        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(0.2, now + 0.3);
        masterGain.gain.setValueAtTime(0.2, now + duration - 0.5);
        masterGain.gain.linearRampToValueAtTime(0, now + duration);

        droneOsc.start(now);
        droneOsc.stop(now + duration);

        this.activeOscillators.set(id, { oscillators: [droneOsc], gains: [masterGain], masterGain });

        setTimeout(() => {
            this.activeOscillators.delete(id);
        }, duration * 1000);

        return id;
    }

    // Pan Flute - Breathy tone
    playPanFlute(frequency, style = 'sustained', duration = 4) {
        const id = `panflute_${frequency}_${Date.now()}`;
        const now = this.audioContext.currentTime;

        // Main tone
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = frequency;

        // Breath noise
        const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }
        const noise = this.audioContext.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = frequency * 2;
        noiseFilter.Q.value = 2;

        const toneGain = this.audioContext.createGain();
        const noiseGain = this.audioContext.createGain();
        const masterGain = this.audioContext.createGain();

        osc.connect(toneGain);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        toneGain.connect(masterGain);
        noiseGain.connect(masterGain);
        masterGain.connect(this.reverbNode);

        // Add vibrato
        const vibrato = this.audioContext.createOscillator();
        const vibratoGain = this.audioContext.createGain();
        vibrato.frequency.value = 5;
        vibratoGain.gain.value = frequency * 0.01;
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);

        toneGain.gain.value = 0.15;
        noiseGain.gain.value = 0.02;

        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(1, now + 0.1);
        masterGain.gain.setValueAtTime(1, now + duration - 0.3);
        masterGain.gain.linearRampToValueAtTime(0, now + duration);

        osc.start(now);
        osc.stop(now + duration);
        noise.start(now);
        noise.stop(now + duration);
        vibrato.start(now);
        vibrato.stop(now + duration);

        this.activeOscillators.set(id, { oscillators: [osc], gains: [masterGain], masterGain });

        setTimeout(() => {
            this.activeOscillators.delete(id);
        }, duration * 1000);

        return id;
    }

    // Handpan - Metallic melodic percussion
    playHandpan(frequency, style = 'finger', duration = 5) {
        const id = `handpan_${frequency}_${Date.now()}`;
        const now = this.audioContext.currentTime;

        const oscillators = [];
        const gains = [];

        // Handpan has specific harmonic profile
        const partials = [1, 2, 3, 4.7, 6.2];
        const amplitudes = [1, 0.6, 0.3, 0.15, 0.08];

        const masterGain = this.audioContext.createGain();
        masterGain.connect(this.reverbNode);

        partials.forEach((partial, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = frequency * partial;
            osc.detune.value = (Math.random() - 0.5) * 3;

            gain.gain.value = 0;
            osc.connect(gain);
            gain.connect(masterGain);

            oscillators.push(osc);
            gains.push(gain);
        });

        let attack = style === 'ghost' ? 0.02 : 0.005;
        let amplitude = style === 'palm' ? 0.2 : style === 'ghost' ? 0.05 : 0.12;

        gains.forEach((gain, index) => {
            const amp = amplitudes[index] * amplitude;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(amp, now + attack);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        });

        oscillators.forEach(osc => {
            osc.start(now);
            osc.stop(now + duration);
        });

        this.activeOscillators.set(id, { oscillators, gains, masterGain });

        setTimeout(() => {
            this.activeOscillators.delete(id);
        }, duration * 1000);

        return id;
    }

    stopAll() {
        this.activeOscillators.forEach((data, id) => {
            try {
                data.oscillators.forEach(osc => osc.stop());
            } catch (e) { }
        });
        this.activeOscillators.clear();
    }
}

// Export singleton
window.audioEngine = new AudioEngine();
