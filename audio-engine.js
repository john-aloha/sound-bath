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
        this.idCounter = 0;
        this.maxPolyphony = 32; // Limit simultaneous sounds
        this.ambientSource = null;
        this.ambientGain = null;
        this.isAmbientPlaying = false;
    }

    async initialize() {
        if (this.isInitialized) return true;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Handle suspended audio context (browser autoplay restrictions)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

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

    async ensureAudioContext() {
        if (!this.audioContext) return false;
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (error) {
                console.error('Failed to resume audio context:', error);
                return false;
            }
        }
        return this.audioContext.state === 'running';
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

    generateId(type) {
        return `${type}_${++this.idCounter}`;
    }

    scheduleCleanup(id, oscillator) {
        oscillator.onended = () => {
            this.activeOscillators.delete(id);
        };
    }

    enforcePolyphony() {
        // Remove oldest sounds if we exceed max polyphony
        while (this.activeOscillators.size >= this.maxPolyphony) {
            const oldestId = this.activeOscillators.keys().next().value;
            const oldest = this.activeOscillators.get(oldestId);
            if (oldest) {
                try {
                    oldest.oscillators.forEach(osc => osc.stop());
                } catch (e) {
                    // Already stopped
                }
                this.activeOscillators.delete(oldestId);
            }
        }
    }

    // Ambient ocean waves sound
    startAmbient() {
        if (this.isAmbientPlaying || !this.audioContext) return;

        // Create pink noise for ocean waves
        const bufferSize = this.audioContext.sampleRate * 10; // 10 seconds loop
        const noiseBuffer = this.audioContext.createBuffer(2, bufferSize, this.audioContext.sampleRate);

        // Generate pink noise with wave-like modulation
        for (let channel = 0; channel < 2; channel++) {
            const data = noiseBuffer.getChannelData(channel);
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;

                // Pink noise filter (Paul Kellet's algorithm)
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;

                const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                b6 = white * 0.115926;

                // Wave-like amplitude modulation
                const waveEnvelope = 0.3 + 0.7 * Math.pow(Math.sin(i / (bufferSize / 6) * Math.PI), 2);
                data[i] = pink * 0.05 * waveEnvelope;
            }
        }

        this.ambientSource = this.audioContext.createBufferSource();
        this.ambientSource.buffer = noiseBuffer;
        this.ambientSource.loop = true;

        // Low-pass filter for softer ocean sound
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 0.5;

        // Gain for fade in/out
        this.ambientGain = this.audioContext.createGain();
        this.ambientGain.gain.value = 0;

        // Connect: source -> filter -> gain -> reverb
        this.ambientSource.connect(filter);
        filter.connect(this.ambientGain);
        this.ambientGain.connect(this.reverbNode);

        this.ambientSource.start();

        // Fade in
        this.ambientGain.gain.setTargetAtTime(0.4, this.audioContext.currentTime, 1);
        this.isAmbientPlaying = true;
    }

    stopAmbient() {
        if (!this.isAmbientPlaying || !this.ambientGain) return;

        // Fade out
        const now = this.audioContext.currentTime;
        this.ambientGain.gain.setTargetAtTime(0, now, 0.5);

        // Stop after fade
        setTimeout(() => {
            if (this.ambientSource) {
                try {
                    this.ambientSource.stop();
                } catch (e) {
                    // Already stopped
                }
                this.ambientSource = null;
            }
            this.ambientGain = null;
            this.isAmbientPlaying = false;
        }, 2000);
    }

    toggleAmbient() {
        if (this.isAmbientPlaying) {
            this.stopAmbient();
            return false;
        } else {
            this.startAmbient();
            return true;
        }
    }

    // Crystal Singing Bowl - Pure sine waves with harmonics
    playCrystalBowl(frequency, style = 'strike', duration = 8) {
        this.enforcePolyphony();
        const id = this.generateId('crystal');
        const now = this.audioContext.currentTime;

        const oscillators = [];
        const gains = [];
        const masterGain = this.audioContext.createGain();

        // Style-specific parameters
        let harmonicRatios, harmonicAmplitudes, attack, sustain, release, peakAmp, filterFreq;

        if (style === 'strike') {
            // Sharp mallet strike - bright, immediate, clear bell tone
            harmonicRatios = [1, 2, 3, 4, 5.2, 6.5];
            harmonicAmplitudes = [1, 0.5, 0.35, 0.2, 0.1, 0.05];
            attack = 0.003;
            sustain = duration * 0.15;
            release = duration * 0.85;
            peakAmp = 0.18;
            filterFreq = 8000;
        } else if (style === 'rim') {
            // Rim singing - slow build with singing/ringing quality, wobble
            harmonicRatios = [1, 2, 2.98, 4.01, 5]; // slight detuning creates beating
            harmonicAmplitudes = [1, 0.7, 0.5, 0.3, 0.15];
            attack = 2.5;
            sustain = duration * 0.5;
            release = duration * 0.3;
            peakAmp = 0.12;
            filterFreq = 5000;
        } else { // gentle
            // Gentle touch - soft, warm, muted, ethereal
            harmonicRatios = [1, 2, 3];
            harmonicAmplitudes = [1, 0.15, 0.05];
            attack = 0.8;
            sustain = duration * 0.3;
            release = duration * 0.5;
            peakAmp = 0.08;
            filterFreq = 2500;
        }

        // Add filter for tonal shaping
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;
        filter.Q.value = 0.7;

        masterGain.connect(filter);
        filter.connect(this.reverbNode);

        harmonicRatios.forEach((ratio, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = frequency * ratio;
            osc.detune.value = (Math.random() - 0.5) * 5;

            gain.gain.value = 0;
            osc.connect(gain);
            gain.connect(masterGain);

            oscillators.push(osc);
            gains.push(gain);

            // Apply envelope
            const amplitude = harmonicAmplitudes[index] * peakAmp;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(amplitude, now + attack);
            gain.gain.setValueAtTime(amplitude, now + attack + sustain);
            gain.gain.exponentialRampToValueAtTime(0.001, now + attack + sustain + release);

            // Rim style: add slow pitch wobble for singing effect
            if (style === 'rim' && index === 0) {
                const lfo = this.audioContext.createOscillator();
                const lfoGain = this.audioContext.createGain();
                lfo.frequency.value = 0.5 + Math.random() * 0.3; // slow wobble
                lfoGain.gain.value = frequency * 0.003; // subtle pitch variation
                lfo.connect(lfoGain);
                lfoGain.connect(osc.frequency);
                lfo.start(now);
                lfo.stop(now + duration);
            }
        });

        oscillators.forEach(osc => {
            osc.start(now);
            osc.stop(now + duration);
        });

        this.activeOscillators.set(id, { oscillators, gains, masterGain });
        this.scheduleCleanup(id, oscillators[0]);

        return id;
    }

    // Tibetan Bowl - Rich metallic overtones
    playTibetanBowl(frequency, style = 'mallet', duration = 10) {
        this.enforcePolyphony();
        const id = this.generateId('tibetan');
        const now = this.audioContext.currentTime;

        const oscillators = [];
        const gains = [];
        const masterGain = this.audioContext.createGain();

        // Style-specific parameters
        let partials, amplitudes, attack, peakAmp, filterFreq, filterQ, detuneAmount;

        if (style === 'mallet') {
            // Sharp mallet strike - full metallic spectrum, quick attack
            partials = [1, 2.71, 5.19, 8.5, 12.3, 15.8];
            amplitudes = [1, 0.6, 0.35, 0.2, 0.1, 0.05];
            attack = 0.002;
            peakAmp = 0.14;
            filterFreq = 6000;
            filterQ = 0.5;
            detuneAmount = 8;
        } else if (style === 'singing') {
            // Singing bowl - gradual build with prominent beating/wobble
            partials = [1, 2.71, 5.19, 8.5];
            amplitudes = [1, 0.8, 0.4, 0.15];
            attack = 3;
            peakAmp = 0.1;
            filterFreq = 4000;
            filterQ = 1;
            detuneAmount = 15; // more beating
        } else { // water
            // Water bowl - bubbling modulation, muted, mysterious
            partials = [1, 2.71, 5.19];
            amplitudes = [1, 0.4, 0.15];
            attack = 0.5;
            peakAmp = 0.08;
            filterFreq = 2000;
            filterQ = 2;
            detuneAmount = 5;
        }

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;
        filter.Q.value = filterQ;

        masterGain.connect(filter);
        filter.connect(this.reverbNode);

        partials.forEach((partial, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = frequency * partial;
            osc.detune.value = (Math.random() - 0.5) * detuneAmount;

            gain.gain.value = 0;
            osc.connect(gain);
            gain.connect(masterGain);

            oscillators.push(osc);
            gains.push(gain);

            const amp = amplitudes[index] * peakAmp;

            if (style === 'singing') {
                // Singing: slow swell, sustained peak, gradual decay
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(amp * 0.3, now + attack * 0.5);
                gain.gain.linearRampToValueAtTime(amp, now + attack);
                gain.gain.setValueAtTime(amp, now + attack + duration * 0.3);
                gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

                // Add amplitude wobble for singing effect
                if (index === 0) {
                    const lfo = this.audioContext.createOscillator();
                    const lfoGain = this.audioContext.createGain();
                    lfo.frequency.value = 3 + Math.random() * 2;
                    lfoGain.gain.value = amp * 0.15;
                    lfo.connect(lfoGain);
                    lfoGain.connect(gain.gain);
                    lfo.start(now + attack * 0.5);
                    lfo.stop(now + duration);
                }
            } else if (style === 'water') {
                // Water: bubbling amplitude modulation
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(amp, now + attack);

                // Create bubbling effect with irregular modulation
                const bubbleLfo = this.audioContext.createOscillator();
                const bubbleGain = this.audioContext.createGain();
                bubbleLfo.type = 'sine';
                bubbleLfo.frequency.value = 2 + Math.random() * 3;
                bubbleGain.gain.value = amp * 0.4;
                bubbleLfo.connect(bubbleGain);
                bubbleGain.connect(gain.gain);
                bubbleLfo.start(now);
                bubbleLfo.stop(now + duration);

                // Pitch wobble for water movement
                const pitchLfo = this.audioContext.createOscillator();
                const pitchGain = this.audioContext.createGain();
                pitchLfo.frequency.value = 0.3 + Math.random() * 0.5;
                pitchGain.gain.value = frequency * partial * 0.008;
                pitchLfo.connect(pitchGain);
                pitchGain.connect(osc.frequency);
                pitchLfo.start(now);
                pitchLfo.stop(now + duration);

                gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            } else {
                // Mallet: immediate attack, natural decay
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(amp, now + attack);
                gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            }
        });

        oscillators.forEach(osc => {
            osc.start(now);
            osc.stop(now + duration);
        });

        this.activeOscillators.set(id, { oscillators, gains, masterGain });
        this.scheduleCleanup(id, oscillators[0]);

        return id;
    }

    // Gong - Complex wash of frequencies
    playGong(baseFreq, style = 'soft', duration = 15) {
        this.enforcePolyphony();
        const id = this.generateId('gong');
        const now = this.audioContext.currentTime;

        const oscillators = [];
        const gains = [];
        const masterGain = this.audioContext.createGain();

        // Style-specific parameters
        let numPartials, attack, peak, filterFreq, filterQ, partialSpread, detuneRange;

        if (style === 'soft') {
            // Soft mallet - warm, controlled, focused low-end
            numPartials = 12;
            attack = 0.8;
            peak = 0.07;
            filterFreq = 1500;
            filterQ = 0.5;
            partialSpread = 0.5;
            detuneRange = 10;
        } else if (style === 'crescendo') {
            // Crescendo - dramatic build, expanding spectrum
            numPartials = 18;
            attack = 5;
            peak = 0.12;
            filterFreq = 4000;
            filterQ = 0.7;
            partialSpread = 0.6;
            detuneRange = 15;
        } else { // crash
            // Full crash - explosive, bright, chaotic
            numPartials = 30;
            attack = 0.001;
            peak = 0.25;
            filterFreq = 12000;
            filterQ = 0.5;
            partialSpread = 0.9;
            detuneRange = 50;
        }

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;
        filter.Q.value = filterQ;

        masterGain.connect(filter);
        filter.connect(this.reverbNode);

        // For crescendo, animate the filter opening
        if (style === 'crescendo') {
            filter.frequency.setValueAtTime(800, now);
            filter.frequency.linearRampToValueAtTime(filterFreq, now + attack);
            filter.frequency.setValueAtTime(filterFreq, now + attack + 2);
            filter.frequency.exponentialRampToValueAtTime(600, now + duration);
        }

        // CRASH: Add noise burst for metallic attack transient
        if (style === 'crash') {
            // Dramatic filter sweep: bright attack -> darker sustain
            filter.frequency.setValueAtTime(filterFreq, now);
            filter.frequency.exponentialRampToValueAtTime(3000, now + 0.3);
            filter.frequency.exponentialRampToValueAtTime(1200, now + 2);
            filter.frequency.exponentialRampToValueAtTime(400, now + duration);

            // Create noise burst for the crash transient
            const noiseLength = this.audioContext.sampleRate * 0.5;
            const noiseBuffer = this.audioContext.createBuffer(2, noiseLength, this.audioContext.sampleRate);
            for (let ch = 0; ch < 2; ch++) {
                const data = noiseBuffer.getChannelData(ch);
                for (let i = 0; i < noiseLength; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / noiseLength, 0.5);
                }
            }
            const noiseSource = this.audioContext.createBufferSource();
            noiseSource.buffer = noiseBuffer;

            // Bandpass filter for metallic noise character
            const noiseFilter = this.audioContext.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = baseFreq * 8;
            noiseFilter.Q.value = 0.8;

            // High-pass to remove mud
            const noiseHiPass = this.audioContext.createBiquadFilter();
            noiseHiPass.type = 'highpass';
            noiseHiPass.frequency.value = 200;

            const noiseGain = this.audioContext.createGain();
            noiseGain.gain.setValueAtTime(0.35, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

            noiseSource.connect(noiseFilter);
            noiseFilter.connect(noiseHiPass);
            noiseHiPass.connect(noiseGain);
            noiseGain.connect(filter);
            noiseSource.start(now);
            noiseSource.stop(now + 0.5);
        }

        for (let i = 0; i < numPartials; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            // Partial frequencies - more chaotic for crash
            const freq = baseFreq * (1 + i * partialSpread + Math.random() * 0.3);
            osc.type = 'sine';
            osc.frequency.value = freq;
            osc.detune.value = (Math.random() - 0.5) * detuneRange;

            gain.gain.value = 0;
            osc.connect(gain);
            gain.connect(masterGain);

            oscillators.push(osc);
            gains.push(gain);

            // Amplitude decreases for higher partials
            const amp = peak / (1 + i * 0.2);

            if (style === 'soft') {
                // Soft: gentle attack, smooth decay
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(amp, now + attack);
                gain.gain.setValueAtTime(amp, now + attack + duration * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            } else if (style === 'crescendo') {
                // Crescendo: slow build with swelling intensity
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(amp * 0.2, now + attack * 0.3);
                gain.gain.linearRampToValueAtTime(amp * 0.5, now + attack * 0.6);
                gain.gain.linearRampToValueAtTime(amp, now + attack);
                gain.gain.setValueAtTime(amp, now + attack + 1);
                gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

                // Add slow shimmer for crescendo
                if (i < 5) {
                    const shimmer = this.audioContext.createOscillator();
                    const shimmerGain = this.audioContext.createGain();
                    shimmer.frequency.value = 0.5 + Math.random() * 1.5;
                    shimmerGain.gain.value = amp * 0.2;
                    shimmer.connect(shimmerGain);
                    shimmerGain.connect(gain.gain);
                    shimmer.start(now + attack * 0.5);
                    shimmer.stop(now + duration);
                }
            } else { // crash
                // CRASH: Explosive hit with fast initial decay, then long resonant tail
                const hitAmp = amp * 1.5; // louder initial hit
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(hitAmp, now + attack);
                // Fast initial decay (the "crash" part)
                gain.gain.exponentialRampToValueAtTime(hitAmp * 0.4, now + 0.08);
                gain.gain.exponentialRampToValueAtTime(hitAmp * 0.15, now + 0.3);
                // Slower resonant tail
                gain.gain.exponentialRampToValueAtTime(hitAmp * 0.05, now + 1.5);
                gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

                // Chaotic pitch movement on attack for crash texture
                const chaos = this.audioContext.createOscillator();
                const chaosGain = this.audioContext.createGain();
                chaos.frequency.value = 3 + Math.random() * 8;
                chaosGain.gain.setValueAtTime(freq * 0.03, now);
                chaosGain.gain.exponentialRampToValueAtTime(freq * 0.005, now + 0.5);
                chaosGain.gain.exponentialRampToValueAtTime(0.001, now + 2);
                chaos.connect(chaosGain);
                chaosGain.connect(osc.frequency);
                chaos.start(now);
                chaos.stop(now + 2);
            }
        }

        oscillators.forEach(osc => {
            osc.start(now);
            osc.stop(now + duration);
        });

        this.activeOscillators.set(id, { oscillators, gains, masterGain });
        this.scheduleCleanup(id, oscillators[0]);

        return id;
    }

    // Didgeridoo - Drone with formants
    playDidgeridoo(frequency = 65, style = 'sustained', duration = 8) {
        this.enforcePolyphony();
        const id = this.generateId('didge');
        const now = this.audioContext.currentTime;
        const allOscillators = [];

        // Style-specific parameters
        let formant1Freq, formant2Freq, formant1Q, formant2Q, attack, oscType;

        if (style === 'sustained') {
            // Sustained: steady, meditative drone
            formant1Freq = 200;
            formant2Freq = 800;
            formant1Q = 10;
            formant2Q = 8;
            attack = 0.5;
            oscType = 'sawtooth';
        } else if (style === 'rhythmic') {
            // Rhythmic: pulsing breath pattern
            formant1Freq = 180;
            formant2Freq = 700;
            formant1Q = 12;
            formant2Q = 10;
            attack = 0.1;
            oscType = 'sawtooth';
        } else { // melodic
            // Melodic: overtone-rich with pitch movement
            formant1Freq = 250;
            formant2Freq = 1000;
            formant1Q = 8;
            formant2Q = 6;
            attack = 0.3;
            oscType = 'sawtooth';
        }

        // Base drone
        const droneOsc = this.audioContext.createOscillator();
        droneOsc.type = oscType;
        droneOsc.frequency.value = frequency;
        allOscillators.push(droneOsc);

        // Sub-bass for depth
        const subOsc = this.audioContext.createOscillator();
        subOsc.type = 'sine';
        subOsc.frequency.value = frequency / 2;
        allOscillators.push(subOsc);

        // Formant filters
        const formant1 = this.audioContext.createBiquadFilter();
        formant1.type = 'bandpass';
        formant1.frequency.value = formant1Freq;
        formant1.Q.value = formant1Q;

        const formant2 = this.audioContext.createBiquadFilter();
        formant2.type = 'bandpass';
        formant2.frequency.value = formant2Freq;
        formant2.Q.value = formant2Q;

        // Third formant for overtone richness
        const formant3 = this.audioContext.createBiquadFilter();
        formant3.type = 'bandpass';
        formant3.frequency.value = 1400;
        formant3.Q.value = 6;

        const masterGain = this.audioContext.createGain();
        const gain1 = this.audioContext.createGain();
        const gain2 = this.audioContext.createGain();
        const gain3 = this.audioContext.createGain();
        const subGain = this.audioContext.createGain();

        droneOsc.connect(gain1);
        droneOsc.connect(gain2);
        droneOsc.connect(gain3);
        subOsc.connect(subGain);
        gain1.connect(formant1);
        gain2.connect(formant2);
        gain3.connect(formant3);
        formant1.connect(masterGain);
        formant2.connect(masterGain);
        formant3.connect(masterGain);
        subGain.connect(masterGain);
        masterGain.connect(this.reverbNode);

        gain1.gain.value = 0.5;
        gain2.gain.value = 0.35;
        gain3.gain.value = 0.15;
        subGain.gain.value = 0.2;

        if (style === 'sustained') {
            // Sustained: smooth envelope with gentle breathing movement
            masterGain.gain.setValueAtTime(0, now);
            masterGain.gain.linearRampToValueAtTime(0.2, now + attack);
            masterGain.gain.setValueAtTime(0.2, now + duration - 0.8);
            masterGain.gain.linearRampToValueAtTime(0, now + duration);

            // Gentle breath-like amplitude variation
            const breathLfo = this.audioContext.createOscillator();
            const breathGain = this.audioContext.createGain();
            breathLfo.frequency.value = 0.15;
            breathGain.gain.value = 0.03;
            breathLfo.connect(breathGain);
            breathGain.connect(masterGain.gain);
            breathLfo.start(now);
            breathLfo.stop(now + duration);
            allOscillators.push(breathLfo);

        } else if (style === 'rhythmic') {
            // Rhythmic: pulsing breath pattern with accents
            masterGain.gain.setValueAtTime(0, now);
            masterGain.gain.linearRampToValueAtTime(0.15, now + attack);

            // Strong rhythmic pulsing
            const rhythmLfo = this.audioContext.createOscillator();
            const rhythmGain = this.audioContext.createGain();
            rhythmLfo.type = 'square';
            rhythmLfo.frequency.value = 3; // ~180 BPM feel
            rhythmGain.gain.value = 0.12;
            rhythmLfo.connect(rhythmGain);
            rhythmGain.connect(masterGain.gain);
            rhythmLfo.start(now);
            rhythmLfo.stop(now + duration);
            allOscillators.push(rhythmLfo);

            // Add accent pattern
            const accentLfo = this.audioContext.createOscillator();
            const accentGain = this.audioContext.createGain();
            accentLfo.frequency.value = 0.75;
            accentGain.gain.value = 0.05;
            accentLfo.connect(accentGain);
            accentGain.connect(masterGain.gain);
            accentLfo.start(now);
            accentLfo.stop(now + duration);
            allOscillators.push(accentLfo);

            masterGain.gain.setValueAtTime(0.15, now + duration - 0.3);
            masterGain.gain.linearRampToValueAtTime(0, now + duration);

        } else { // melodic
            // Melodic: overtone shifts and pitch movement
            masterGain.gain.setValueAtTime(0, now);
            masterGain.gain.linearRampToValueAtTime(0.18, now + attack);
            masterGain.gain.setValueAtTime(0.18, now + duration - 0.5);
            masterGain.gain.linearRampToValueAtTime(0, now + duration);

            // Animate formant frequencies for vowel-like changes
            formant1.frequency.setValueAtTime(200, now);
            formant1.frequency.linearRampToValueAtTime(350, now + duration * 0.25);
            formant1.frequency.linearRampToValueAtTime(180, now + duration * 0.5);
            formant1.frequency.linearRampToValueAtTime(280, now + duration * 0.75);
            formant1.frequency.linearRampToValueAtTime(200, now + duration);

            formant2.frequency.setValueAtTime(800, now);
            formant2.frequency.linearRampToValueAtTime(1200, now + duration * 0.25);
            formant2.frequency.linearRampToValueAtTime(700, now + duration * 0.5);
            formant2.frequency.linearRampToValueAtTime(900, now + duration * 0.75);
            formant2.frequency.linearRampToValueAtTime(800, now + duration);

            // Subtle pitch bends
            const pitchLfo = this.audioContext.createOscillator();
            const pitchGain = this.audioContext.createGain();
            pitchLfo.frequency.value = 0.3;
            pitchGain.gain.value = frequency * 0.02;
            pitchLfo.connect(pitchGain);
            pitchGain.connect(droneOsc.frequency);
            pitchLfo.start(now);
            pitchLfo.stop(now + duration);
            allOscillators.push(pitchLfo);
        }

        allOscillators.forEach(osc => {
            if (osc === droneOsc || osc === subOsc) {
                osc.start(now);
                osc.stop(now + duration);
            }
        });

        this.activeOscillators.set(id, { oscillators: [droneOsc], gains: [masterGain], masterGain });
        this.scheduleCleanup(id, droneOsc);

        return id;
    }

    // Pan Flute - Breathy tone
    playPanFlute(frequency, style = 'sustained', duration = 4) {
        this.enforcePolyphony();
        const id = this.generateId('panflute');
        const now = this.audioContext.currentTime;

        // Style-specific parameters
        let attack, release, toneLevel, noiseLevel, vibratoRate, vibratoDepth, noiseFilterQ;

        if (style === 'sustained') {
            // Sustained: long, smooth, meditative breath
            attack = 0.3;
            release = 0.5;
            toneLevel = 0.15;
            noiseLevel = 0.015;
            vibratoRate = 4.5;
            vibratoDepth = 0.008;
            noiseFilterQ = 1.5;
        } else if (style === 'rhythmic') {
            // Rhythmic: short, percussive, staccato breaths
            duration = Math.min(duration, 1.5); // shorter notes
            attack = 0.02;
            release = 0.3;
            toneLevel = 0.18;
            noiseLevel = 0.04; // more breath attack
            vibratoRate = 0;
            vibratoDepth = 0;
            noiseFilterQ = 3;
        } else { // melodic
            // Melodic: expressive, with dynamic swells and pitch movement
            attack = 0.15;
            release = 0.4;
            toneLevel = 0.16;
            noiseLevel = 0.02;
            vibratoRate = 5.5;
            vibratoDepth = 0.015; // more expressive vibrato
            noiseFilterQ = 2;
        }

        // Main tone
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = frequency;

        // Second harmonic for richness
        const osc2 = this.audioContext.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = frequency * 2;

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
        noiseFilter.Q.value = noiseFilterQ;

        const toneGain = this.audioContext.createGain();
        const tone2Gain = this.audioContext.createGain();
        const noiseGain = this.audioContext.createGain();
        const masterGain = this.audioContext.createGain();

        osc.connect(toneGain);
        osc2.connect(tone2Gain);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        toneGain.connect(masterGain);
        tone2Gain.connect(masterGain);
        noiseGain.connect(masterGain);
        masterGain.connect(this.reverbNode);

        toneGain.gain.value = toneLevel;
        tone2Gain.gain.value = toneLevel * 0.15;
        noiseGain.gain.value = noiseLevel;

        // Add vibrato (if enabled)
        if (vibratoRate > 0) {
            const vibrato = this.audioContext.createOscillator();
            const vibratoGain = this.audioContext.createGain();
            vibrato.frequency.value = vibratoRate;
            vibratoGain.gain.value = frequency * vibratoDepth;
            vibrato.connect(vibratoGain);
            vibratoGain.connect(osc.frequency);
            vibrato.start(now + attack); // vibrato starts after attack
            vibrato.stop(now + duration);
        }

        if (style === 'sustained') {
            // Smooth, long envelope
            masterGain.gain.setValueAtTime(0, now);
            masterGain.gain.linearRampToValueAtTime(1, now + attack);
            masterGain.gain.setValueAtTime(1, now + duration - release);
            masterGain.gain.linearRampToValueAtTime(0, now + duration);

        } else if (style === 'rhythmic') {
            // Sharp attack, quick decay
            masterGain.gain.setValueAtTime(0, now);
            masterGain.gain.linearRampToValueAtTime(1.2, now + attack); // slight accent
            masterGain.gain.exponentialRampToValueAtTime(0.6, now + 0.1);
            masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            // Breath burst at attack
            noiseGain.gain.setValueAtTime(noiseLevel * 3, now);
            noiseGain.gain.exponentialRampToValueAtTime(noiseLevel, now + 0.08);

        } else { // melodic
            // Expressive envelope with dynamic swell
            masterGain.gain.setValueAtTime(0, now);
            masterGain.gain.linearRampToValueAtTime(0.7, now + attack);
            masterGain.gain.linearRampToValueAtTime(1, now + duration * 0.4); // swell
            masterGain.gain.linearRampToValueAtTime(0.8, now + duration * 0.7);
            masterGain.gain.linearRampToValueAtTime(0, now + duration);

            // Gentle pitch bend for expression
            osc.frequency.setValueAtTime(frequency * 0.995, now);
            osc.frequency.linearRampToValueAtTime(frequency, now + attack);
            osc.frequency.linearRampToValueAtTime(frequency * 1.003, now + duration * 0.5);
            osc.frequency.linearRampToValueAtTime(frequency, now + duration);
        }

        osc.start(now);
        osc.stop(now + duration);
        osc2.start(now);
        osc2.stop(now + duration);
        noise.start(now);
        noise.stop(now + duration);

        this.activeOscillators.set(id, { oscillators: [osc], gains: [masterGain], masterGain });
        this.scheduleCleanup(id, osc);

        return id;
    }

    // Handpan - Metallic melodic percussion
    playHandpan(frequency, style = 'finger', duration = 5) {
        this.enforcePolyphony();
        const id = this.generateId('handpan');
        const now = this.audioContext.currentTime;

        const oscillators = [];
        const gains = [];
        const masterGain = this.audioContext.createGain();

        // Style-specific parameters
        let partials, amplitudes, attack, peakAmp, filterFreq, decayRate, detuneAmount;

        if (style === 'finger') {
            // Finger tap - clear, bell-like, balanced tone
            partials = [1, 2, 3, 4.7, 6.2, 8];
            amplitudes = [1, 0.6, 0.35, 0.18, 0.08, 0.03];
            attack = 0.003;
            peakAmp = 0.12;
            filterFreq = 6000;
            decayRate = 1;
            detuneAmount = 3;
        } else if (style === 'palm') {
            // Palm strike - deep, warm, thumpy with muted highs
            partials = [1, 2, 3, 4.7];
            amplitudes = [1, 0.8, 0.3, 0.1];
            attack = 0.008;
            peakAmp = 0.18;
            filterFreq = 2000; // much darker
            decayRate = 1.3; // faster decay
            detuneAmount = 5;
        } else { // ghost
            // Ghost notes - ultra soft, quick, subtle
            partials = [1, 2, 3];
            amplitudes = [1, 0.4, 0.15];
            attack = 0.001;
            peakAmp = 0.04;
            filterFreq = 4000;
            decayRate = 2.5; // very fast decay
            detuneAmount = 2;
        }

        // Filter for tonal shaping
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;
        filter.Q.value = style === 'palm' ? 1.5 : 0.7;

        masterGain.connect(filter);
        filter.connect(this.reverbNode);

        partials.forEach((partial, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = frequency * partial;
            osc.detune.value = (Math.random() - 0.5) * detuneAmount;

            gain.gain.value = 0;
            osc.connect(gain);
            gain.connect(masterGain);

            oscillators.push(osc);
            gains.push(gain);

            const amp = amplitudes[index] * peakAmp;
            const adjustedDuration = duration / decayRate;

            if (style === 'finger') {
                // Clear attack, natural sustain
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(amp, now + attack);
                gain.gain.setValueAtTime(amp, now + attack + 0.05);
                gain.gain.exponentialRampToValueAtTime(amp * 0.5, now + adjustedDuration * 0.3);
                gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            } else if (style === 'palm') {
                // Thumpy attack with quick decay, warm resonance
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(amp * 1.2, now + attack); // slight thump
                gain.gain.exponentialRampToValueAtTime(amp * 0.6, now + 0.03);
                gain.gain.exponentialRampToValueAtTime(amp * 0.3, now + 0.15);
                gain.gain.exponentialRampToValueAtTime(0.001, now + adjustedDuration);

                // Palm muting effect - filter closes after attack
                if (index === 0) {
                    filter.frequency.setValueAtTime(filterFreq * 1.5, now);
                    filter.frequency.exponentialRampToValueAtTime(filterFreq * 0.5, now + 0.1);
                    filter.frequency.exponentialRampToValueAtTime(filterFreq * 0.3, now + adjustedDuration);
                }

            } else { // ghost
                // Super quick, barely there
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(amp, now + attack);
                gain.gain.exponentialRampToValueAtTime(amp * 0.3, now + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + adjustedDuration);
            }
        });

        oscillators.forEach(osc => {
            osc.start(now);
            osc.stop(now + duration);
        });

        this.activeOscillators.set(id, { oscillators, gains, masterGain });
        this.scheduleCleanup(id, oscillators[0]);

        return id;
    }

    stopAll() {
        this.activeOscillators.forEach((data, id) => {
            try {
                data.oscillators.forEach(osc => osc.stop());
            } catch (e) {
                // Oscillator may already be stopped
            }
        });
        this.activeOscillators.clear();
    }
}

// Export singleton
window.audioEngine = new AudioEngine();
