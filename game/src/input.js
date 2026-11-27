// Turkey Run — input.
// One file, one job: keyboard and mouse, turned into a small state the
// game loop reads. Jump is edge-triggered (a fresh press), slide and
// brake are held keys, and buttons on the screens are plain clicks.

(function () {
  'use strict';

  var TR = (window.TR = window.TR || {});

  var keys = {};
  var jumpQueued = false;
  var anyPressQueued = false;
  var click = null; // {x, y} in canvas coordinates, consumed by the loop

  var JUMP_CODES = { Space: true, ArrowUp: true, KeyW: true };
  var SLIDE_CODES = { ArrowDown: true, KeyS: true };
  var BRAKE_CODES = { ArrowDown: true, KeyS: true }; // hold down to brake

  function codeOf(e) {
    return e.code || e.key;
  }

  window.addEventListener('keydown', function (e) {
    var code = codeOf(e);
    if (JUMP_CODES[code] || SLIDE_CODES[code] || code === 'KeyP' || code === 'KeyM' || code === 'KeyR' || code === 'Enter') {
      e.preventDefault();
    }
    if (!e.repeat) {
      if (JUMP_CODES[code]) jumpQueued = true;
      anyPressQueued = true;
    }
    keys[code] = true;
    TR.Sound.unlock();
  });

  window.addEventListener('keyup', function (e) {
    keys[codeOf(e)] = false;
  });

  window.addEventListener('blur', function () {
    keys = {};
  });

  // The canvas element is found lazily so this file loads before the DOM
  // is fully parsed in any order.
  function canvasEl() {
    return document.getElementById('game');
  }

  function toCanvas(clientX, clientY) {
    var c = canvasEl();
    if (!c) return null;
    var r = c.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / r.width) * TR.CFG.VIEW_W,
      y: ((clientY - r.top) / r.height) * TR.CFG.VIEW_H,
    };
  }

  window.addEventListener('mousedown', function (e) {
    var p = toCanvas(e.clientX, e.clientY);
    if (p) {
      click = p;
      jumpQueued = true; // a click also jumps while playing
      anyPressQueued = true;
    }
    TR.Sound.unlock();
  });

  window.addEventListener('touchstart', function (e) {
    if (e.touches.length > 0) {
      var p = toCanvas(e.touches[0].clientX, e.touches[0].clientY);
      if (p) {
        click = p;
        jumpQueued = true;
        anyPressQueued = true;
      }
    }
    TR.Sound.unlock();
  }, { passive: true });

  TR.Input = {
    // True while any jump key (or the mouse) is held down.
    jumpHeld: function () {
      return !!(keys.Space || keys.ArrowUp || keys.KeyW);
    },
    // True once per fresh jump press; reading it consumes it.
    jumpPressed: function () {
      var v = jumpQueued;
      jumpQueued = false;
      return v;
    },
    slideHeld: function () {
      return !!(keys.ArrowDown || keys.KeyS);
    },
    brakeHeld: function () {
      return !!(keys.ArrowDown || keys.KeyS);
    },
    pausePressed: function () {
      return !!keys.KeyP;
    },
    mutePressed: function () {
      return !!keys.KeyM;
    },
    restartPressed: function () {
      return !!keys.KeyR;
    },
    // True once per fresh press of any key or click; consumed on read.
    anyPressed: function () {
      var v = anyPressQueued;
      anyPressQueued = false;
      return v;
    },
    // The last click in canvas coordinates, or null; consumed on read.
    takeClick: function () {
      var v = click;
      click = null;
      return v;
    },
    // Clear edge state (used when changing screens).
    clear: function () {
      jumpQueued = false;
      anyPressQueued = false;
      click = null;
    },
  };
})();
