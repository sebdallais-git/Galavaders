// Game/public/js/audio.js
let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

export function resumeAudio() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();
}

function playTone(frequency, duration, type = 'square', volume = 0.15) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, volume = 0.1) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

export function playShoot() {
  playTone(880, 0.06, 'square', 0.08);
}

export function playEnemyHit() {
  playTone(440, 0.1, 'sine', 0.12);
  playTone(330, 0.08, 'square', 0.06);
}

export function playEnemyShoot() {
  playTone(220, 0.08, 'sawtooth', 0.06);
}

export function playExplosion() {
  playNoise(0.3, 0.15);
}

export function playPowerUp() {
  playTone(440, 0.12, 'sine', 0.1);
  setTimeout(() => playTone(554, 0.12, 'sine', 0.1), 60);
  setTimeout(() => playTone(659, 0.15, 'sine', 0.12), 120);
}

export function playBossWarning() {
  playTone(80, 0.6, 'sawtooth', 0.12);
  playTone(60, 0.8, 'sine', 0.08);
}

export function playLevelClear() {
  playTone(523, 0.15, 'square', 0.1);
  setTimeout(() => playTone(659, 0.15, 'square', 0.1), 100);
  setTimeout(() => playTone(784, 0.2, 'square', 0.12), 200);
  setTimeout(() => playTone(1047, 0.3, 'sine', 0.1), 300);
}

export function playGameOver() {
  playTone(440, 0.2, 'sawtooth', 0.1);
  setTimeout(() => playTone(330, 0.2, 'sawtooth', 0.1), 200);
  setTimeout(() => playTone(220, 0.4, 'sawtooth', 0.08), 400);
}

export function initAudio() {
  const resume = () => {
    resumeAudio();
    window.removeEventListener('keydown', resume);
  };
  window.addEventListener('keydown', resume);
}
