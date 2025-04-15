/* exported setup, draw */

let seed = 239;
let clouds = [];
let canvasContainer;

function resizeScreen() {
  canvasContainer = $("#canvas-container");
  resizeCanvas(canvasContainer.width(), canvasContainer.height());
}

function setup() {
  canvasContainer = $("#canvas-container");
  let canvas = createCanvas(canvasContainer.width(), canvasContainer.height());
  canvas.parent("canvas-container");

  let btn = createButton("reimagine");
  btn.parent("canvas-container");
  btn.mousePressed(() => seed++);

  $(window).resize(() => resizeScreen());
  resizeScreen();

  let nClouds = 19;
  for (let i = 0; i < nClouds; i++) {
    let size = random(50, 100);
    let cloudWidth = size * 5;
    let initialX = random(-cloudWidth, width);
    let y = random(20, 500);
    let speed = random(50, 150);
    clouds.push({ initialX, y, size, speed });
  }
}

function draw() {
  randomSeed(seed);
  drawSky();
  drawClouds();
  drawMountain();
  drawMountain2();
  drawAllTrees();
}

function drawSky() {
  for (let y = 0; y < height; y++) {
    let t = map(y, 0, height, 0, 1);
    stroke(lerpColor(color(200, 80, 0), color(40, 10, 50), t));
    line(0, y, width, y);
  }
}

function drawClouds() {
  let elapsed = millis() / 1000;
  noStroke();
  fill(255, 100);
  for (let cloud of clouds) {
    let cloudWidth = cloud.size * 7;
    let x = ((cloud.initialX + cloud.speed * elapsed + cloudWidth) % (width + 2 * cloudWidth)) - cloudWidth - 50;
    ellipse(x, cloud.y, cloudWidth, cloud.size * 0.3);
  }
}

function drawMountain() {
  fill(0, 100);
  beginShape();
  vertex(0, height);
  for (let x = 0; x <= width; x += 20) {
    vertex(x, height - noise(x * 0.01 + seed) * 80 - 10);
  }
  vertex(width, height);
  endShape(CLOSE);
}

function drawMountain2() {
  fill(0);
  beginShape();
  vertex(0, height);
  for (let x = 0; x <= width; x += 20) {
    vertex(x, height - noise(x * 0.002 + seed + 20) * 50);
  }
  vertex(width, height);
  endShape(CLOSE);
}

function drawAllTrees() {
  for (let i = 0; i < 20; i++) {
    drawTree(random(30, width - 30), height - 20, random(0.9, 1.2));
  }
}

function drawTree(x, y, scaleFactor) {
  fill(0);
  noStroke();
  let h = 60 * scaleFactor;
  let w = 40 * scaleFactor;
  for (let i = 0; i < 3; i++) {
    let tierH = h * 0.3;
    let tierW = w - i * 10;
    let offsetY = i * (tierH * 0.8);
    triangle(
      x, y - offsetY - tierH,
      x - tierW / 2, y - offsetY,
      x + tierW / 2, y - offsetY
    );
  }
  let trunkW = 6 * scaleFactor;
  let trunkH = 10 * scaleFactor;
  rect(x - trunkW / 2, y, trunkW, trunkH);
}

function mousePressed() {}
