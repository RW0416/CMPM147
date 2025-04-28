/*  sketch.js  — combines three separate “world” demos into a single file.*/
(() => {
  "use strict";

  //switching logic

  let current = 0;

  function applyWorld(mod) {
    const names = [
      "tileWidth", "tileHeight",
      "preload", "setup", "worldKeyChanged",
      "tileClicked", "drawBefore", "drawAfter",
      "drawTile", "drawSelectedTile"
    ];
    names.forEach(n => (window["p3_" + n] = mod[n] || undefined));
  }

  window.setWorld = idx => {
    idx = +idx || 0;
    if (idx === current) return;
    current = idx;
    applyWorld(worlds[current]);

    if (typeof window.rebuildWorld === "function") {
      const keyInput = document.querySelector("#toolbar input[type=text]");
      window.rebuildWorld(keyInput ? keyInput.value : "xyzzy");
    }
  };


//worlds
  const worlds = [
    //1. Overworld
    (() => {
      //constants & state
      const waterT = 0.5,
        landT = 0.6,
        noiseScale = 0.07;
      const sandColor = [240, 220, 140],
        landRoof = [80, 185, 100],
        wallLeft = [60, 150, 90],
        wallRight = [45, 115, 70],
        waterBase = [30, 120, 200],
        maxH = 50;
      const tw = 32,
        th = 16;
      let worldSeed,
        trees = {};

      function tileWidth() {
        return tw;
      }
      function tileHeight() {
        return th;
      }

      function preload() {}
      function setup() {}

      function worldKeyChanged(key) {
        worldSeed = XXH.h32(key, 0);
        noiseSeed(worldSeed);
        randomSeed(worldSeed);
        trees = {};
      }

      function tileClicked(i, j) {
        const k = `${i},${j}`;
        trees[k] = trees[k] === undefined ? floor(random(3)) : undefined;
      }

      function drawBefore() {}
      function drawAfter() {}

      function drawTile(i, j) {
        const h = noise(i * noiseScale, j * noiseScale);
        let type = "water";
        if (h >= landT) type = "land";
        else if (h >= waterT) type = "sand";

        push();

        let elev = 0;
        if (type === "land") {
          elev = map(h, landT, 1, 0, maxH);
          translate(0, -elev);
        }

        //roof
        let col;
        if (type === "water") {
          const t = 0.05 * sin(millis() / 1000 + (i + j));
          col = waterBase.map(c => c + 10 * t);
        } else if (type === "sand") col = sandColor;
        else col = landRoof;

        fill(...col);
        noStroke();
        quad(-tw, 0, 0, th, tw, 0, 0, -th);

        //side walls
        if (type === "land") {
          fill(...wallLeft);
          beginShape();
          vertex(-tw, 0);
          vertex(0, th);
          vertex(0, th + elev);
          vertex(-tw, elev);
          endShape(CLOSE);

          fill(...wallRight);
          beginShape();
          vertex(0, th);
          vertex(tw, 0);
          vertex(tw, elev);
          vertex(0, th + elev);
          endShape(CLOSE);
        }

        //trees
        const tk = trees[`${i},${j}`];
        if (type === "land" && tk !== undefined) {
          ({ 0: drawPine, 1: drawTree, 2: drawBush }[tk])();
        }
        pop();
      }

      function drawSelectedTile() {
        noFill();
        stroke(255, 0, 0, 130);
        quad(-tw, 0, 0, th, tw, 0, 0, -th);
      }

      //trees function
      function drawPine() {
        fill(70, 40, 20);
        rect(-1, -8, 2, 8);
        fill(20, 140, 40);
        triangle(-6, -4, 0, -14, 6, -4);
        triangle(-5, -1, 0, -9, 5, -1);
      }
      function drawTree() {
        fill(70, 40, 20);
        rect(-1, -8, 2, 8);
        fill(30, 150, 60);
        ellipse(0, -10, 10, 15);
      }
      function drawBush() {
        noStroke();
        fill(25, 120, 45);
        ellipse(0, -3, 10, 6);
        ellipse(-4, -2, 6, 4);
        ellipse(4, -2, 6, 4);
      }

      return {
        tileWidth,
        tileHeight,
        preload,
        setup,
        worldKeyChanged,
        tileClicked,
        drawBefore,
        drawAfter,
        drawTile,
        drawSelectedTile
      };
    })(),

    //2. Galaxy
    (() => {
      const galScale = 0.04,
        driftSpd = 0.00003,
        starBase = 0.08,
        starBoost = 0.75,
        minMag = 140,
        maxMag = 255;
      const tw = 32,
        th = 16;
      let worldSeed,
        bhRadius = 4,
        blackHoles = {};

      function tileWidth() {
        return tw;
      }
      function tileHeight() {
        return th;
      }

      function preload() {}
      function setup() {}

      function worldKeyChanged(key) {
        worldSeed = XXH.h32(key, 0);
        noiseSeed(worldSeed);
        randomSeed(worldSeed);
        blackHoles = {};
        bhRadius = 3 + (XXH.h32("radius", worldSeed) % 4); // 3–6
      }

      function tileClicked(i, j) {
        const k = `${i},${j}`;
        blackHoles[k] ? delete blackHoles[k] : (blackHoles[k] = true);
      }

      function drawBefore() {}
      function drawAfter() {}

      function drawTile(i, j) {
        const tOff = millis() * driftSpd;
        const g = noise(i * galScale + tOff, j * galScale - tOff);
        fill(5 + g * 25, 10 + g * 40, 25 + g * 80);
        noStroke();
        quad(-tw, 0, 0, th, tw, 0, 0, -th);

        const k = `${i},${j}`;
        if (blackHoles[k]) {
          //black-hole body
          fill(0);
          ellipse(0, 0, tw * 1.1, th * 1.1);
          noFill();
          stroke(30, 80, 160, 150);
          strokeWeight(1.5);
          ellipse(0, 0, tw * 1.4, th * 1.4);
          return;
        }

        //cull stars inside any black-hole influence radius
        for (const key in blackHoles) {
          const [bx, by] = key.split(",").map(Number);
          const dx = i - bx,
            dy = j - by;
          if (dx * dx + dy * dy <= bhRadius * bhRadius) return;
        }

        //random stars
        const h = XXH.h32(`s:${i},${j}`, worldSeed);
        const prob = starBase + g * starBoost;
        if ((h >>> 8) / 0xffffff < prob) {
          //random offset inside tile (±70 % of tile size)
          const dxSeed = (h >>> 16) & 0xff,
            dySeed = (h >>> 24) & 0xff;
          const dx = map(dxSeed, 0, 255, -tw * 0.7, tw * 0.7);
          const dy = map(dySeed, 0, 255, -th * 0.7, th * 0.7);

          const phase = ((h & 0xff) / 255) * TWO_PI;
          const flick = 0.5 + 0.5 * sin(millis() * 0.002 + phase);
          const bright = floor(
            minMag + (maxMag - minMag) * (g * 0.5 + flick * 0.5)
          );
          const hue = g * 60,
            rad = (h & 3) ? 2 : 3;

          push();
          translate(dx, dy);
          fill(bright, bright - hue * 0.4, bright - hue);
          ellipse(0, 0, rad, rad);
          pop();
        }
      }

      function drawSelectedTile(i, j) {
        noFill();
        stroke(0, 255, 0, 120);
        beginShape();
        vertex(-tw, 0);
        vertex(0, th);
        vertex(tw, 0);
        vertex(0, -th);
        endShape(CLOSE);
        noStroke();
        fill(255, 0, 0);
        text(`(${i},${j})`, 0, 4);
      }

      return {
        tileWidth,
        tileHeight,
        preload,
        setup,
        worldKeyChanged,
        tileClicked,
        drawBefore,
        drawAfter,
        drawTile,
        drawSelectedTile
      };
    })(),

    //3. Stripes
    (() => {
      const tw = 32,
        th = 16;
      let strips = [],
        overrides = {},
        startTime;

      function tileWidth() {
        return tw;
      }
      function tileHeight() {
        return th;
      }

      function preload() {}

      function setup() {
        worldKeyChanged("default");
      }

      function worldKeyChanged(key) {
        const seed = XXH.h32(key, 0);
        randomSeed(seed);
        noiseSeed(seed);
        strips = [];
        overrides = {};
        startTime = millis();
        strips.push({ baseY: 0, whiteIdx: floor(random(5)) });
      }

      function tileClicked(i, j) {
        if (j > 0 || i < 0 || i >= 5) return;
        const strip = strips.find(s => s.baseY === j);
        if (!strip) return;
        const k = `${i},${j}`;
        overrides[k] = !(overrides[k] ?? (i === strip.whiteIdx));
      }

      //add a new strip every second
      function drawBefore() {
        const secs = floor((millis() - startTime) / 1000);
        while (strips.length < secs + 1) {
          const n = strips.length;
          strips.push({ baseY: -n, whiteIdx: floor(random(5)) });
        }
      }
      function drawAfter() {}

      function drawTile(i, j) {
        const strip = strips.find(s => s.baseY === j);
        if (!strip) return;
        if (i < 0 || i >= 5) return;
        const k = `${i},${j}`;
        const isWhite = k in overrides ? overrides[k] : i === strip.whiteIdx;
        fill(isWhite ? 255 : 0);
        noStroke();
        quad(-tw, 0, 0, th, tw, 0, 0, -th);
      }

      function drawSelectedTile(i, j) {
        noFill();
        stroke(0, 255, 0, 120);
        beginShape();
        vertex(-tw, 0);
        vertex(0, th);
        vertex(tw, 0);
        vertex(0, -th);
        endShape(CLOSE);
      }

      return {
        tileWidth,
        tileHeight,
        preload,
        setup,
        worldKeyChanged,
        tileClicked,
        drawBefore,
        drawAfter,
        drawTile,
        drawSelectedTile
      };
    })()
  ];

  //bootstrap

  applyWorld(worlds[0]);

  document.addEventListener("DOMContentLoaded", () => {
    const sel = document.getElementById("worldSelect");
    if (!sel) return;
    sel.addEventListener("change", e => window.setWorld(e.target.value));

    window.setWorld(sel.value);
  });
})();
