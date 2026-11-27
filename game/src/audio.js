// Turkey Run — procedural sound.
// One file, one job: every sound is synthesized with WebAudio, so the
// game ships no audio files and plays fully offline. Nothing here runs
// until the player first interacts (browsers require a gesture), and
// the M key toggles it off.

(function () {
  'use strict';

  var TR = (window.TR = window.TR || {});

  var ctx = null;
  var muted = false;

  function ensureCtx() {
    if (ctx) return ctx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  // A short oscillator blip that slides from one frequency to another.
  function tone(freqFrom, freqTo, dur, type, vol, delay) {
    if (muted) return;
    var c = ensureCtx();
    if (!c) return;
    try {
      if (c.state === 'suspended') c.resume();
      var t0 = c.currentTime + (delay || 0);
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freqFrom, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqTo), t0 + dur);
      gain.gain.setValueAtTime(vol || 0.12, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch (e) {
      /* sound is decoration; a failure never breaks the game */
    }
  }

  // A burst of filtered noise (thuds, flaps, sizzles).
  function noise(dur, vol, freq, delay) {
    if (muted) return;
    var c = ensureCtx();
    if (!c) return;
    try {
      if (c.state === 'suspended') c.resume();
      var t0 = c.currentTime + (delay || 0);
      var len = Math.max(1, Math.floor(c.sampleRate * dur));
      var buf = c.createBuffer(1, len, c.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var src = c.createBufferSource();
      src.buffer = buf;
      var filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = freq || 800;
      var gain = c.createGain();
      gain.gain.setValueAtTime(vol || 0.15, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(c.destination);
      src.start(t0);
    } catch (e) {
      /* sound is decoration */
    }
  }

  TR.Sound = {
    // Call on the first user gesture so later sounds are allowed.
    unlock: function () {
      ensureCtx();
    },
    toggleMute: function () {
      muted = !muted;
      return muted;
    },
    isMuted: function () {
      return muted;
    },
    jump: function () {
      tone(280, 620, 0.16, 'sine', 0.1);
      noise(0.08, 0.05, 1200);
    },
    corn: function () {
      tone(880, 1320, 0.12, 'triangle', 0.09);
      tone(1320, 1760, 0.1, 'triangle', 0.06, 0.07);
    },
    feather: function () {
      tone(520, 1040, 0.25, 'sine', 0.09);
      tone(780, 1560, 0.2, 'triangle', 0.06, 0.08);
    },
    hit: function () {
      noise(0.22, 0.22, 500);
      tone(180, 60, 0.25, 'sawtooth', 0.12);
    },
    stumble: function () {
      noise(0.12, 0.12, 700);
    },
    ovenSizzle: function () {
      noise(0.4, 0.06, 2400);
    },
    knifeSlash: function () {
      noise(0.14, 0.16, 3200);
      tone(900, 300, 0.12, 'square', 0.04);
    },
    stage: function () {
      tone(523, 523, 0.12, 'triangle', 0.09);
      tone(659, 659, 0.12, 'triangle', 0.09, 0.1);
      tone(784, 784, 0.2, 'triangle', 0.1, 0.2);
    },
    escaped: function () {
      var notes = [523, 659, 784, 1047, 1319];
      for (var i = 0; i < notes.length; i++) {
        tone(notes[i], notes[i], 0.22, 'triangle', 0.1, i * 0.13);
      }
    },
    caught: function () {
      var notes = [392, 330, 262, 196];
      for (var i = 0; i < notes.length; i++) {
        tone(notes[i], notes[i] * 0.94, 0.3, 'sawtooth', 0.07, i * 0.16);
      }
    },
  };
})();
