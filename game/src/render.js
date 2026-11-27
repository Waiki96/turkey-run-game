// Turkey Run — rendering.
// One file, one job: everything the player sees, drawn on one canvas
// with plain 2D calls. All art is procedural (no image files), so the
// game loads nothing and the screenshots are renders of this code.

(function () {
  'use strict';

  var TR = (window.TR = window.TR || {});
  var CFG = TR.CFG;
  var PAL = TR.PALETTE;

  function stagePalette(world) {
    return CFG.STAGES[world.stageIndex];
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function ellipse(ctx, x, y, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  }

  // --- scenery -----------------------------------------------------------

  function drawSky(ctx, world) {
    var st = stagePalette(world);
    var g = ctx.createLinearGradient(0, 0, 0, CFG.HORIZON_Y + 60);
    g.addColorStop(0, st.sky[0]);
    g.addColorStop(1, st.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CFG.VIEW_W, CFG.HORIZON_Y + 60);

    // Sun.
    ctx.fillStyle = '#fff3c4';
    ellipse(ctx, 1080, 110, 58, 58);
    ctx.fill();
    ctx.fillStyle = '#ffe08a';
    ellipse(ctx, 1080, 110, 46, 46);
    ctx.fill();

    // Distant hills.
    ctx.fillStyle = st.hill;
    ctx.beginPath();
    ctx.moveTo(0, CFG.HORIZON_Y);
    ctx.quadraticCurveTo(320, CFG.HORIZON_Y - 90, 640, CFG.HORIZON_Y - 20);
    ctx.quadraticCurveTo(960, CFG.HORIZON_Y - 110, CFG.VIEW_W, CFG.HORIZON_Y - 30);
    ctx.lineTo(CFG.VIEW_W, CFG.HORIZON_Y + 60);
    ctx.lineTo(0, CFG.HORIZON_Y + 60);
    ctx.closePath();
    ctx.fill();

    // The barn on the horizon.
    ctx.fillStyle = '#a83c2a';
    ctx.fillRect(880, CFG.HORIZON_Y - 78, 150, 78);
    ctx.fillStyle = '#7e2a1e';
    ctx.beginPath();
    ctx.moveTo(870, CFG.HORIZON_Y - 78);
    ctx.lineTo(955, CFG.HORIZON_Y - 128);
    ctx.lineTo(1040, CFG.HORIZON_Y - 78);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f5e6c8';
    ctx.fillRect(935, CFG.HORIZON_Y - 46, 40, 46);
    ctx.strokeStyle = '#f5e6c8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(955, CFG.HORIZON_Y - 46);
    ctx.lineTo(955, CFG.HORIZON_Y);
    ctx.moveTo(935, CFG.HORIZON_Y - 23);
    ctx.lineTo(975, CFG.HORIZON_Y - 23);
    ctx.stroke();
  }

  function drawGround(ctx, world) {
    var st = stagePalette(world);
    ctx.fillStyle = '#8a6a2f';
    ctx.fillRect(0, CFG.GROUND_Y, CFG.VIEW_W, 26);
    ctx.fillStyle = st.ground;
    ctx.fillRect(0, CFG.GROUND_Y + 26, CFG.VIEW_W, CFG.VIEW_H - CFG.GROUND_Y - 26);
    // Scrolling pebbles and grass tufts, placed by distance so they move.
    var off = (world.distance * CFG.PX_PER_METRE) % 90;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (var x = -off; x < CFG.VIEW_W; x += 90) {
      ellipse(ctx, x + 30, CFG.GROUND_Y + 60, 9, 4);
      ctx.fill();
      ellipse(ctx, x + 70, CFG.GROUND_Y + 96, 12, 5);
      ctx.fill();
    }
    ctx.strokeStyle = '#6d8f3a';
    ctx.lineWidth = 3;
    for (var gx = -off + 55; gx < CFG.VIEW_W; gx += 180) {
      ctx.beginPath();
      ctx.moveTo(gx, CFG.GROUND_Y + 4);
      ctx.lineTo(gx - 6, CFG.GROUND_Y - 12);
      ctx.moveTo(gx + 6, CFG.GROUND_Y + 4);
      ctx.lineTo(gx + 10, CFG.GROUND_Y - 10);
      ctx.stroke();
    }
  }

  function drawDecor(ctx, world) {
    var items = world.decor;
    for (var i = 0; i < items.length; i++) {
      var d = items[i];
      if (d.kind === 'cloud') {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ellipse(ctx, d.x, d.y, d.s, d.s * 0.36);
        ctx.fill();
        ellipse(ctx, d.x + d.s * 0.5, d.y + 8, d.s * 0.6, d.s * 0.3);
        ctx.fill();
      } else if (d.kind === 'tree') {
        ctx.fillStyle = '#7a4a21';
        ctx.fillRect(d.x - 5, CFG.GROUND_Y - 150 * d.s, 10, 150 * d.s);
        ctx.fillStyle = PAL.leaf[i % PAL.leaf.length];
        ellipse(ctx, d.x, CFG.GROUND_Y - 165 * d.s, 46 * d.s, 40 * d.s);
        ctx.fill();
        ellipse(ctx, d.x - 28 * d.s, CFG.GROUND_Y - 135 * d.s, 30 * d.s, 26 * d.s);
        ctx.fill();
        ellipse(ctx, d.x + 28 * d.s, CFG.GROUND_Y - 135 * d.s, 30 * d.s, 26 * d.s);
        ctx.fill();
      } else if (d.kind === 'bush') {
        ctx.fillStyle = '#5d7f2e';
        ellipse(ctx, d.x, CFG.GROUND_Y - 14 * d.s, 34 * d.s, 18 * d.s);
        ctx.fill();
      } else if (d.kind === 'fencepost') {
        ctx.fillStyle = PAL.fence;
        ctx.fillRect(d.x - 4, CFG.GROUND_Y - 52, 8, 52);
        ctx.fillRect(d.x - 4, CFG.GROUND_Y - 34, 60, 6);
      } else if (d.kind === 'pumpkin') {
        ctx.fillStyle = PAL.pumpkin;
        ellipse(ctx, d.x, CFG.GROUND_Y - 14 * d.s, 20 * d.s, 15 * d.s);
        ctx.fill();
        ctx.strokeStyle = '#c85a10';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(d.x - 8 * d.s, CFG.GROUND_Y - 26 * d.s);
        ctx.quadraticCurveTo(d.x, CFG.GROUND_Y - 6 * d.s, d.x + 8 * d.s, CFG.GROUND_Y - 26 * d.s);
        ctx.stroke();
        ctx.fillStyle = '#5d7f2e';
        ctx.fillRect(d.x - 2, CFG.GROUND_Y - 32 * d.s, 4, 8);
      }
    }
  }

  // --- the turkey --------------------------------------------------------

  function drawTurkey(ctx, world, x, y, phase, sliding, jumping, blink) {
    if (blink && Math.floor(world.time * 14) % 2 === 0) return; // hit flash
    ctx.save();
    ctx.translate(x, y);
    if (sliding) {
      // Flattened: body low, tail streaming behind, legs tucked.
      ctx.fillStyle = PAL.turkeyBody;
      ellipse(ctx, 0, -20, 46, 18);
      ctx.fill();
      ctx.fillStyle = PAL.turkeyDark;
      ellipse(ctx, -34, -24, 26, 10);
      ctx.fill();
      ctx.fillStyle = PAL.turkeyHead;
      ellipse(ctx, 40, -26, 15, 12);
      ctx.fill();
      ctx.fillStyle = PAL.beak;
      ctx.beginPath();
      ctx.moveTo(52, -28);
      ctx.lineTo(66, -23);
      ctx.lineTo(52, -20);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ellipse(ctx, 42, -30, 3.5, 4.5);
      ctx.fill();
      ctx.fillStyle = '#222';
      ellipse(ctx, 43, -30, 1.8, 2.4);
      ctx.fill();
    } else {
      var legSwing = jumping ? 0.5 : Math.sin(phase) * 0.9;
      // Legs.
      ctx.strokeStyle = '#e8a33d';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-6, -34);
      ctx.lineTo(-6 + Math.sin(phase) * 14, 0);
      ctx.moveTo(8, -34);
      ctx.lineTo(8 - Math.sin(phase) * 14, 0);
      ctx.stroke();
      // Fanned tail.
      for (var f = 0; f < 5; f++) {
        var ang = -0.9 + f * 0.45;
        ctx.save();
        ctx.translate(-26, -52);
        ctx.rotate(ang);
        ctx.fillStyle = PAL.featherFan[f];
        ellipse(ctx, 0, -26, 9, 26);
        ctx.fill();
        ctx.restore();
      }
      // Body.
      ctx.fillStyle = PAL.turkeyBody;
      ellipse(ctx, 0, -46, 34, 30);
      ctx.fill();
      ctx.fillStyle = PAL.turkeyLight;
      ellipse(ctx, 4, -40, 22, 18);
      ctx.fill();
      // Wing.
      ctx.fillStyle = PAL.turkeyDark;
      ellipse(ctx, -2 + legSwing * 2, -48, 16, 11);
      ctx.fill();
      // Head, beak, wattle, eye.
      ctx.fillStyle = PAL.turkeyHead;
      ellipse(ctx, 28, -82, 15, 14);
      ctx.fill();
      ctx.fillStyle = PAL.beak;
      ctx.beginPath();
      ctx.moveTo(40, -86);
      ctx.lineTo(56, -80);
      ctx.lineTo(40, -76);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PAL.wattle;
      ellipse(ctx, 38, -70, 5, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ellipse(ctx, 30, -86, 4, 5);
      ctx.fill();
      ctx.fillStyle = '#222';
      ellipse(ctx, 31, -86, 2, 2.8);
      ctx.fill();
    }
    ctx.restore();
  }

  // --- the farmer --------------------------------------------------------

  function drawFarmer(ctx, world, x, phase) {
    ctx.save();
    ctx.translate(x, CFG.GROUND_Y);
    var bob = Math.abs(Math.sin(phase)) * -6;
    ctx.translate(0, bob);
    // Legs (running).
    ctx.strokeStyle = PAL.farmerOveralls;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4, -58);
    ctx.lineTo(-4 + Math.sin(phase) * 18, 0);
    ctx.moveTo(6, -58);
    ctx.lineTo(6 - Math.sin(phase) * 18, 0);
    ctx.stroke();
    // Overalls + shirt.
    ctx.fillStyle = PAL.farmerOveralls;
    rr(ctx, -16, -96, 34, 42, 6);
    ctx.fill();
    ctx.fillStyle = PAL.farmerShirt;
    rr(ctx, -18, -118, 38, 28, 8);
    ctx.fill();
    // Arm with a pitchfork, reaching forward.
    ctx.strokeStyle = PAL.farmerSkin;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(14, -108);
    ctx.lineTo(34, -88);
    ctx.stroke();
    ctx.strokeStyle = '#8a6d3b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(30, -128);
    ctx.lineTo(44, -62);
    ctx.stroke();
    ctx.strokeStyle = '#c0c8ce';
    ctx.lineWidth = 3;
    for (var p = -1; p <= 1; p++) {
      ctx.beginPath();
      ctx.moveTo(44 + p * 6, -62);
      ctx.lineTo(48 + p * 6, -80);
      ctx.stroke();
    }
    // Head, hat, moustache, angry brows.
    ctx.fillStyle = PAL.farmerSkin;
    ellipse(ctx, 2, -134, 15, 15);
    ctx.fill();
    ctx.fillStyle = PAL.farmerHat;
    ellipse(ctx, 2, -146, 22, 7);
    ctx.fill();
    ctx.fillRect(-12, -164, 28, 16);
    ctx.fillStyle = '#5b4636';
    ellipse(ctx, 6, -126, 8, 3);
    ctx.fill();
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-6, -140);
    ctx.lineTo(2, -137);
    ctx.moveTo(14, -140);
    ctx.lineTo(8, -137);
    ctx.stroke();
    ctx.restore();
  }

  // --- obstacles ---------------------------------------------------------

  function drawFence(ctx, ob) {
    ctx.fillStyle = PAL.fence;
    ctx.fillRect(ob.x, CFG.GROUND_Y - 78, 8, 78);
    ctx.fillRect(ob.x + ob.w - 8, CFG.GROUND_Y - 78, 8, 78);
    ctx.fillRect(ob.x - 6, CFG.GROUND_Y - 66, ob.w + 12, 8);
    ctx.fillRect(ob.x - 6, CFG.GROUND_Y - 38, ob.w + 12, 8);
  }

  function drawBale(ctx, ob) {
    ctx.fillStyle = '#d9a441';
    ellipse(ctx, ob.x + ob.w / 2, CFG.GROUND_Y - 31, ob.w / 2, 31);
    ctx.fill();
    ctx.strokeStyle = '#a67c2e';
    ctx.lineWidth = 3;
    ellipse(ctx, ob.x + ob.w / 2, CFG.GROUND_Y - 31, ob.w / 2 - 8, 22);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ob.x + 10, CFG.GROUND_Y - 56);
    ctx.lineTo(ob.x + 10, CFG.GROUND_Y - 6);
    ctx.moveTo(ob.x + ob.w - 10, CFG.GROUND_Y - 56);
    ctx.lineTo(ob.x + ob.w - 10, CFG.GROUND_Y - 6);
    ctx.stroke();
  }

  function drawPumpkin(ctx, ob) {
    ctx.fillStyle = PAL.pumpkin;
    ellipse(ctx, ob.x + ob.w / 2, CFG.GROUND_Y - 21, 24, 21);
    ctx.fill();
    ctx.strokeStyle = '#c85a10';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ob.x + ob.w / 2 - 10, CFG.GROUND_Y - 38);
    ctx.quadraticCurveTo(ob.x + ob.w / 2, CFG.GROUND_Y - 8, ob.x + ob.w / 2 + 10, CFG.GROUND_Y - 38);
    ctx.stroke();
    ctx.fillStyle = '#5d7f2e';
    ctx.fillRect(ob.x + ob.w / 2 - 2, CFG.GROUND_Y - 48, 4, 8);
    // A carved grin, so it reads as a hazard at a glance.
    ctx.fillStyle = '#3a1c05';
    ellipse(ctx, ob.x + ob.w / 2 - 7, CFG.GROUND_Y - 26, 3, 4);
    ctx.fill();
    ellipse(ctx, ob.x + ob.w / 2 + 7, CFG.GROUND_Y - 26, 3, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ob.x + ob.w / 2 - 10, CFG.GROUND_Y - 14);
    ctx.quadraticCurveTo(ob.x + ob.w / 2, CFG.GROUND_Y - 6, ob.x + ob.w / 2 + 10, CFG.GROUND_Y - 14);
    ctx.stroke();
  }

  function drawBranch(ctx, ob) {
    ctx.fillStyle = '#6b421e';
    rr(ctx, ob.x - 8, CFG.GROUND_Y - 150, ob.w + 16, 20, 8);
    ctx.fill();
    ctx.fillStyle = '#5d7f2e';
    for (var i = 0; i < 5; i++) {
      ellipse(ctx, ob.x + 8 + i * (ob.w / 4), CFG.GROUND_Y - 152, 16, 10);
      ctx.fill();
    }
    // A "DUCK!" hint so the slide reads clearly.
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Trebuchet MS, Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DUCK!', ob.x + ob.w / 2, CFG.GROUND_Y - 164);
  }

  function drawOven(ctx, world, ob) {
    var flick = Math.sin(world.time * 9 + ob.x) * 4;
    ctx.fillStyle = PAL.ovenBrick;
    rr(ctx, ob.x, CFG.GROUND_Y - 112, ob.w, 112, 8);
    ctx.fill();
    ctx.strokeStyle = PAL.ovenDark;
    ctx.lineWidth = 3;
    for (var r = 1; r < 4; r++) {
      ctx.beginPath();
      ctx.moveTo(ob.x + 4, CFG.GROUND_Y - 112 + r * 26);
      ctx.lineTo(ob.x + ob.w - 4, CFG.GROUND_Y - 112 + r * 26);
      ctx.stroke();
    }
    // Chimney with smoke.
    ctx.fillStyle = PAL.ovenDark;
    ctx.fillRect(ob.x + ob.w - 34, CFG.GROUND_Y - 148, 24, 40);
    ctx.fillStyle = 'rgba(220,220,220,0.75)';
    for (var s = 0; s < 3; s++) {
      var sy = CFG.GROUND_Y - 160 - ((world.time * 22 + s * 26 + ob.x) % 78);
      ellipse(ctx, ob.x + ob.w - 22 + Math.sin(world.time * 2 + s) * 6, sy, 10 - s * 2, 8 - s);
      ctx.fill();
    }
    // Arched mouth with fire.
    ctx.fillStyle = '#2b1208';
    ctx.beginPath();
    ctx.moveTo(ob.x + 26, CFG.GROUND_Y);
    ctx.lineTo(ob.x + 26, CFG.GROUND_Y - 52);
    ctx.quadraticCurveTo(ob.x + ob.w / 2, CFG.GROUND_Y - 84, ob.x + ob.w - 26, CFG.GROUND_Y - 52);
    ctx.lineTo(ob.x + ob.w - 26, CFG.GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PAL.fire[0];
    ctx.beginPath();
    ctx.moveTo(ob.x + 34, CFG.GROUND_Y);
    ctx.quadraticCurveTo(ob.x + 44, CFG.GROUND_Y - 46 - flick, ob.x + ob.w / 2, CFG.GROUND_Y - 58 - flick);
    ctx.quadraticCurveTo(ob.x + ob.w - 44, CFG.GROUND_Y - 46 - flick, ob.x + ob.w - 34, CFG.GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PAL.fire[2];
    ellipse(ctx, ob.x + ob.w / 2, CFG.GROUND_Y - 14, 18, 12);
    ctx.fill();
    // Heat shimmer label.
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Trebuchet MS, Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOT!', ob.x + ob.w / 2, CFG.GROUND_Y - 122);
  }

  function drawKnife(ctx, world, ob) {
    var state = TR.World.knifeState(ob, world.time);
    var cx = ob.x + ob.w / 2;
    // Wooden frame.
    ctx.fillStyle = '#6b421e';
    ctx.fillRect(ob.x, CFG.GROUND_Y - 150, 8, 150);
    ctx.fillRect(ob.x + ob.w - 8, CFG.GROUND_Y - 150, 8, 150);
    ctx.fillRect(ob.x - 6, CFG.GROUND_Y - 156, ob.w + 12, 10);
    // The blade: up under the beam, or dropped to the ground.
    var bladeY = state === 'down' ? CFG.GROUND_Y - 118 : CFG.GROUND_Y - 146;
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, CFG.GROUND_Y - 146);
    ctx.lineTo(cx, bladeY + 6);
    ctx.stroke();
    ctx.fillStyle = PAL.knifeBlade;
    ctx.beginPath();
    ctx.moveTo(cx - 26, bladeY);
    ctx.lineTo(cx + 26, bladeY);
    ctx.lineTo(cx + 18, bladeY + 34);
    ctx.lineTo(cx - 18, bladeY + 34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PAL.knifeHandle;
    ctx.fillRect(cx - 26, bladeY - 8, 52, 10);
    if (state === 'warn') {
      // Glint + warning so the drop is readable.
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px Trebuchet MS, Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', cx, CFG.GROUND_Y - 168);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 34, bladeY + 12);
      ctx.lineTo(cx - 20, bladeY + 12);
      ctx.moveTo(cx + 20, bladeY + 12);
      ctx.lineTo(cx + 34, bladeY + 12);
      ctx.stroke();
    }
  }

  function drawCorn(ctx, corn) {
    var y = CFG.GROUND_Y - corn.y;
    ctx.save();
    ctx.translate(corn.x, y + Math.sin(corn.x * 0.05) * 2);
    ctx.rotate(0.5);
    ctx.fillStyle = PAL.corn;
    ellipse(ctx, 0, 0, 9, 14);
    ctx.fill();
    ctx.strokeStyle = '#c89a1e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4, -8);
    ctx.lineTo(-4, 8);
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 10);
    ctx.moveTo(4, -8);
    ctx.lineTo(4, 8);
    ctx.stroke();
    ctx.fillStyle = PAL.cornHusk;
    ctx.beginPath();
    ctx.moveTo(-8, 8);
    ctx.lineTo(-14, 20);
    ctx.lineTo(-4, 14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawFeather(ctx, f) {
    var y = CFG.GROUND_Y - f.y + Math.sin(f.x * 0.04) * 4;
    ctx.save();
    ctx.translate(f.x, y);
    ctx.fillStyle = 'rgba(255,210,62,0.3)';
    ellipse(ctx, 0, 0, 26, 26);
    ctx.fill();
    ctx.fillStyle = '#ffd23e';
    ellipse(ctx, 0, 0, 7, 18);
    ctx.fill();
    ctx.strokeStyle = '#c89a1e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(0, 18);
    ctx.stroke();
    ctx.restore();
  }

  // --- HUD -----------------------------------------------------------------

  function drawHUD(ctx, world) {
    // Top bar.
    ctx.fillStyle = 'rgba(43,18,8,0.55)';
    rr(ctx, 16, 14, 420, 64, 12);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.font = 'bold 26px Trebuchet MS, Verdana, sans-serif';
    ctx.fillText('SCORE ' + Math.floor(world.score), 32, 40);
    ctx.font = '16px Trebuchet MS, Verdana, sans-serif';
    ctx.fillStyle = '#ffd23e';
    ctx.fillText('CORN x' + world.cornCount, 32, 64);
    if (world.turkey.shield) {
      ctx.fillStyle = '#ffd23e';
      ctx.fillText('FEATHER SHIELD', 180, 64);
    }

    // Distance progress: farmyard -> cornfield -> kitchen -> forest gate.
    var barX = 470, barW = 420, barY = 30;
    ctx.fillStyle = 'rgba(43,18,8,0.55)';
    rr(ctx, barX - 10, 14, barW + 20, 64, 12);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    rr(ctx, barX, barY, barW, 14, 7);
    ctx.fill();
    var frac = Math.min(1, world.distance / CFG.GOAL_METRES);
    ctx.fillStyle = '#7fae4c';
    rr(ctx, barX, barY, Math.max(14, barW * frac), 14, 7);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px Trebuchet MS, Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(Math.floor(world.distance) + ' m / ' + CFG.GOAL_METRES + ' m  —  ' + CFG.STAGES[world.stageIndex].name, barX + barW / 2, 66);
    // Goal flag.
    ctx.fillStyle = '#fff';
    ctx.fillRect(barX + barW - 2, barY - 16, 3, 18);
    ctx.fillStyle = '#7fae4c';
    ctx.beginPath();
    ctx.moveTo(barX + barW + 1, barY - 16);
    ctx.lineTo(barX + barW + 19, barY - 11);
    ctx.lineTo(barX + barW + 1, barY - 6);
    ctx.closePath();
    ctx.fill();

    // Lives (hearts).
    ctx.textAlign = 'left';
    for (var i = 0; i < CFG.LIVES; i++) {
      var hx = 960 + i * 44;
      ctx.fillStyle = i < world.lives ? '#e74c3c' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(hx + 16, 56);
      ctx.bezierCurveTo(hx, 38, hx + 6, 26, hx + 16, 34);
      ctx.bezierCurveTo(hx + 26, 26, hx + 32, 38, hx + 16, 56);
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px Trebuchet MS, Verdana, sans-serif';
    ctx.fillText('LIVES', 960, 30);

    // Farmer proximity meter, bottom left.
    ctx.fillStyle = 'rgba(43,18,8,0.55)';
    rr(ctx, 16, CFG.VIEW_H - 58, 300, 42, 10);
    ctx.fill();
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 15px Trebuchet MS, Verdana, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('FARMER', 28, CFG.VIEW_H - 30);
    var gapFrac = 1 - world.farmerGap / CFG.FARMER_MAX_GAP;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    rr(ctx, 108, CFG.VIEW_H - 44, 180, 12, 6);
    ctx.fill();
    ctx.fillStyle = gapFrac > 0.75 ? '#e74c3c' : gapFrac > 0.45 ? '#ff9a2e' : '#ffd23e';
    rr(ctx, 108, CFG.VIEW_H - 44, Math.max(12, 180 * gapFrac), 12, 6);
    ctx.fill();
    if (gapFrac > 0.75) {
      ctx.fillStyle = '#ff5e1f';
      ctx.font = 'bold 18px Trebuchet MS, Verdana, sans-serif';
      ctx.fillText("HE'S CLOSE!", 108, CFG.VIEW_H - 64);
    }
  }

  // --- screens -------------------------------------------------------------

  function panel(ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(43,18,8,0.72)';
    rr(ctx, x, y, w, h, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,210,62,0.8)';
    ctx.lineWidth = 3;
    rr(ctx, x, y, w, h, 18);
    ctx.stroke();
  }

  function drawTitle(ctx, world, best) {
    drawWorldScene(ctx, world);
    panel(ctx, 290, 110, 700, 460);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 76px Trebuchet MS, Verdana, sans-serif';
    ctx.fillText('TURKEY RUN', 640, 200);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px Trebuchet MS, Verdana, sans-serif';
    ctx.fillText('Thanksgiving Escape', 640, 244);
    ctx.font = '20px Trebuchet MS, Verdana, sans-serif';
    ctx.fillStyle = '#ffe6b0';
    ctx.fillText('Thanksgiving morning. The farmer is coming for you.', 640, 292);
    ctx.fillText('Run 1000 m to the forest gate — and live to gobble again.', 640, 320);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Trebuchet MS, Verdana, sans-serif';
    ctx.fillText('SPACE / CLICK — jump      DOWN — slide & brake', 640, 372);
    ctx.fillText('Jump fences, bales and ovens. Slide under branches.', 640, 400);
    ctx.fillText('Brake to time the carving knife. Grab corn. Mind the farmer!', 640, 428);
    if (Math.floor(world.time * 1.6) % 2 === 0) {
      ctx.fillStyle = '#ffd23e';
      ctx.font = 'bold 28px Trebuchet MS, Verdana, sans-serif';
      ctx.fillText('PRESS SPACE OR CLICK TO START', 640, 492);
    }
    ctx.fillStyle = '#ffe6b0';
    ctx.font = '16px Trebuchet MS, Verdana, sans-serif';
    ctx.fillText('P pause    M sound    R restart' + (best > 0 ? '      Best score: ' + best : ''), 640, 556);
  }

  function drawEnd(ctx, world, escaped, best) {
    drawWorldScene(ctx, world);
    panel(ctx, 320, 130, 640, 380);
    ctx.textAlign = 'center';
    if (escaped) {
      ctx.fillStyle = '#7fae4c';
      ctx.font = 'bold 64px Trebuchet MS, Verdana, sans-serif';
      ctx.fillText('ESCAPED!', 640, 210);
      ctx.fillStyle = '#fff';
      ctx.font = '22px Trebuchet MS, Verdana, sans-serif';
      ctx.fillText('You reached the forest gate. The farmer can', 640, 258);
      ctx.fillText('keep his Thanksgiving dinner — not today!', 640, 288);
    } else {
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 64px Trebuchet MS, Verdana, sans-serif';
      ctx.fillText('CAUGHT!', 640, 210);
      ctx.fillStyle = '#fff';
      ctx.font = '22px Trebuchet MS, Verdana, sans-serif';
      ctx.fillText('The farmer got you. Thanksgiving dinner it is...', 640, 258);
      ctx.fillText('Next time, mind the oven and the knife.', 640, 288);
    }
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 26px Trebuchet MS, Verdana, sans-serif';
    ctx.fillText('Score ' + Math.floor(world.score) + '   •   ' + Math.floor(world.distance) + ' m   •   Corn x' + world.cornCount, 640, 350);
    ctx.fillStyle = '#ffe6b0';
    ctx.font = '20px Trebuchet MS, Verdana, sans-serif';
    ctx.fillText('Best score: ' + Math.max(best, Math.floor(world.score)), 640, 388);
    if (Math.floor(world.time * 1.6) % 2 === 0) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 26px Trebuchet MS, Verdana, sans-serif';
      ctx.fillText('PRESS R OR CLICK TO RUN AGAIN', 640, 452);
    }
  }

  function drawPaused(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, CFG.VIEW_W, CFG.VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 56px Trebuchet MS, Verdana, sans-serif';
    ctx.fillText('PAUSED', 640, 350);
    ctx.font = '20px Trebuchet MS, Verdana, sans-serif';
    ctx.fillText('Press P to keep running', 640, 392);
  }

  // --- the whole scene -----------------------------------------------------

  function drawWorldScene(ctx, world) {
    drawSky(ctx, world);
    drawDecor(ctx, world);
    drawGround(ctx, world);
    var i;
    for (i = 0; i < world.corns.length; i++) {
      if (!world.corns[i].taken) drawCorn(ctx, world.corns[i]);
    }
    for (i = 0; i < world.feathers.length; i++) {
      if (!world.feathers[i].taken) drawFeather(ctx, world.feathers[i]);
    }
    for (i = 0; i < world.obstacles.length; i++) {
      var ob = world.obstacles[i];
      if (ob.kind === 'fence') drawFence(ctx, ob);
      else if (ob.kind === 'bale') drawBale(ctx, ob);
      else if (ob.kind === 'pumpkin') drawPumpkin(ctx, ob);
      else if (ob.kind === 'branch') drawBranch(ctx, ob);
      else if (ob.kind === 'oven') drawOven(ctx, world, ob);
      else if (ob.kind === 'knife') drawKnife(ctx, world, ob);
    }
    // The farmer, behind the turkey by his gap (or peeking in when close).
    var farmerX = CFG.TURKEY_X - world.farmerGap;
    if (farmerX > -40) {
      drawFarmer(ctx, world, farmerX, world.time * 11);
    } else if (world.farmerGap < CFG.FARMER_MAX_GAP - 20) {
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 30px Trebuchet MS, Verdana, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('!', 18, CFG.GROUND_Y - 120);
    }
    // The turkey.
    var t = world.turkey;
    var phase = world.time * 11;
    drawTurkey(ctx, world, CFG.TURKEY_X, CFG.GROUND_Y - t.y, phase, t.sliding, !t.onGround, t.blink > 0);
  }

  // ui: {screen, best, muted}
  function draw(ctx, world, ui) {
    ctx.clearRect(0, 0, CFG.VIEW_W, CFG.VIEW_H);
    if (ui.screen === 'title') {
      drawTitle(ctx, world, ui.best);
    } else if (ui.screen === 'caught' || ui.screen === 'escaped') {
      drawEnd(ctx, world, ui.screen === 'escaped', ui.best);
    } else {
      drawWorldScene(ctx, world);
      drawHUD(ctx, world);
      if (ui.screen === 'paused') drawPaused(ctx);
    }
    if (ui.muted) {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = 'bold 15px Trebuchet MS, Verdana, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('MUTED (M)', CFG.VIEW_W - 16, CFG.VIEW_H - 16);
    }
  }

  TR.Render = {
    draw: draw,
    drawWorldScene: drawWorldScene,
  };
})();
