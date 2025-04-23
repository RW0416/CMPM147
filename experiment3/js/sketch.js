/* global placeTile */

// Immediately-Invoked Module Expression to avoid polluting global scope
(() => {
  /* --------------------------- Ice World --------------------------- */
  const iceWorld = (() => {
    function generateGrid(numCols, numRows) {
      const grid = [];
      for (let i = 0; i < numRows; i++) {
        const row = [];
        for (let j = 0; j < numCols; j++) {
          const outerValue = noise(i / 60, j / 60);
          if (abs(outerValue - 0.5) < 0.04) {
            row.push("w");               // water
          } else {
            const innerValue = noise(i / 30, j / 30);
            if (innerValue > 0.5) {
              row.push(":");             // ice
            } else {
              row.push(random() < 0.10 ? "t" : "."); // snow or tree
            }
          }
        }
        grid.push(row);
      }
      return grid;
    }

    function gridCheck(grid, i, j, target) {
      if (i < 0 || i >= grid.length || j < 0 || j >= grid[i].length) return false;
      const cell = grid[i][j];
      if (target === "." && cell === "t") return true;
      return cell === target;
    }

    function gridCode(grid, i, j, target) {
      return (
        (gridCheck(grid, i - 1, j, target) << 0) +
        (gridCheck(grid, i, j - 1, target) << 1) +
        (gridCheck(grid, i, j + 1, target) << 2) +
        (gridCheck(grid, i + 1, j, target) << 3)
      );
    }

    const lookup = [
      [1, 1], [1, 0], [0, 1], [0, 0],
      [2, 1], [2, 0], [1, 1], [1, 0],
      [1, 2], [1, 1], [0, 2], [0, 1],
      [2, 2], [2, 1], [1, 2], [1, 1]
    ];

    function drawContext(grid, i, j, target, dti, dtj, invert = false) {
      let code = gridCode(grid, i, j, target);
      if (invert) code = ~code & 0xF;
      const [ti, tj] = lookup[code];
      placeTile(i, j, dti + ti, dtj + tj);
    }

    function drawGrid(grid) {
      const t = millis() / 1500.0;
      noStroke();

      for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
          // shimmering background
          placeTile(i, j, (4 * pow(noise(t / 10, i, j / 4 + t), 2)) | 0, 14);

          if (gridCheck(grid, i, j, ":")) {
            placeTile(i, j, 20, 12);           // ice
          } else {
            drawContext(grid, i, j, "w", 21, 12, true);
          }

          if (gridCheck(grid, i, j, ".")) {
            placeTile(i, j, 0, 12);            // snow
          } else {
            drawContext(grid, i, j, ".", 9, 12);
          }

          if (grid[i][j] === "t") {
            placeTile(i, j, 14, 12);
          }
        }
      }
    }

    return { generateGrid, drawGrid };
  })();

  /* --------------------------- Dungeon ----------------------------- */
  const dungeonWorld = (() => {
    function markDoor(g, x, y) { if (g[y] && g[y][x] === ".") g[y][x] = "+"; }

    function carveHCorridor(g, xStart, xEnd, y) {
      const dir = xStart < xEnd ? 1 : -1;
      let first = null, last = null;
      for (let x = xStart; x !== xEnd + dir; x += dir) {
        if (g[y][x] === "_") {
          g[y][x] = "#";
          if (first === null) first = x;
          last = x;
        }
      }
      if (first !== null) markDoor(g, first - dir, y);
      if (last  !== null) markDoor(g, last  + dir, y);
    }

    function carveVCorridor(g, yStart, yEnd, x) {
      const dir = yStart < yEnd ? 1 : -1;
      let first = null, last = null;
      for (let y = yStart; y !== yEnd + dir; y += dir) {
        if (g[y][x] === "_") {
          g[y][x] = "#";
          if (first === null) first = y;
          last = y;
        }
      }
      if (first !== null) markDoor(g, x, first - dir);
      if (last  !== null) markDoor(g, x, last  + dir);
    }

    function generateGrid(numCols, numRows) {
      const g = Array.from({ length: numRows }, () => Array(numCols).fill("_"));
      const rooms = [];
      const wanted = floor(random(4, 7));
      const tries = 50;

      for (let t = 0; t < tries && rooms.length < wanted; t++) {
        const w = floor(random(6, 11));
        const h = floor(random(4, 9));
        const x0 = floor(random(1, numCols - w - 1));
        const y0 = floor(random(1, numRows - h - 1));

        let overlap = false;
        for (const r of rooms) {
          if (x0 - 1 < r.x1 + 1 && x0 + w + 1 > r.x0 - 1 &&
              y0 - 1 < r.y1 + 1 && y0 + h + 1 > r.y0 - 1) { overlap = true; break; }
        }
        if (overlap) continue;

        for (let y = y0; y < y0 + h; y++)
          for (let x = x0; x < x0 + w; x++)
            g[y][x] = ".";

        for (let c = 0; c < floor(random(1, 3)); c++) {
          const cx = floor(random(x0 + 1, x0 + w - 1));
          const cy = floor(random(y0 + 1, y0 + h - 1));
          if (g[cy][cx] === ".") g[cy][cx] = "C";
        }

        rooms.push({ x0, y0, x1: x0 + w - 1, y1: y0 + h - 1,
                     cx: floor(x0 + w / 2), cy: floor(y0 + h / 2) });
      }

      for (let i = 1; i < rooms.length; i++) {
        const a = rooms[i - 1], b = rooms[i];
        if (random() < 0.5) {
          carveHCorridor(g, a.cx, b.cx, a.cy);
          carveVCorridor(g, a.cy, b.cy, b.cx);
        } else {
          carveVCorridor(g, a.cy, b.cy, a.cx);
          carveHCorridor(g, a.cx, b.cx, b.cy);
        }
      }

      return g;
    }

    const T = {
      FLOOR:[0,22], N:[1,21], S:[1,21], E:[1,21], W:[1,21],
      NE:[8,24], NW:[8,24], SE:[8,24], SW:[8,24],
      BG:[0,11], HALL:[0,22], DOOR:[5,25], CHEST:[0,29]
    };
    function isGround(ch){return ch==="."||ch==="#"||ch==="+"||ch==="C";}
    function gridCode(g,i,j){
      const n=i>0&&isGround(g[i-1][j]), s=i<g.length-1&&isGround(g[i+1][j]);
      const e=j<g[i].length-1&&isGround(g[i][j+1]), w=j>0&&isGround(g[i][j-1]);
      return n + (s<<1) + (e<<2) + (w<<3);
    }
    const LOOK = {
      ".":[
        T.FLOOR,T.S,T.N,T.N,T.W,T.SW,T.NW,T.W,
        T.E,T.SE,T.NE,T.E,T.S,T.S,T.N,T.FLOOR
      ],
      "_":{default:T.BG}
    };

    function drawGrid(g) {
      background(0);
      for (let i = 0; i < g.length; i++) {
        for (let j = 0; j < g[i].length; j++) {
          const ch = g[i][j];
          let ti,tj;
          if (ch === ".")      [ti,tj] = LOOK["."][gridCode(g,i,j)];
          else if (ch === "#") [ti,tj] = T.HALL;
          else if (ch === "+") [ti,tj] = T.DOOR;
          else if (ch === "C") [ti,tj] = T.CHEST;
          else                 [ti,tj] = T.BG;
          placeTile(i,j,ti,tj);
        }
      }
    }

    return { generateGrid, drawGrid };
  })();

  /* -------------------- Glue -------------------- */
  window.currentProject = "Ice World";

  const projects = { "Ice World": iceWorld, "Dungeon": dungeonWorld };

  window.generateGrid = (c, r) => projects[window.currentProject].generateGrid(c, r);
  window.drawGrid     = g      => projects[window.currentProject].drawGrid(g);

})();
