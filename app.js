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
        const success = await window.audioEngine.initialize();
        if (success) {
            audioStarter.classList.add('hidden');
            initializeInstruments();
            initializeVisualizer();
            initializeControls();
            createParticles();
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

        container.appendChild(bowlEl);
    });
}

function playCrystalBowl(index) {
    const bowl = INSTRUMENTS.crystalBowls[index];
    const style = playStyles.crystal;
    const bowlEl = document.querySelectorAll('.crystal-bowl')[index];

    bowlEl.classList.add('playing');
    window.audioEngine.playCrystalBowl(bowl.frequency, style);

    setTimeout(() => {
        bowlEl.classList.remove('playing');
    }, 2000);
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

        container.appendChild(bowlEl);
    });
}

function playTibetanBowl(index) {
    const bowl = INSTRUMENTS.tibetanBowls[index];
    const style = playStyles.tibetan;
    const bowlEl = document.querySelectorAll('.tibetan-bowl')[index];

    bowlEl.classList.add('playing');
    window.audioEngine.playTibetanBowl(bowl.frequency, style);

    setTimeout(() => {
        bowlEl.classList.remove('playing');
    }, 3000);
}

// Gongs
function setupGongs() {
    const chauGong = document.querySelector('.chau-gong');
    const symphGong = document.querySelector('.symph-gong');

    chauGong.addEventListener('mousedown', () => playGong('chauGong'));
    chauGong.addEventListener('touchstart', (e) => {
        e.preventDefault();
        playGong('chauGong');
    });

    symphGong.addEventListener('mousedown', () => playGong('symphGong'));
    symphGong.addEventListener('touchstart', (e) => {
        e.preventDefault();
        playGong('symphGong');
    });
}

function playGong(gongType) {
    const gong = INSTRUMENTS.gongs[gongType];
    const style = playStyles.gong;
    const gongEl = document.querySelector(`.${gongType === 'chauGong' ? 'chau-gong' : 'symph-gong'}`);

    gongEl.classList.add('playing');
    window.audioEngine.playGong(gong.frequency, style);

    setTimeout(() => {
        gongEl.classList.remove('playing');
    }, 5000);
}

// Wind Instruments
function setupWindInstruments() {
    // Didgeridoo
    const didgeridoo = document.querySelector('.didgeridoo');
    let didgeHoldTimeout;

    didgeridoo.addEventListener('mousedown', () => {
        didgeridoo.classList.add('playing');
        playDidgeridoo();
    });

    didgeridoo.addEventListener('mouseup', () => {
        didgeridoo.classList.remove('playing');
    });

    didgeridoo.addEventListener('mouseleave', () => {
        didgeridoo.classList.remove('playing');
    });

    didgeridoo.addEventListener('touchstart', (e) => {
        e.preventDefault();
        didgeridoo.classList.add('playing');
        playDidgeridoo();
    });

    didgeridoo.addEventListener('touchend', () => {
        didgeridoo.classList.remove('playing');
    });

    // Pan Flute pipes
    const pipes = document.querySelectorAll('.pipe');
    pipes.forEach((pipe, index) => {
        pipe.addEventListener('mousedown', () => playPanFlutePipe(index));
        pipe.addEventListener('touchstart', (e) => {
            e.preventDefault();
            playPanFlutePipe(index);
        });
    });
}

function playDidgeridoo() {
    const style = playStyles.wind;
    window.audioEngine.playDidgeridoo(INSTRUMENTS.didgeridoo.frequency, style);
}

function playPanFlutePipe(index) {
    const note = INSTRUMENTS.panFlute[index];
    const style = playStyles.wind;
    const pipe = document.querySelectorAll('.pipe')[index];

    pipe.classList.add('playing');
    window.audioEngine.playPanFlute(note.frequency, style);

    setTimeout(() => {
        pipe.classList.remove('playing');
    }, 1000);
}

// Handpans
function renderHandpans() {
    renderHandpan('handpan1', INSTRUMENTS.handpan1);
    renderHandpan('handpan2', INSTRUMENTS.handpan2);
}

function renderHandpan(handpanId, config) {
    const notesContainer = document.getElementById(`${handpanId}Notes`);
    notesContainer.innerHTML = '';

    // Setup ding (center)
    const ding = document.querySelector(`.${handpanId === 'handpan1' ? 'handpan-1' : 'handpan-2'} .handpan-ding`);
    ding.addEventListener('mousedown', () => playHandpanNote(handpanId, config.ding.frequency, true));
    ding.addEventListener('touchstart', (e) => {
        e.preventDefault();
        playHandpanNote(handpanId, config.ding.frequency, true);
    });

    // Create outer notes
    const radius = 70; // Distance from center
    config.notes.forEach((note, index) => {
        const noteEl = document.createElement('div');
        noteEl.className = 'handpan-note';
        noteEl.dataset.note = note.note;

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

        notesContainer.appendChild(noteEl);
    });
}

function playHandpanNote(handpanId, frequency, isDing) {
    const style = playStyles.handpan;
    const selector = isDing
        ? `.${handpanId === 'handpan1' ? 'handpan-1' : 'handpan-2'} .handpan-ding`
        : `.${handpanId === 'handpan1' ? 'handpan-1' : 'handpan-2'} .handpan-note[data-frequency="${frequency}"]`;

    // Find the note element
    const noteEls = document.querySelectorAll(`.${handpanId === 'handpan1' ? 'handpan-1' : 'handpan-2'} ${isDing ? '.handpan-ding' : '.handpan-note'}`);

    if (isDing) {
        noteEls[0].classList.add('playing');
        setTimeout(() => noteEls[0].classList.remove('playing'), 300);
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

            // Update active state
            document.querySelectorAll(`.style-btn[data-group="${group}"]`).forEach(b => {
                b.classList.remove('active');
            });
            btn.classList.add('active');

            // Update play style
            playStyles[group] = style;
        });
    });
}

// Controls
function initializeControls() {
    // Master volume
    const volumeSlider = document.getElementById('masterVolume');
    volumeSlider.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        window.audioEngine.setMasterVolume(value);
    });

    // Fullscreen
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });

    // Ambient toggle (placeholder for ambient sounds)
    const ambientBtn = document.getElementById('ambientToggle');
    ambientBtn.addEventListener('click', () => {
        ambientBtn.classList.toggle('active');
    });
}

// Visualizer
function initializeVisualizer() {
    const canvas = document.getElementById('visualizerCanvas');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = canvas.offsetWidth * window.devicePixelRatio;
        canvas.height = canvas.offsetHeight * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function draw() {
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;

        ctx.clearRect(0, 0, width, height);

        const data = window.audioEngine.getAnalyserData();
        if (!data) {
            requestAnimationFrame(draw);
            return;
        }

        const barCount = 64;
        const barWidth = width / barCount;
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#d4af37');
        gradient.addColorStop(0.5, '#7b68ee');
        gradient.addColorStop(1, '#20b2aa');

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
