/* ============================================
   CertChain — Audio Engine v2
   Cinematic ambient music + UI sound effects
   ============================================ */

const Audio = (() => {
  let ctx = null;
  let masterGain = null;
  let musicGain = null;
  let musicPlaying = false;
  let musicNodes = [];
  let initialized = false;

  function init() {
    if (initialized) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(ctx.destination);
    initialized = true;
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  // ---- Reverb (convolver) for depth ----
  function createReverb(duration = 2.5, decay = 2.0) {
    const convolver = ctx.createConvolver();
    const rate = ctx.sampleRate;
    const length = rate * duration;
    const impulse = ctx.createBuffer(2, length, rate);
    for (let c = 0; c < 2; c++) {
      const channel = impulse.getChannelData(c);
      for (let i = 0; i < length; i++) {
        channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    convolver.buffer = impulse;
    return convolver;
  }

  // ---- Sound Effects ----
  function playTone(freq, type = 'sine', duration = 0.12, vol = 0.12, delay = 0, detune = 0) {
    if (!initialized || !ctx) return;
    resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.value = 3000;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    if (detune) osc.detune.value = detune;

    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.05);
  }

  const sfx = {
    click() {
      if (!initialized) return;
      playTone(1200, 'sine', 0.06, 0.07);
      playTone(900, 'sine', 0.05, 0.04, 0.03);
    },
    success() {
      if (!initialized) return;
      playTone(523.25, 'sine', 0.18, 0.1);
      playTone(659.25, 'sine', 0.18, 0.1, 0.14);
      playTone(783.99, 'sine', 0.22, 0.13, 0.28);
      playTone(1046.5, 'sine', 0.18, 0.1, 0.44);
    },
    error() {
      if (!initialized) return;
      playTone(200, 'sawtooth', 0.1, 0.07);
      playTone(160, 'sawtooth', 0.14, 0.09, 0.1);
    },
    connect() {
      if (!initialized) return;
      [440, 554, 659, 880].forEach((f, i) => playTone(f, 'sine', 0.14, 0.1, i * 0.1));
    },
    disconnect() {
      if (!initialized) return;
      [440, 330, 220].forEach((f, i) => playTone(f, 'sine', 0.12, 0.09, i * 0.1));
    },
    notify() {
      if (!initialized) return;
      playTone(800, 'sine', 0.1, 0.08);
      playTone(1000, 'sine', 0.1, 0.07, 0.09);
    },
    verify() {
      if (!initialized) return;
      playTone(440, 'sine', 0.12, 0.09);
      playTone(554, 'sine', 0.14, 0.1, 0.1);
    },
    welcome() {
      if (!initialized) return;
      // Cinematic rising chord
      [130.81, 164.81, 196, 261.63, 329.63].forEach((f, i) =>
        playTone(f, 'sine', 0.8, 0.12, i * 0.12)
      );
    }
  };

  // ---- Cinematic Ambient Music ----
  // Rich, layered ambient — elegant, trustworthy, premium feel
  // Think: Hans Zimmer meets Brian Eno. Slow evolving pads + deep bass + shimmer.

  function createOscNode(freq, type, vol, detune = 0) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    if (detune) osc.detune.value = detune;
    gain.gain.value = vol;
    osc.connect(gain);
    musicNodes.push(osc, gain);
    return { osc, gain };
  }

  function startMusic() {
    if (musicPlaying || !initialized) return;
    resume();

    musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(masterGain);

    const reverb = createReverb(3.5, 2.5);
    reverb.connect(musicGain);
    musicNodes.push(reverb);

    const dryGain = ctx.createGain();
    dryGain.gain.value = 0.6;
    dryGain.connect(musicGain);

    const wetGain = ctx.createGain();
    wetGain.gain.value = 0.4;

    // Deep sub bass — 55hz (A1)
    const bass = createOscNode(55, 'sine', 0.18);
    bass.gain.connect(dryGain);

    // Bass harmony — 82.41hz (E2)
    const bassH = createOscNode(82.41, 'sine', 0.1);
    bassH.gain.connect(dryGain);

    // Mid pad — A3 (220hz) with slight detune for warmth
    const pad1 = createOscNode(220, 'sine', 0.09);
    const pad1b = createOscNode(220, 'triangle', 0.07, 8);
    pad1.gain.connect(reverb);
    pad1b.gain.connect(reverb);

    // Mid pad harmony — E3 (164.81hz)
    const pad2 = createOscNode(164.81, 'sine', 0.08);
    const pad2b = createOscNode(164.81, 'triangle', 0.06, -6);
    pad2.gain.connect(reverb);
    pad2b.gain.connect(reverb);

    // High shimmer — A4 (440hz)
    const shimmer = createOscNode(440, 'sine', 0.04);
    const shimmerB = createOscNode(440, 'sine', 0.03, 12);
    shimmer.gain.connect(reverb);
    shimmerB.gain.connect(reverb);

    // Very high overtone — A5 (880hz), barely audible
    const air = createOscNode(880, 'sine', 0.015);
    air.gain.connect(reverb);

    // Slow LFO for volume swell — makes it breathe
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.08; // very slow, ~12 second cycle
    lfoGain.gain.value = 0.025;
    lfo.connect(lfoGain);
    lfoGain.connect(musicGain.gain);
    lfo.start();
    musicNodes.push(lfo, lfoGain);

    // Slow chord progression — subtle frequency shifts every 16s
    const chordSets = [
      { bass: 55, bassH: 82.41, pad1: 220, pad2: 164.81 },    // Am
      { bass: 65.41, bassH: 98, pad1: 261.63, pad2: 196 },     // C
      { bass: 73.42, bassH: 110, pad1: 293.66, pad2: 220 },    // D
      { bass: 55, bassH: 82.41, pad1: 246.94, pad2: 185.0 },   // Am7
    ];
    let chordIdx = 0;
    const chordInterval = setInterval(() => {
      if (!musicPlaying) { clearInterval(chordInterval); return; }
      chordIdx = (chordIdx + 1) % chordSets.length;
      const ch = chordSets[chordIdx];
      const t = ctx.currentTime;
      const glide = 4; // 4 second glide between chords

      bass.osc.frequency.setTargetAtTime(ch.bass, t, glide);
      bassH.osc.frequency.setTargetAtTime(ch.bassH, t, glide);
      pad1.osc.frequency.setTargetAtTime(ch.pad1, t, glide);
      pad1b.osc.frequency.setTargetAtTime(ch.pad1, t, glide);
      pad2.osc.frequency.setTargetAtTime(ch.pad2, t, glide);
      pad2b.osc.frequency.setTargetAtTime(ch.pad2, t, glide);
    }, 16000);

    // Start all oscillators
    [bass, bassH, pad1, pad1b, pad2, pad2b, shimmer, shimmerB, air].forEach(n => n.osc.start());

    musicPlaying = true;

    // Fade in over 4 seconds
    musicGain.gain.setValueAtTime(0, ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 4);
  }

  function stopMusic() {
    if (!musicGain) return;
    musicPlaying = false;
    musicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
    setTimeout(() => {
      musicNodes.forEach(n => { try { n.disconnect(); } catch (_) {} });
      musicNodes = [];
      try { musicGain.disconnect(); } catch (_) {}
      musicGain = null;
    }, 2500);
  }

  return { init, sfx, startMusic, stopMusic };
})();
