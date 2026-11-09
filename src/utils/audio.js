// Web Audio API synthesized sound effects - zero external assets or network dependencies

let ctx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export function playSound(type, enabled = true) {
  if (!enabled) return;
  try {
    const ac = getAudioContext();
    if (!ac) return;

    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);

    if (type === 'correct') {
      // Pleasant two-tone chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.36);
    } else if (type === 'wrong') {
      // Gentle low double pulse
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.setValueAtTime(200, now + 0.09);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.29);
    } else if (type === 'click') {
      // Subtle click
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'complete') {
      // Victory fanfare chord
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + idx * 0.07);
        g.gain.setValueAtTime(0.1, now + idx * 0.07);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.4);
        o.connect(g);
        g.connect(ac.destination);
        o.start(now + idx * 0.07);
        o.stop(now + idx * 0.07 + 0.41);
      });
    }
  } catch {
    // Audio context play error handled gracefully
  }
}
