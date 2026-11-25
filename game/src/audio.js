// All sound is synthesised with WebAudio: no audio files, no network.
// The kitchen sizzles (filtered noise), the bell dings, a wrong move buzzes.
// Audio only starts after the player's first gesture, as browsers require;
// every call is safe when the context is suspended or missing.

let ctx = null;
let muted = false;
let sizzleNodes = null;

function ensureCtx() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    return null;
  }
  return ctx;
}

export function unlockAudio() {
  const c = ensureCtx();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  if (muted) stopSizzle();
  return muted;
}

function tone(freq, dur, type = 'sine', gain = 0.12, when = 0) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  try {
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch {
    // Sound is garnish; a game that cannot beep still plays.
  }
}

function noiseBurst(dur, gain = 0.08, freq = 1200) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  try {
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const g = c.createGain();
    g.gain.value = gain;
    src.connect(filter).connect(g).connect(c.destination);
    src.start();
  } catch {
    // See above.
  }
}

export const sfx = {
  click() { tone(660, 0.07, 'triangle', 0.08); },
  pick() { tone(520, 0.08, 'triangle', 0.09); tone(780, 0.08, 'triangle', 0.06, 0.05); },
  place() { tone(240, 0.1, 'sine', 0.12); noiseBurst(0.05, 0.04, 900); },
  grill() { noiseBurst(0.25, 0.1, 2400); tone(180, 0.15, 'sawtooth', 0.04); },
  ding() { tone(1046, 0.35, 'sine', 0.12); tone(1568, 0.3, 'sine', 0.07, 0.08); },
  serve() { tone(784, 0.12, 'triangle', 0.11); tone(1046, 0.12, 'triangle', 0.11, 0.09); tone(1318, 0.25, 'triangle', 0.11, 0.18); },
  wrong() { tone(160, 0.22, 'square', 0.07); tone(120, 0.25, 'square', 0.06, 0.1); },
  expire() { tone(220, 0.3, 'sawtooth', 0.06); tone(180, 0.35, 'sawtooth', 0.06, 0.12); },
  level() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'triangle', 0.1, i * 0.1)); },
};

// A soft looping sizzle while any patty cooks on the grill.
export function startSizzle() {
  if (muted || sizzleNodes) return;
  const c = ensureCtx();
  if (!c) return;
  try {
    const len = c.sampleRate;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    const g = c.createGain();
    g.gain.value = 0.035;
    src.connect(filter).connect(g).connect(c.destination);
    src.start();
    sizzleNodes = { src, g };
  } catch {
    sizzleNodes = null;
  }
}

export function stopSizzle() {
  if (!sizzleNodes) return;
  try { sizzleNodes.src.stop(); } catch { /* already stopped */ }
  sizzleNodes = null;
}
