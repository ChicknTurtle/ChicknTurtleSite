
function randomSongV1() {
    // original: https://github.com/OpenNBS/nbs.js/blob/v6/examples/full/randomSong.ts
    const layerAmount = randomInt(1, 4);
    const noteSpacing = randomChoice([1, 2, 4, 8]);
    const noteAmount = randomInt(8, 8 * (9 - noteSpacing));

    const song = new nbs.Song();
    song.name = "randomSong";
    song.setTempo(10);

    for (let layerIndex = 0; layerIndex < layerAmount; layerIndex++) {
        const layer = song.layers.create();
        layer.name = `Layer ${layerIndex + 1}`;
        layer.volume = 100;
        layer.stereo = layerIndex % 2 === 0 ? -100 : 100;

        for (let tickIndex = 0; tickIndex < noteAmount; tickIndex++) {
            const tick = tickIndex * noteSpacing;
            const instrument = randomInt(0, song.instruments.getTotal() - 1);
            const key = randomInt(0, 87);
            const note = new nbs.Note(instrument, { key, velocity: 100 });
            layer.notes.set(tick, note);
        }
    }
    downloadSong(song);
}

function randomSongV2() {
    // --- Helpers ---
    function getSection(bar) {
        return sections.find(s => bar >= s.start && bar < s.end);
    }
    function euclideanSteps(steps, pulses) {
        const pattern = [];
        let bucket = 0;
        for (let i = 0; i < pulses; i++) {
            bucket += steps;
            if (bucket >= pulses) {
                bucket -= pulses;
                pattern.push(1);
            } else {
                pattern.push(0);
            }
        }
        return pattern;
    }
    function markovNext(state, transitions) {
        const probs = transitions[state];
        const r = Math.random();
        let acc = 0;
        for (const [note, p] of Object.entries(probs)) {
            acc += p;
            if (r <= acc) return parseInt(note);
        }
        return parseInt(Object.keys(probs)[0]);
    }

    // 1) Define sections
    const sections = [
        { name: "Intro",  bars: randomInt(1, 2) },
        { name: "Verse",  bars: randomInt(4, 6) },
        { name: "Chorus", bars: randomInt(4, 6) },
        { name: "Bridge", bars: Math.random() < 0.5 ? randomInt(2, 4) : 0 },
        { name: "Chorus", bars: randomInt(4, 6) },
        { name: "Outro",  bars: randomInt(2, 4) }
    ].filter(s => s.bars > 0);

    // 2) Compute boundaries
    let cursor = 0;
    sections.forEach(sec => { sec.start = cursor; sec.end = cursor + sec.bars; cursor += sec.bars; });
    const totalBars = cursor;
    const ticksPerBar = randomChoice([8, 16, 24]);

    // 3) Instrument pools
    const pools = {
        drums: [ {kick:2,snare:3,hat:5,perc:10}, {kick:2,snare:11,hat:13,perc:5} ],
        bass:  [1,14,15],
        chords:[4,7,8],
        leads: [0,6,12,16],
        fills: [0,8,12,13]
    };
    const drumKit  = randomChoice(pools.drums);
    const bassInst = randomChoice(pools.bass);
    const chordInst= randomChoice(pools.chords);
    const leadInst = randomChoice(pools.leads);
    const fillInst = randomChoice(pools.fills);

    // 4) Initialize song
    const song = new nbs.Song(); song.name = "randomSong"; song.setTempo(10);

    // 5) Chord progression
    const progOpts = [[0,7,9,5],[0,9,5,7]];
    const prog = randomChoice(progOpts);
    const root = 48;
    const chords = Array.from({ length: totalBars }, (_, i) => {
        const deg = prog[i % prog.length], r = root + deg;
        return [r, r + 4, r + 7];
    });

    // 6) Chord track
    const chordTrack = song.layers.create();
    chordTrack.name = "Full Chords"; chordTrack.volume = 60; chordTrack.stereo = 40;
    chords.forEach((ch, bar) => {
        const t = bar * ticksPerBar;
        ch.forEach(key => chordTrack.notes.set(t, new nbs.Note(chordInst, { key, velocity: 60 })));
    });

    // 7) Drums with Euclidean rhythm and fills
    const dr = song.layers.create(); dr.name = "Drums"; dr.volume = 100; dr.stereo = -50;
    const kickPattern = euclideanSteps(3, ticksPerBar); // 3 kicks per bar
    const snarePattern= euclideanSteps(2, ticksPerBar); // 2 snares per bar
    for (let bar = 0; bar < totalBars; bar++) {
        const t0 = bar * ticksPerBar;
        kickPattern.forEach((on, i) => on && dr.notes.set(t0+i, new nbs.Note(drumKit.kick)));
        snarePattern.forEach((on, i) => on && dr.notes.set(t0+i, new nbs.Note(drumKit.snare)));
        // hi-hat every 2 steps
        for (let i = 0; i < ticksPerBar; i += 2) dr.notes.set(t0+i, new nbs.Note(drumKit.hat));
        // section fills
        const sec = getSection(bar);
        if (sec.name === "Verse" || sec.name === "Bridge") {
            if (bar % 2 === 1) dr.notes.set(t0 + ticksPerBar - 2, new nbs.Note(drumKit.perc));
        }
    }

    // 8) Bass with Markov transitions
    const bs = song.layers.create(); bs.name = "Bass"; bs.volume = 100; bs.stereo = 50;
    // Build simple Markov from chord roots
    const transitions = {};
    chords.forEach((ch, i) => {
        const rootNote = ch[0] - 12;
        const nextNote = chords[(i+1)%totalBars][0] - 12;
        transitions[rootNote] = transitions[rootNote] || {};
        transitions[rootNote][nextNote] = (transitions[rootNote][nextNote]||0) + 1;
    });
    // Normalize
    for (const r in transitions) {
        const sum = Object.values(transitions[r]).reduce((a,b)=>a+b,0);
        for (const k in transitions[r]) transitions[r][k] /= sum;
    }
    let state = chords[0][0] - 12;
    for (let bar = 0; bar < totalBars; bar++) {
        const t0 = bar * ticksPerBar;
        // choose next via Markov
        state = markovNext(state, transitions);
        bs.notes.set(t0, new nbs.Note(bassInst, { key: state }));
        // Chorus and Bridge variations
        const sec = getSection(bar);
        if (sec.name === "Chorus") bs.notes.set(t0 + ticksPerBar/2, new nbs.Note(bassInst, { key: state + 7 }));
        if (sec.name === "Bridge") bs.notes.set(t0 + ticksPerBar/3, new nbs.Note(bassInst, { key: state + 12 }));
    }

    // 9) Melodies with skeleton + infill + rests
    const melodyCount = randomInt(1, 2);
    for (let m = 0; m < melodyCount; m++) {
        const ml = song.layers.create();
        ml.name = `Melody ${m+1}`; ml.volume = 100; ml.stereo = m%2 ? 30 : -30;

        const fill = song.layers.create();
        fill.name = `Fill ${m+1}`; fill.volume = 70; fill.stereo = ml.stereo;

        // rhythmic skeleton per section
        const skeleton = sections.map(sec => {
            const pulses = ticksPerBar;
            return euclideanSteps(sec.bars + 2, pulses).reduce((a, on, i) => {
                if (on) a.push(i); return a;
            }, []);
        }).flat();

        let pos = 0;
        sections.forEach((sec, idx) => {
            const chordTones = chords[sec.start];
            for (let b = 0; b < sec.bars; b++, pos++) {
                const t0 = pos * ticksPerBar;
                const barSkeleton = skeleton.slice(pos*ticksPerBar, (pos+1)*ticksPerBar);

                // place skeleton notes on chord tones
                barSkeleton.forEach(hit => {
                    const key = chordTones[randomInt(0,2)];
                    ml.notes.set(t0 + hit, new nbs.Note(leadInst, { key }));
                });

                // infill weaker beats with passing tones 30%
                for (let i = 0; i < ticksPerBar; i++) {
                    if (!barSkeleton.includes(i) && Math.random()<0.3) {
                        const deg = randomChoice([ -1, 1 ]);
                        const base = chordTones[1] + deg;
                        ml.notes.set(t0 + i, new nbs.Note(leadInst, { key: base }));
                    }
                }

                // fills: chord arpeggio at bar end sometimes
                if ((sec.name === "Chorus" || sec.name === "Bridge") && Math.random()<0.5) {
                    chordTones.forEach((k, i) => {
                        const t = t0 + ticksPerBar - (i+1);
                        fill.notes.set(t, new nbs.Note(fillInst, { key: k+12, velocity:60 }));
                    });
                }

                // outro coda: extend rests and sparse hits
                if (sec.name === "Outro") {
                    if (Math.random()<0.5) {
                        ml.notes.set(t0 + ticksPerBar - 2, new nbs.Note(leadInst, { key: chordTones[0] }));
                    }
                }
            }
        });
    }

    downloadSong(song);
}
