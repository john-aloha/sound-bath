/**
 * Sound Bath Sanctuary - Main Application
 * Handles UI, instrument rendering, and user interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Audio starter overlay
    const audioStarter = document.getElementById('audioStarter');
    const startBtn = document.getElementById('startAudioBtn');

    startBtn.addEventListener('click', async () => {
        startBtn.disabled = true;
        startBtn.textContent = 'Initializing...';

        const success = await window.audioEngine.initialize();
        if (success) {
            audioStarter.classList.add('hidden');
            initializeInstruments();
            initializeVisualizer();
            initializeControls();
            createParticles();
        } else {
            startBtn.disabled = false;
            startBtn.textContent = 'Retry - Audio Failed';
            console.error('Audio engine failed to initialize. Please check browser permissions.');
        }
    });
}

function initializeInstruments() {
    renderCrystalBowls();
    renderTibetanBowls();
    setupGongs();
    setupWindInstruments();
    renderHandpans();
    setupPlayStyleButtons();
}

// Audio durations for visual sync
const AUDIO_DURATIONS = {
    crystal: 8000,
    tibetan: 10000,
    gong: 15000,
    panflute: 4000,
    handpan: 5000,
    didgeridoo: 8000
};

// Crystal Singing Bowls
function renderCrystalBowls() {
    const container = document.getElementById('crystalBowls');
    container.innerHTML = '';

    INSTRUMENTS.crystalBowls.forEach((bowl, index) => {
        const bowlEl = document.createElement('div');
        bowlEl.className = 'crystal-bowl';
        bowlEl.dataset.index = index;
        bowlEl.style.setProperty('--bowl-size', `${bowl.size}px`);
        bowlEl.style.setProperty('--chakra-color', bowl.color);

        // Accessibility
        bowlEl.setAttribute('role', 'button');
        bowlEl.setAttribute('tabindex', '0');
        bowlEl.setAttribute('aria-label', `Crystal singing bowl, note ${bowl.note}, ${bowl.chakra} chakra, ${bowl.frequency} hertz`);

        bowlEl.innerHTML = `
            <div class="crystal-bowl-body">
                <div class="crystal-bowl-inner"></div>
            </div>
            <span class="bowl-label">${bowl.note}</span>
            <span class="bowl-note">${bowl.chakra}</span>
        `;

        bowlEl.addEventListener('mousedown', () => playCrystalBowl(index));
        bowlEl.addEventListener('touchstart', (e) => {
            e.preventDefault();
            playCrystalBowl(index);
        });
        bowlEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                playCrystalBowl(index);
            }
        });

        container.appendChild(bowlEl);
    });
}

function playCrystalBowl(index) {
    const bowl = INSTRUMENTS.crystalBowls[index];
    if (!bowl) return;

    const style = playStyles.crystal;
    const bowlElements = document.querySelectorAll('.crystal-bowl');
    const bowlEl = bowlElements[index];
    if (!bowlEl) return;

    bowlEl.classList.add('playing');
    bowlEl.setAttribute('aria-pressed', 'true');
    window.audioEngine.playCrystalBowl(bowl.frequency, style);

    setTimeout(() => {
        bowlEl.classList.remove('playing');
        bowlEl.setAttribute('aria-pressed', 'false');
    }, AUDIO_DURATIONS.crystal);
}

// Tibetan Singing Bowls
function renderTibetanBowls() {
    const container = document.getElementById('tibetanBowls');
    container.innerHTML = '';

    INSTRUMENTS.tibetanBowls.forEach((bowl, index) => {
        const bowlEl = document.createElement('div');
        bowlEl.className = 'tibetan-bowl';
        bowlEl.dataset.index = index;
        bowlEl.style.setProperty('--bowl-size', `${bowl.size}px`);

        // Accessibility
        bowlEl.setAttribute('role', 'button');
        bowlEl.setAttribute('tabindex', '0');
        bowlEl.setAttribute('aria-label', `Tibetan singing bowl, ${bowl.name} size, ${bowl.frequency} hertz`);

        bowlEl.innerHTML = `
            <div class="tibetan-bowl-body">
                <div class="tibetan-bowl-pattern"></div>
            </div>
            <span class="bowl-label">${bowl.name}</span>
            <span class="bowl-note">${bowl.frequency}Hz</span>
        `;

        bowlEl.addEventListener('mousedown', () => playTibetanBowl(index));
        bowlEl.addEventListener('touchstart', (e) => {
            e.preventDefault();
            playTibetanBowl(index);
        });
        bowlEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                playTibetanBowl(index);
            }
        });

        container.appendChild(bowlEl);
    });
}

function playTibetanBowl(index) {
    const bowl = INSTRUMENTS.tibetanBowls[index];
    if (!bowl) return;

    const style = playStyles.tibetan;
    const bowlElements = document.querySelectorAll('.tibetan-bowl');
    const bowlEl = bowlElements[index];
    if (!bowlEl) return;

    bowlEl.classList.add('playing');
    bowlEl.setAttribute('aria-pressed', 'true');
    window.audioEngine.playTibetanBowl(bowl.frequency, style);

    setTimeout(() => {
        bowlEl.classList.remove('playing');
        bowlEl.setAttribute('aria-pressed', 'false');
    }, AUDIO_DURATIONS.tibetan);
}

// Gongs
function setupGongs() {
    const chauGong = document.querySelector('.chau-gong');
    const symphGong = document.querySelector('.symph-gong');

    if (chauGong) {
        chauGong.setAttribute('role', 'button');
        chauGong.setAttribute('tabindex', '0');
        chauGong.setAttribute('aria-label', 'Chau Gong, 40 inch wind gong, 50 hertz');

        chauGong.addEventListener('mousedown', () => playGong('chauGong'));
        chauGong.addEventListener('touchstart', (e) => {
            e.preventDefault();
            playGong('chauGong');
        });
        chauGong.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                playGong('chauGong');
            }
        });
    }

    if (symphGong) {
        symphGong.setAttribute('role', 'button');
        symphGong.setAttribute('tabindex', '0');
        symphGong.setAttribute('aria-label', 'Symphonic Gong, 36 inch Paiste style, 65 hertz');

        symphGong.addEventListener('mousedown', () => playGong('symphGong'));
        symphGong.addEventListener('touchstart', (e) => {
            e.preventDefault();
            playGong('symphGong');
        });
        symphGong.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                playGong('symphGong');
            }
        });
    }
}

function playGong(gongType) {
    const gong = INSTRUMENTS.gongs?.[gongType];
    if (!gong) return;

    const style = playStyles.gong;
    const gongEl = document.querySelector(`.${gongType === 'chauGong' ? 'chau-gong' : 'symph-gong'}`);
    if (!gongEl) return;

    gongEl.classList.add('playing');
    gongEl.setAttribute('aria-pressed', 'true');
    window.audioEngine.playGong(gong.frequency, style);

    setTimeout(() => {
        gongEl.classList.remove('playing');
        gongEl.setAttribute('aria-pressed', 'false');
    }, AUDIO_DURATIONS.gong);
}

// Wind Instruments
function setupWindInstruments() {
    // Didgeridoo
    const didgeridoo = document.querySelector('.didgeridoo');

    if (didgeridoo) {
        didgeridoo.setAttribute('role', 'button');
        didgeridoo.setAttribute('tabindex', '0');
        didgeridoo.setAttribute('aria-label', 'Didgeridoo, eucalyptus, key of D, 65 hertz');

        didgeridoo.addEventListener('mousedown', () => {
            didgeridoo.classList.add('playing');
            didgeridoo.setAttribute('aria-pressed', 'true');
            playDidgeridoo();
        });

        didgeridoo.addEventListener('mouseup', () => {
            didgeridoo.classList.remove('playing');
            didgeridoo.setAttribute('aria-pressed', 'false');
        });

        didgeridoo.addEventListener('mouseleave', () => {
            didgeridoo.classList.remove('playing');
            didgeridoo.setAttribute('aria-pressed', 'false');
        });

        didgeridoo.addEventListener('touchstart', (e) => {
            e.preventDefault();
            didgeridoo.classList.add('playing');
            didgeridoo.setAttribute('aria-pressed', 'true');
            playDidgeridoo();
        });

        didgeridoo.addEventListener('touchend', () => {
            didgeridoo.classList.remove('playing');
            didgeridoo.setAttribute('aria-pressed', 'false');
        });

        didgeridoo.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                didgeridoo.classList.add('playing');
                didgeridoo.setAttribute('aria-pressed', 'true');
                playDidgeridoo();
                setTimeout(() => {
                    didgeridoo.classList.remove('playing');
                    didgeridoo.setAttribute('aria-pressed', 'false');
                }, AUDIO_DURATIONS.didgeridoo);
            }
        });
    }

    // Pan Flute pipes
    const pipes = document.querySelectorAll('.pipe');
    pipes.forEach((pipe, index) => {
        const note = INSTRUMENTS.panFlute?.[index];
        pipe.setAttribute('role', 'button');
        pipe.setAttribute('tabindex', '0');
        pipe.setAttribute('aria-label', `Pan flute pipe ${index + 1}, note ${note?.note || ''}, ${note?.frequency || ''} hertz`);

        pipe.addEventListener('mousedown', () => playPanFlutePipe(index));
        pipe.addEventListener('touchstart', (e) => {
            e.preventDefault();
            playPanFlutePipe(index);
        });
        pipe.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                playPanFlutePipe(index);
            }
        });
    });
}

function playDidgeridoo() {
    const style = playStyles.wind;
    window.audioEngine.playDidgeridoo(INSTRUMENTS.didgeridoo.frequency, style);
}

function playPanFlutePipe(index) {
    const note = INSTRUMENTS.panFlute?.[index];
    if (!note) return;

    const style = playStyles.wind;
    const pipes = document.querySelectorAll('.pipe');
    const pipe = pipes[index];
    if (!pipe) return;

    pipe.classList.add('playing');
    pipe.setAttribute('aria-pressed', 'true');
    window.audioEngine.playPanFlute(note.frequency, style);

    setTimeout(() => {
        pipe.classList.remove('playing');
        pipe.setAttribute('aria-pressed', 'false');
    }, AUDIO_DURATIONS.panflute);
}

// Handpans
function renderHandpans() {
    renderHandpan('handpan1', INSTRUMENTS.handpan1);
    renderHandpan('handpan2', INSTRUMENTS.handpan2);
}

function renderHandpan(handpanId, config) {
    if (!config) return;

    const notesContainer = document.getElementById(`${handpanId}Notes`);
    if (!notesContainer) return;
    notesContainer.innerHTML = '';

    const handpanClass = handpanId === 'handpan1' ? 'handpan-1' : 'handpan-2';

    // Setup ding (center)
    const ding = document.querySelector(`.${handpanClass} .handpan-ding`);
    if (ding) {
        ding.setAttribute('role', 'button');
        ding.setAttribute('tabindex', '0');
        ding.setAttribute('aria-label', `Handpan ${config.name} center ding, note ${config.ding.note}, ${config.ding.frequency} hertz`);

        ding.addEventListener('mousedown', () => playHandpanNote(handpanId, config.ding.frequency, true));
        ding.addEventListener('touchstart', (e) => {
            e.preventDefault();
            playHandpanNote(handpanId, config.ding.frequency, true);
        });
        ding.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                playHandpanNote(handpanId, config.ding.frequency, true);
            }
        });
    }

    // Create outer notes
    const radius = 70; // Distance from center
    config.notes.forEach((note, index) => {
        const noteEl = document.createElement('div');
        noteEl.className = 'handpan-note';
        noteEl.dataset.note = note.note;

        // Accessibility
        noteEl.setAttribute('role', 'button');
        noteEl.setAttribute('tabindex', '0');
        noteEl.setAttribute('aria-label', `Handpan ${config.name} note ${note.note}, ${note.frequency} hertz`);

        // Position in circle
        const angle = (note.angle - 90) * (Math.PI / 180);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        noteEl.style.left = `calc(50% + ${x}px - 17.5px)`;
        noteEl.style.top = `calc(50% + ${y}px - 17.5px)`;

        noteEl.addEventListener('mousedown', () => playHandpanNote(handpanId, note.frequency, false));
        noteEl.addEventListener('touchstart', (e) => {
            e.preventDefault();
            playHandpanNote(handpanId, note.frequency, false);
        });
        noteEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                playHandpanNote(handpanId, note.frequency, false);
            }
        });

        notesContainer.appendChild(noteEl);
    });
}

function playHandpanNote(handpanId, frequency, isDing) {
    const style = playStyles.handpan;
    const handpanClass = handpanId === 'handpan1' ? 'handpan-1' : 'handpan-2';

    // Find the note element
    const noteEls = document.querySelectorAll(`.${handpanClass} ${isDing ? '.handpan-ding' : '.handpan-note'}`);

    if (isDing && noteEls.length > 0) {
        noteEls[0].classList.add('playing');
        noteEls[0].setAttribute('aria-pressed', 'true');
        setTimeout(() => {
            noteEls[0].classList.remove('playing');
            noteEls[0].setAttribute('aria-pressed', 'false');
        }, AUDIO_DURATIONS.handpan);
    }

    window.audioEngine.playHandpan(frequency, style);
}

// Play Style Buttons
function setupPlayStyleButtons() {
    const styleButtons = document.querySelectorAll('.style-btn');

    styleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const group = btn.dataset.group;
            const style = btn.dataset.style;

            // Update active state and aria-pressed
            document.querySelectorAll(`.style-btn[data-group="${group}"]`).forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');

            // Update play style
            playStyles[group] = style;
        });
    });
}

// Controls
function initializeControls() {
    // Master volume
    const volumeSlider = document.getElementById('masterVolume');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            const value = e.target.value / 100;
            window.audioEngine.setMasterVolume(value);
        });
    }

    // Fullscreen
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        });
    }

    // Ambient toggle (ocean waves)
    const ambientBtn = document.getElementById('ambientToggle');
    if (ambientBtn) {
        ambientBtn.addEventListener('click', () => {
            const isPlaying = window.audioEngine.toggleAmbient();
            ambientBtn.classList.toggle('active', isPlaying);
            ambientBtn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
        });
    }
}

// Visualizer
function initializeVisualizer() {
    const canvas = document.getElementById('visualizerCanvas');
    const ctx = canvas.getContext('2d');
    let gradient = null;
    let lastHeight = 0;

    function createGradient(height) {
        const g = ctx.createLinearGradient(0, height, 0, 0);
        g.addColorStop(0, '#d4af37');
        g.addColorStop(0.5, '#7b68ee');
        g.addColorStop(1, '#20b2aa');
        return g;
    }

    function resizeCanvas() {
        canvas.width = canvas.offsetWidth * window.devicePixelRatio;
        canvas.height = canvas.offsetHeight * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        // Recreate gradient on resize
        lastHeight = canvas.offsetHeight;
        gradient = createGradient(lastHeight);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function draw() {
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;

        // Recreate gradient only if height changed
        if (height !== lastHeight) {
            lastHeight = height;
            gradient = createGradient(height);
        }

        ctx.clearRect(0, 0, width, height);

        const data = window.audioEngine.getAnalyserData();
        if (!data) {
            requestAnimationFrame(draw);
            return;
        }

        const barCount = 64;
        const barWidth = width / barCount;

        ctx.fillStyle = gradient;

        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * data.length / barCount);
            const value = data[dataIndex] / 255;
            const barHeight = value * height * 0.8;

            ctx.beginPath();
            ctx.roundRect(
                i * barWidth + 2,
                height - barHeight,
                barWidth - 4,
                barHeight,
                3
            );
            ctx.fill();
        }

        requestAnimationFrame(draw);
    }

    draw();
}

// Particles
function createParticles() {
    const container = document.getElementById('particles');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 4}s`;
        particle.style.animationDuration = `${3 + Math.random() * 3}s`;
        container.appendChild(particle);
    }
}
