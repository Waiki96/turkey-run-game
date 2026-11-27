// Turkey Run: Thanksgiving Escape — configuration and tuning.
// One file, one job: every number that shapes the game lives here,
// so the feel can be tuned without touching the logic or the art.

(function () {
  'use strict';

  var TR = (window.TR = window.TR || {});

  TR.CFG = {
    // Canvas (internal resolution; CSS scales it to fit the window).
    VIEW_W: 1280,
    VIEW_H: 720,
    GROUND_Y: 600, // y of the ground line
    HORIZON_Y: 470, // where the far scenery sits

    // The turkey's fixed screen position; the world scrolls past it.
    TURKEY_X: 300,

    // Physics.
    GRAVITY: 2600, // px / s^2 (pulls the turkey back down)
    JUMP_VELOCITY: 1150, // px / s upward (t.y is height above ground)
    SLIDE_TIME: 0.55, // seconds a slide lasts
    BRAKE_DECEL: 900, // px / s^2 while holding brake (down key)

    // Speed: px/s of world scroll. 1 metre = 40 px of travel.
    BASE_SPEED: 430,
    SPEED_PER_METRE: 0.16, // extra px/s per metre travelled
    MAX_SPEED: 800,
    PX_PER_METRE: 40,

    // The goal: reach the forest gate at 1000 m and escape.
    GOAL_METRES: 1000,

    // Stages change the palette, the hazards and the pace.
    STAGES: [
      { name: 'FARMYARD', from: 0, sky: ['#ffd9a0', '#ffb36b'], hill: '#e08a3c', ground: '#b5772f' },
      { name: 'CORNFIELD', from: 300, sky: ['#ffe6b0', '#ffc46b'], hill: '#d98f2e', ground: '#a86f24' },
      { name: 'KITCHEN YARD', from: 650, sky: ['#ffcf9a', '#ff9e57'], hill: '#c97a33', ground: '#96601f' },
    ],

    // The farmer: how far behind the turkey he starts (px), how fast he
    // closes in when the turkey stumbles or brakes, and how fast the
    // turkey pulls away while running clean.
    FARMER_START_GAP: 150,
    FARMER_GAIN_ON_HIT: 70, // px he gains when the turkey is hit
    FARMER_GAIN_ON_BRAKE: 55, // px/s he gains while the turkey brakes
    FARMER_GAIN_ON_SLIDE: 12, // px/s he gains while the turkey slides
    FARMER_FALL_BEHIND: 26, // px/s he loses while the turkey runs clean
    FARMER_MAX_GAP: 320, // he never falls further back than this
    FARMER_CATCH_GAP: 26, // gap at or below this: caught

    // Lives and scoring.
    LIVES: 3,
    CORN_SCORE: 25,
    METRE_SCORE: 10,
    STAGE_BONUS: 250,
    INVINCIBLE_AFTER_HIT: 1.2, // seconds of no further hits

    // Obstacle spacing: the world generator keeps gaps inside this range
    // (px), scaled by speed so a jump is always possible.
    GAP_MIN: 420,
    GAP_MAX: 680,

    // The carving-knife trap: it slashes down on a cycle.
    KNIFE_PERIOD: 1.9, // seconds per slash cycle
    KNIFE_DOWN_TIME: 0.55, // seconds the blade stays down
    KNIFE_WARN_TIME: 0.35, // seconds the glint warns before it drops
  };

  // Autumn palette shared by the renderer.
  TR.PALETTE = {
    turkeyBody: '#8a5a2b',
    turkeyDark: '#6b421e',
    turkeyLight: '#c98d4b',
    turkeyHead: '#d97b6c',
    wattle: '#c0392b',
    beak: '#e8a33d',
    featherFan: ['#a0662c', '#c98d4b', '#7a4a1f', '#e0aa5e'],
    farmerShirt: '#4a6fa5',
    farmerOveralls: '#3b5a7a',
    farmerHat: '#8a6d3b',
    farmerSkin: '#e8b98a',
    ovenBrick: '#9c4a2f',
    ovenDark: '#6e2f1d',
    fire: ['#ffd23e', '#ff9a2e', '#ff5e1f'],
    knifeBlade: '#dfe6ea',
    knifeHandle: '#5b3a1e',
    corn: '#ffd23e',
    cornHusk: '#7fae4c',
    pumpkin: '#e67e22',
    fence: '#7a5230',
    leaf: ['#d35400', '#e67e22', '#f1c40f', '#c0392b'],
  };
})();
