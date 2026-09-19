/* ============================================
   CertChain — Audio Engine
   Elegant ambient music + UI sound effects
   ============================================ */

const Audio = (() => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  let musicGain = null;
  let musicPlaying = false;
  let musicNodes = [];
  let muted = false;

  // ---- Resume context on first interaction ----
  function resume() {
    if (ctx.state === 'suspended') ctx.resume();
  }

  // ---- Master volume ----
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.6;
  masterGain.connect(ctx.destination);

  // ---- Sound Effects ----
  function playTone(freq, type = 'sine', duration = 0.12, vol = 0.15, delay = 0) {
    if (muted) return;
    resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(masterGain);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.98, ctx.currentTime + delay + duration);

    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.05);
  }

  const sfx = {
    // Soft click — buttons
    click() {
      playTone(880, 'sine', 0.08, 0.1);
      playTone(1100, 'sine', 0.06, 0.05, 0.04);
    },

    // Success — transaction confirmed, cert issued
    success() {
      playTone(523, 'sine', 0.15, 0.12);
      playTone(659, 'sine', 0.15, 0.12, 0.12);
      playTone(784, 'sine', 0.2, 0.14, 0.24);
    },

    // Error
    error() {
      playTone(220, 'sawtooth', 0.08, 0.08);
      playTone(180, 'sawtooth', 0.12, 0.1, 0.1);
    },

    // Wallet connected
    connect() {
      playTone(440, 'sine', 0.1, 0.1);
      playTone(554, 'sine', 0.1, 0.1, 0.1);
      playTone(659, 'sine', 0.15, 0.12, 0.2);
      playTone(880, 'sine', 0.1, 0.1, 0.32);
    },

    // Wallet disconnected
    disconnect() {
      playTone(440, 'sine', 0.1, 0.1);
      playTone(330, 'sine', 0.12, 0.1, 0.12);
    },

    // Toast / notification
    notify() {
      playTone(660, 'sine', 0.08, 0.08);
      playTone(880, 'sine', 0.1, 0.08, 0.08);
    },

    // Verify — confirm
    verify() {
      playTone(392, 'sine', 0.1, 0.1);
      playTone(523, 'sine', 0.12, 0.1, 0.12);
    }
  };

  // ---- Ambient Background Music ----
  // Elegant, minimal, ambient — no samples needed, generated via Web Audio API
  // Slow pad chords + subtle melody. Feels premium/trustless/financial.

  const SCALE = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
  const CHORD_ROOTS = [261.63, 220.00, 246.94, 196.00]; // C, A, B, G

  function createPadVoice(freq, duration, startTime, vol = 0.04) {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 1.003; // slight detune for warmth

    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.5;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(musicGain);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 2.5);
    gain.gain.setValueAtTime(vol, startTime + duration - 2.5);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration + 0.1);
    osc2.stop(startTime + duration + 0.1);

    musicNodes.push(osc1, osc2, gain, filter);
  }

  function playChord(root, startTime, duration) {
    // Root, major third, fifth, octave
    createPadVoice(root, duration, startTime, 0.035);
    createPadVoice(root * 1.25, duration, startTime, 0.025);
    createPadVoice(root * 1.5, duration, startTime, 0.02);
    createPadVoice(root * 2, duration, startTime, 0.015);
  }

  function scheduleMusic() {
    if (!musicPlaying || muted) return;

    const now = ctx.currentTime;
    const chordDur = 8; // 8 seconds per chord
    const totalCycle = CHORD_ROOTS.length * chordDur;

    CHORD_ROOTS.forEach((root, i) => {
      playChord(root, now + i * chordDur, chordDur + 1.5); // +1.5 overlap for smooth transition
    });

    // Schedule next cycle
    setTimeout(() => {
      if (musicPlaying && !muted) scheduleMusic();
    }, (totalCycle - 2) * 1000);
  }

  function startMusic() {
    if (musicPlaying) return;
    resume();

    musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(masterGain);

    musicPlaying = true;
    scheduleMusic();

    // Fade in
    musicGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 3);
  }

  function stopMusic() {
    if (!musicGain) return;
    musicPlaying = false;
    musicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
    setTimeout(() => {
      musicNodes.forEach(n => {
        try { n.disconnect(); } catch (_) {}
      });
      musicNodes = [];
      if (musicGain) {
        try { musicGain.disconnect(); } catch (_) {}
        musicGain = null;
      }
    }, 2500);
  }

  function toggleMute() {
    muted = !muted;
    if (muted) {
      masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    } else {
      resume();
      masterGain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.3);
      if (!musicPlaying) startMusic();
    }
    return muted;
  }

  // Auto-start music on first user gesture
  let musicStarted = false;
  function initMusicOnInteraction() {
    if (musicStarted) return;
    musicStarted = true;
    startMusic();
    document.removeEventListener('click', initMusicOnInteraction);
    document.removeEventListener('touchstart', initMusicOnInteraction);
  }
  document.addEventListener('click', initMusicOnInteraction, { once: true });
  document.addEventListener('touchstart', initMusicOnInteraction, { once: true });

  return { sfx, toggleMute, startMusic, stopMusic, get muted() { return muted; } };
})();
