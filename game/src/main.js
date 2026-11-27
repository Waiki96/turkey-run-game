// Turkey Run — the game loop.
// One file, one job: the state machine (title / play / paused / caught /
// escaped), the frame loop, the autopilot that plays the game by itself,
// and the demo modes the screenshots are taken in.

(function () {
  'use strict';

  var TR = (window.TR = window.TR || {});
  var CFG = TR.CFG;

  var canvas, ctx;
  var screen = 'title'; // title | play | paused | caught | escaped
  var world = null;
  var titleWorld = null;
  var best = 0;
  var muted = false;
  var lastTime = 0;
  var pauseEdge = false;
  var muteEdge = false;

  try {
    best = parseInt(window.localStorage.getItem('turkey-run-best') || '0', 10) || 0;
  } catch (e) {
    best = 0;
  }

  function saveBest() {
    try {
      window.localStorage.setItem('turkey-run-best', String(best));
    } catch (e) {
      /* best score is decoration */
    }
  }

  // Demo modes come from the URL hash or query string, e.g.
  // file://.../index.html#demo=play — used for the screenshots, so the
  // first painted frame already shows the game mid-run.
  function readDemo() {
    var src = '';
    if (window.location.hash) src = window.location.hash.slice(1);
    else if (window.location.search) src = window.location.search.slice(1);
    var out = {};
    src.split('&').forEach(function (pair) {
      var kv = pair.split('=');
      if (kv[0]) out[kv[0]] = kv[1] || '';
    });
    return out;
  }

  // --- autopilot ---------------------------------------------------------
  // Plays the game by reading the world: jump the jumpable hazards, slide
  // under branches, brake to time the carving knife. It proves the game
  // is winnable and drives the demo screenshots.

  function decide(world) {
    var ctl = { jump: false, slide: false, brake: false };
    var t = world.turkey;
    var next = null;
    for (var i = 0; i < world.obstacles.length; i++) {
      var ob = world.obstacles[i];
      if (ob.x + ob.w > CFG.TURKEY_X - 60) {
        next = ob;
        break;
      }
    }
    if (!next) return ctl;
    var gap = next.x - CFG.TURKEY_X; // px ahead of the turkey
    // Jump so the obstacle's middle is crossed near the top of the arc
    // (the highest, safest point): the apex is half the airtime out, so
    // start the jump when the middle is that far ahead, less half the
    // obstacle's width. Landing then falls well past the far edge.
    var apexOut = world.speed * (CFG.JUMP_VELOCITY / CFG.GRAVITY);
    var jumpWindow = apexOut - next.w / 2 + 20;
    var slideWindow = 170;
    if (next.kind === 'knife') {
      // The blade drops on a cycle. If it will be down while the turkey
      // crosses the frame, brake and wait it out; if it is up, jump the
      // low base like any other small obstacle.
      var arriveIn = gap / Math.max(1, world.speed);
      var downSoon = false;
      for (var k = 0; k < 2; k++) {
        var phase = (world.time + arriveIn + k * 0.15 + next.offset) % CFG.KNIFE_PERIOD;
        if (phase >= CFG.KNIFE_PERIOD - CFG.KNIFE_DOWN_TIME) downSoon = true;
      }
      if (downSoon && gap < 340 && gap > 0) {
        ctl.brake = true;
      } else if (gap < jumpWindow && gap > 10 && t.onGround) {
        ctl.jump = true;
      }
    } else if (next.kind === 'branch') {
      // Hold the slide until the turkey is well past the branch's far edge.
      if (gap < slideWindow && gap > -80) ctl.slide = true;
    } else {
      if (gap < jumpWindow && gap > 10 && t.onGround) ctl.jump = true;
    }
    return ctl;
  }

  // --- screens -----------------------------------------------------------

  function startRun(seed) {
    world = TR.World.create(seed || 1337);
    screen = 'play';
    TR.Input.clear();
  }

  function endRun(kind) {
    screen = kind;
    var s = Math.floor(world.score);
    if (s > best) {
      best = s;
      saveBest();
    }
    if (kind === 'escaped') TR.Sound.escaped();
    else TR.Sound.caught();
  }

  function applyDemo() {
    var demo = readDemo();
    var mode = demo.demo || demo.mode || '';
    if (!mode) return;
    if (mode === 'title') {
      screen = 'title';
      titleWorld.time = 0.3; // the "press to start" prompt is showing
      window.__demoFrozen = true; // hold the frame steady for the shot
    } else if (mode === 'play' || mode === 'oven') {
      startRun(1337);
      if (mode === 'oven') {
        // Fast-forward until an oven or a knife is on screen ahead.
        var guard = 0;
        while (guard++ < 60 * 40) {
          TR.World.update(world, 1 / 60, decide(world));
          if (world.over) break;
          var found = false;
          for (var i = 0; i < world.obstacles.length; i++) {
            var ob = world.obstacles[i];
            if ((ob.kind === 'oven' || ob.kind === 'knife') && ob.x > CFG.TURKEY_X + 100 && ob.x < CFG.TURKEY_X + 620) {
              found = true;
              break;
            }
          }
          if (found) break;
        }
      } else {
        TR.World.fastForward(world, 7, decide);
        // Keep running until an obstacle is on screen ahead, so the
        // screenshot shows the game, not an empty field.
        var guardPlay = 0;
        while (guardPlay++ < 60 * 20) {
          var inView = false;
          for (var vi = 0; vi < world.obstacles.length; vi++) {
            var vo = world.obstacles[vi];
            if (vo.x > CFG.TURKEY_X + 200 && vo.x < CFG.TURKEY_X + 700) {
              inView = true;
              break;
            }
          }
          if (inView) break;
          TR.World.update(world, 1 / 60, decide(world));
          if (world.over) break;
        }
      }
      // Stage the chase so the farmer is visible right behind the turkey.
      world.farmerGap = mode === 'oven' ? 130 : 110;
      screen = 'play';
      // Freeze on a good frame: stop the loop from advancing further
      // until the screenshot is taken (the harness waits, then shoots).
      window.__demoFrozen = true;
    } else if (mode === 'escaped') {
      startRun(1337);
      TR.World.fastForward(world, 30, decide);
      world.distance = CFG.GOAL_METRES;
      world.score = 12480;
      world.cornCount = 21;
      world.over = 'escaped';
      endRun('escaped');
      world.time = 0.3; // the "run again" prompt is showing
      window.__demoFrozen = true;
    } else if (mode === 'caught') {
      startRun(1337);
      TR.World.fastForward(world, 5, decide);
      world.lives = 0;
      world.farmerGap = 20;
      world.over = 'caught';
      endRun('caught');
      world.time = 0.3;
      window.__demoFrozen = true;
    }
  }

  // --- the loop ----------------------------------------------------------

  function frame(ts) {
    requestAnimationFrame(frame);
    var now = ts / 1000;
    if (!lastTime) lastTime = now;
    var dt = Math.min(0.05, now - lastTime);
    lastTime = now;

    // Edge-triggered keys (pause / mute) need a manual edge: the key is
    // held, so act once per press via a latch.
    var p = TR.Input.pausePressed();
    if (p && !pauseEdge) {
      pauseEdge = true;
      if (screen === 'play') screen = 'paused';
      else if (screen === 'paused') screen = 'play';
    } else if (!p) {
      pauseEdge = false;
    }
    var m = TR.Input.mutePressed();
    if (m && !muteEdge) {
      muteEdge = true;
      muted = TR.Sound.toggleMute();
    } else if (!m) {
      muteEdge = false;
    }

    if (screen === 'title') {
      if (!window.__demoFrozen) titleWorld.time += dt;
      if (TR.Input.anyPressed()) {
        startRun(1337 + Math.floor(Math.random() * 100000));
      }
      TR.Render.draw(ctx, titleWorld, { screen: 'title', best: best, muted: muted });
      return;
    }

    if (screen === 'paused') {
      TR.Render.draw(ctx, world, { screen: 'paused', best: best, muted: muted });
      return;
    }

    if (screen === 'caught' || screen === 'escaped') {
      if (!window.__demoFrozen) world.time += dt;
      if (TR.Input.restartPressed() || TR.Input.anyPressed()) {
        startRun(1337 + Math.floor(Math.random() * 100000));
      }
      TR.Render.draw(ctx, world, { screen: screen, best: best, muted: muted });
      return;
    }

    // Playing.
    if (window.__demoFrozen) {
      // Demo screenshot mode: hold the frame steady.
      TR.Render.draw(ctx, world, { screen: 'play', best: best, muted: muted });
      return;
    }
    var ctl = {
      jump: TR.Input.jumpPressed(),
      slide: TR.Input.slideHeld(),
      brake: TR.Input.brakeHeld(),
    };
    TR.World.update(world, dt, ctl);
    if (world.over) {
      endRun(world.over);
    }
    TR.Render.draw(ctx, world, { screen: 'play', best: best, muted: muted });
  }

  function boot() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    titleWorld = TR.World.create(20261127);
    world = titleWorld;
    applyDemo();
    requestAnimationFrame(frame);
  }

  // A small handle for local testing (and for nothing else): the harness
  // drives the autopilot straight against the world to prove the game is
  // winnable, without a browser.
  TR.debug = {
    decide: decide,
    startRun: startRun,
    getWorld: function () { return world; },
    getScreen: function () { return screen; },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
