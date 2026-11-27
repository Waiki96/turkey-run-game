// Turkey Run — the world simulation.
// One file, one job: the level, the obstacles, the corn, the farmer
// chase, the stages and every collision. It knows nothing about drawing
// or about the screen; main.js drives it and render.js draws it.

(function () {
  'use strict';

  var TR = (window.TR = window.TR || {});
  var CFG = TR.CFG;

  // Obstacle kinds. `h` is the height above the ground; `w` the width.
  // `jump` means the turkey clears it by jumping; `slide` means it must
  // slide under; `knife` is the timed trap (see below).
  var KINDS = {
    fence: { w: 34, h: 78, jump: true },
    bale: { w: 88, h: 62, jump: true },
    pumpkin: { w: 48, h: 42, jump: true },
    branch: { w: 70, h: 0, slide: true }, // hangs at head height
    oven: { w: 126, h: 112, jump: true, hot: true },
    knife: { w: 64, h: 30, trap: true }, // base is low; the blade drops
  };

  // Which hazards each stage throws at the turkey, with weights.
  var STAGE_TABLES = [
    ['fence', 'fence', 'bale', 'pumpkin', 'branch', 'fence', 'bale'],
    ['fence', 'bale', 'pumpkin', 'branch', 'oven', 'fence', 'branch', 'bale'],
    ['oven', 'knife', 'branch', 'bale', 'knife', 'oven', 'fence', 'pumpkin'],
  ];

  function makeTurkey() {
    return {
      y: 0, // height above the ground (0 = feet on the ground)
      vy: 0,
      onGround: true,
      sliding: false,
      slideTimer: 0,
      invincible: 0, // seconds of no further hits
      shield: false, // a golden feather absorbs one hit
      blink: 0, // hit-flash timer for the renderer
    };
  }

  function createWorld(seed) {
    var rnd = TR.mulberry32(seed || 1337);
    var world = {
      seed: seed || 1337,
      rnd: rnd,
      time: 0,
      distance: 0, // metres travelled
      speed: CFG.BASE_SPEED,
      obstacles: [],
      corns: [],
      feathers: [],
      decor: [], // scenery: clouds, trees, fences, pumpkins
      nextSpawnX: 900,
      stageIndex: 0,
      stageJustChanged: false,
      turkey: makeTurkey(),
      lives: CFG.LIVES,
      score: 0,
      cornCount: 0,
      farmerGap: CFG.FARMER_START_GAP,
      braking: false,
      over: null, // 'caught' | 'escaped' once the run ends
      events: [], // one-frame events for main.js: 'hit','corn','stage','knife','oven'
    };
    spawnDecor(world, 0, CFG.VIEW_W * 2);
    return world;
  }

  // --- scenery -----------------------------------------------------------

  function spawnDecor(world, fromX, toX) {
    var rnd = world.rnd;
    for (var x = fromX; x < toX; x += TR.randInt(rnd, 120, 260)) {
      var roll = rnd();
      var item;
      if (roll < 0.22) item = { kind: 'cloud', x: x, y: TR.randInt(rnd, 60, 180), s: TR.randInt(rnd, 50, 110), par: 0.15 };
      else if (roll < 0.5) item = { kind: 'tree', x: x, s: TR.randInt(rnd, 70, 130) / 100, par: 0.5 };
      else if (roll < 0.68) item = { kind: 'bush', x: x, s: TR.randInt(rnd, 60, 110) / 100, par: 0.7 };
      else if (roll < 0.84) item = { kind: 'fencepost', x: x, par: 0.9 };
      else item = { kind: 'pumpkin', x: x, s: TR.randInt(rnd, 70, 110) / 100, par: 0.9 };
      world.decor.push(item);
    }
  }

  // --- spawning ----------------------------------------------------------

  function stageOf(distance) {
    var idx = 0;
    for (var i = 0; i < CFG.STAGES.length; i++) {
      if (distance >= CFG.STAGES[i].from) idx = i;
    }
    return idx;
  }

  function spawnObstacle(world) {
    var rnd = world.rnd;
    var table = STAGE_TABLES[world.stageIndex];
    var kind = TR.pick(rnd, table);
    var def = KINDS[kind];
    var x = world.nextSpawnX;
    var ob = {
      kind: kind,
      x: x,
      w: def.w,
      h: def.h,
      offset: rnd() * CFG.KNIFE_PERIOD, // the knife trap's phase
      hitDone: false,
      passed: false,
    };
    world.obstacles.push(ob);

    // Corn arcs over jump obstacles, a line at running height elsewhere.
    if (def.jump && TR.chance(rnd, 0.75)) {
      var n = TR.randInt(rnd, 3, 5);
      for (var i = 0; i < n; i++) {
        world.corns.push({
          x: x + def.w / 2 + (i - (n - 1) / 2) * 44,
          y: 150 + Math.abs(i - (n - 1) / 2) * -28 + (def.h > 90 ? 30 : 0),
          taken: false,
        });
      }
    } else if (TR.chance(rnd, 0.4)) {
      for (var j = 0; j < 3; j++) {
        world.corns.push({ x: x + 130 + j * 46, y: 60, taken: false });
      }
    }

    // A golden feather (one free hit) is rare.
    if (TR.chance(rnd, 0.07)) {
      world.feathers.push({ x: x + 260, y: 120, taken: false });
    }

    var gap = TR.randInt(rnd, CFG.GAP_MIN, CFG.GAP_MAX);
    if (kind === 'knife' || kind === 'oven') gap += 160; // breather after a trap
    world.nextSpawnX = x + def.w + gap;
  }

  // --- turkey hitbox -----------------------------------------------------

  function turkeyBox(world) {
    var t = world.turkey;
    var w = t.sliding ? 86 : 54;
    var h = t.sliding ? 46 : 88;
    return {
      x: CFG.TURKEY_X - w / 2,
      y: CFG.GROUND_Y - t.y - h,
      w: w,
      h: h,
    };
  }

  function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // The knife trap's blade state at a world time: 'up' | 'warn' | 'down'.
  function knifeState(ob, time) {
    var phase = (time + ob.offset) % CFG.KNIFE_PERIOD;
    if (phase >= CFG.KNIFE_PERIOD - CFG.KNIFE_DOWN_TIME) return 'down';
    if (phase >= CFG.KNIFE_PERIOD - CFG.KNIFE_DOWN_TIME - CFG.KNIFE_WARN_TIME) return 'warn';
    return 'up';
  }

  // --- the hit -----------------------------------------------------------

  function applyHit(world, ob) {
    var t = world.turkey;
    if (t.invincible > 0) return;
    if (t.shield) {
      t.shield = false;
      t.invincible = CFG.INVINCIBLE_AFTER_HIT;
      t.blink = 0.5;
      ob.hitDone = true;
      world.events.push('saved');
      TR.Sound.feather();
      return;
    }
    world.lives -= 1;
    t.invincible = CFG.INVINCIBLE_AFTER_HIT;
    t.blink = 0.7;
    world.farmerGap = Math.max(0, world.farmerGap - CFG.FARMER_GAIN_ON_HIT);
    world.events.push('hit');
    TR.Sound.hit();
    if (world.lives <= 0) {
      world.over = 'caught';
    }
  }

  // --- update ------------------------------------------------------------

  // `ctl` is {jump:boolean, slide:boolean, brake:boolean} for this frame.
  // Returns nothing; read world.events (cleared each call) for sounds and
  // flashes, and world.over for the end of the run.
  function update(world, dt, ctl) {
    world.events.length = 0;
    world.time += dt;
    var t = world.turkey;
    var stage = stageOf(world.distance);
    if (stage !== world.stageIndex) {
      world.stageIndex = stage;
      world.score += CFG.STAGE_BONUS;
      world.events.push('stage');
      TR.Sound.stage();
    }

    // Speed: faster the further the turkey gets, slower while braking.
    var target = Math.min(CFG.MAX_SPEED, CFG.BASE_SPEED + world.distance * CFG.SPEED_PER_METRE);
    if (ctl.brake && t.onGround) {
      target = Math.max(170, target - CFG.BRAKE_DECEL * 0.35);
      world.braking = true;
    } else {
      world.braking = false;
    }
    world.speed += (target - world.speed) * Math.min(1, dt * 3);

    // Turkey physics.
    if (ctl.jump && t.onGround && !t.sliding) {
      t.vy = CFG.JUMP_VELOCITY;
      t.onGround = false;
      TR.Sound.jump();
    }
    if (ctl.slide && t.onGround) {
      t.sliding = true;
      t.slideTimer = CFG.SLIDE_TIME;
    }
    if (t.sliding) {
      t.slideTimer -= dt;
      if (t.slideTimer <= 0 || !ctl.slide) t.sliding = false;
    }
    if (!t.onGround) {
      t.vy -= CFG.GRAVITY * dt;
      t.y += t.vy * dt;
      if (t.y <= 0) {
        t.y = 0;
        t.vy = 0;
        t.onGround = true;
      }
    }
    if (t.invincible > 0) t.invincible -= dt;
    if (t.blink > 0) t.blink -= dt;

    // The world scrolls past the turkey.
    var dx = world.speed * dt;
    world.distance += dx / CFG.PX_PER_METRE;
    world.score += (dx / CFG.PX_PER_METRE) * CFG.METRE_SCORE;

    for (var i = 0; i < world.obstacles.length; i++) world.obstacles[i].x -= dx;
    for (var j = 0; j < world.corns.length; j++) world.corns[j].x -= dx;
    for (var k = 0; k < world.feathers.length; k++) world.feathers[k].x -= dx;
    for (var d = 0; d < world.decor.length; d++) world.decor[d].x -= dx * world.decor[d].par;

    // Spawn ahead, cull behind. nextSpawnX scrolls left with the world,
    // so new hazards keep arriving as the turkey runs.
    world.nextSpawnX -= dx;
    while (world.nextSpawnX < CFG.VIEW_W + 300) spawnObstacle(world);
    world.obstacles = world.obstacles.filter(function (o) { return o.x + o.w > -80; });
    world.corns = world.corns.filter(function (c) { return c.x > -60 && !c.taken; });
    world.feathers = world.feathers.filter(function (f) { return f.x > -60 && !f.taken; });
    world.decor = world.decor.filter(function (d) { return d.x > -200; });
    if (world.decor.length === 0 || world.decor[world.decor.length - 1].x < CFG.VIEW_W + 200) {
      spawnDecor(world, CFG.VIEW_W + 200, CFG.VIEW_W + 900);
    }

    // Collisions.
    var box = turkeyBox(world);
    for (var oi = 0; oi < world.obstacles.length; oi++) {
      var ob = world.obstacles[oi];
      var def = KINDS[ob.kind];
      var obBox;
      if (ob.kind === 'branch') {
        // The branch hangs at head height: only a standing turkey hits it.
        obBox = { x: ob.x, y: CFG.GROUND_Y - 150, w: ob.w, h: 54 };
      } else if (ob.kind === 'knife') {
        var state = knifeState(ob, world.time);
        if (state === 'down') {
          obBox = { x: ob.x, y: CFG.GROUND_Y - 150, w: ob.w, h: 150 };
        } else {
          obBox = { x: ob.x, y: CFG.GROUND_Y - def.h, w: ob.w, h: def.h };
        }
        if (state === 'down' && !ob.warnedDown) {
          ob.warnedDown = true;
          world.events.push('knife');
          TR.Sound.knifeSlash();
        }
        if (state !== 'down') ob.warnedDown = false;
      } else {
        obBox = { x: ob.x, y: CFG.GROUND_Y - def.h, w: ob.w, h: def.h };
      }
      if (!ob.hitDone && overlaps(box, obBox)) {
        if (ob.kind === 'oven') world.events.push('oven');
        applyHit(world, ob);
      }
      if (!ob.passed && ob.x + ob.w < CFG.TURKEY_X - 40) ob.passed = true;
    }

    for (var ci = 0; ci < world.corns.length; ci++) {
      var corn = world.corns[ci];
      if (!corn.taken && overlaps(box, { x: corn.x - 16, y: CFG.GROUND_Y - corn.y - 16, w: 32, h: 32 })) {
        corn.taken = true;
        world.cornCount += 1;
        world.score += CFG.CORN_SCORE;
        world.events.push('corn');
        TR.Sound.corn();
      }
    }
    for (var fi = 0; fi < world.feathers.length; fi++) {
      var f = world.feathers[fi];
      if (!f.taken && overlaps(box, { x: f.x - 20, y: CFG.GROUND_Y - f.y - 20, w: 40, h: 40 })) {
        f.taken = true;
        t.shield = true;
        world.events.push('feather');
        TR.Sound.feather();
      }
    }

    // The farmer: he gains on every stumble and while the turkey brakes
    // or slides, and falls behind while the turkey runs clean.
    if (world.braking) {
      world.farmerGap -= CFG.FARMER_GAIN_ON_BRAKE * dt;
    } else if (t.sliding) {
      world.farmerGap -= CFG.FARMER_GAIN_ON_SLIDE * dt;
    } else {
      world.farmerGap += CFG.FARMER_FALL_BEHIND * dt;
    }
    world.farmerGap = Math.max(0, Math.min(CFG.FARMER_MAX_GAP, world.farmerGap));
    if (world.farmerGap <= CFG.FARMER_CATCH_GAP && !world.over) {
      world.over = 'caught';
      world.events.push('caught');
    }
    if (world.distance >= CFG.GOAL_METRES && !world.over) {
      world.over = 'escaped';
      world.events.push('escaped');
    }
  }

  // Run the simulation forward without drawing (used for the demo
  // screenshots, so the first painted frame is already mid-run).
  function fastForward(world, seconds, decide) {
    var steps = Math.round(seconds * 60);
    for (var i = 0; i < steps; i++) {
      if (world.over) break;
      update(world, 1 / 60, decide(world));
    }
  }

  TR.World = {
    KINDS: KINDS,
    create: createWorld,
    update: update,
    fastForward: fastForward,
    knifeState: knifeState,
    turkeyBox: turkeyBox,
    stageOf: stageOf,
  };
})();
