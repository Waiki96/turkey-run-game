// Turkey Run — deterministic random numbers.
// One file, one job: a tiny seeded generator (mulberry32) so the demo
// screenshots and the autopilot play the exact same run every time.

(function () {
  'use strict';

  var TR = (window.TR = window.TR || {});

  // Returns a function that yields a deterministic stream of numbers in
  // [0, 1) from the given integer seed.
  TR.mulberry32 = function (seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // Integer in [min, max] from a random function.
  TR.randInt = function (rnd, min, max) {
    return min + Math.floor(rnd() * (max - min + 1));
  };

  // Pick one element from an array with a random function.
  TR.pick = function (rnd, arr) {
    return arr[Math.floor(rnd() * arr.length)];
  };

  // True with the given probability (0..1).
  TR.chance = function (rnd, p) {
    return rnd() < p;
  };
})();
