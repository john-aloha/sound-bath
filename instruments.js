/**
 * Sound Bath Sanctuary - Instruments Configuration
 * Defines all instruments, their properties, and frequencies
 */

const INSTRUMENTS = {
    // Crystal Singing Bowls - Tuned to chakra frequencies
    crystalBowls: [
        { note: 'C', frequency: 256, chakra: 'Root', color: '#ff4444', size: 110 },
        { note: 'D', frequency: 288, chakra: 'Sacral', color: '#ff8c00', size: 100 },
        { note: 'E', frequency: 320, chakra: 'Solar', color: '#ffd700', size: 95 },
        { note: 'F', frequency: 341, chakra: 'Heart', color: '#32cd32', size: 88 },
        { note: 'G', frequency: 384, chakra: 'Throat', color: '#1e90ff', size: 80 },
        { note: 'A', frequency: 426, chakra: 'Third Eye', color: '#6a5acd', size: 72 },
        { note: 'B', frequency: 480, chakra: 'Crown', color: '#9932cc', size: 65 }
    ],

    // Tibetan Singing Bowls - Various sizes
    tibetanBowls: [
        { name: 'Large', frequency: 110, size: 120 },
        { name: 'Medium-Large', frequency: 165, size: 105 },
        { name: 'Medium', frequency: 220, size: 90 },
        { name: 'Medium-Small', frequency: 330, size: 75 },
        { name: 'Small', frequency: 440, size: 60 }
    ],

    // Gongs
    gongs: {
        chauGong: { name: 'Chau Gong', frequency: 50, description: '40" Wind Gong' },
        symphGong: { name: 'Symphonic Gong', frequency: 65, description: '36" Paiste Style' }
    },

    // Didgeridoo
    didgeridoo: {
        frequency: 65,
        key: 'D'
    },

    // Pan Flute - Pentatonic scale
    panFlute: [
        { note: 'G4', frequency: 392 },
        { note: 'A4', frequency: 440 },
        { note: 'B4', frequency: 494 },
        { note: 'D5', frequency: 587 },
        { note: 'E5', frequency: 659 },
        { note: 'G5', frequency: 784 },
        { note: 'A5', frequency: 880 },
        { note: 'B5', frequency: 988 }
    ],

    // Handpans
    handpan1: {
        name: 'D Minor',
        ding: { note: 'D3', frequency: 147 },
        notes: [
            { note: 'A3', frequency: 220, angle: 0 },
            { note: 'Bb3', frequency: 233, angle: 45 },
            { note: 'C4', frequency: 262, angle: 90 },
            { note: 'D4', frequency: 294, angle: 135 },
            { note: 'E4', frequency: 330, angle: 180 },
            { note: 'F4', frequency: 349, angle: 225 },
            { note: 'A4', frequency: 440, angle: 270 },
            { note: 'C5', frequency: 523, angle: 315 }
        ]
    },
    handpan2: {
        name: 'C# Amara',
        ding: { note: 'C#3', frequency: 139 },
        notes: [
            { note: 'G#3', frequency: 208, angle: 0 },
            { note: 'A3', frequency: 220, angle: 45 },
            { note: 'B3', frequency: 247, angle: 90 },
            { note: 'C#4', frequency: 277, angle: 135 },
            { note: 'D#4', frequency: 311, angle: 180 },
            { note: 'E4', frequency: 330, angle: 225 },
            { note: 'G#4', frequency: 415, angle: 270 },
            { note: 'B4', frequency: 494, angle: 315 }
        ]
    }
};

// Play style states
const playStyles = {
    crystal: 'strike',
    tibetan: 'mallet',
    gong: 'soft',
    wind: 'sustained',
    handpan: 'finger'
};

// Export
window.INSTRUMENTS = INSTRUMENTS;
window.playStyles = playStyles;
