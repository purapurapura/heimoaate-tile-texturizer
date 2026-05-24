let img;
let processed;

const totalShapes = 13;

let tiles = [];
let shapeColors = [];

let rectS = 15;
let threshold = 150;
let hueValue = 0;
let factor = 2;

let selectedColor;

let needsUpdate = true;
let isRecording = false;

// UI
let sizeSlider;
let thresholdSlider;
let hueSlider;
let ditherSlider;
let negativeButton;

const baseNames = [
  "komi",
  "nenets",
  "inkeri",
  "mari",
  "erzya_moksha",
  "udmurt",
  "magyar",
  "suomi",
  "eesti",
  "lappi",
  "khanty_mansi",
  "selkup",
  "nganasan"
];



// ----------------------------------------------------
// PRELOAD
// ----------------------------------------------------

function preload() {

  img = loadImage("data/zebra3.png");

  for (let i = 0; i < totalShapes; i++) {

    tiles[i] = [];

    for (let t = 0; t < 16; t++) {

      tiles[i][t] = loadImage(
        `data/${baseNames[i]}_${t}.png`
      );
    }
  }
}



// ----------------------------------------------------
// SETUP
// ----------------------------------------------------

function setup() {

  createCanvas(1080, 1350);

  pixelDensity(1);

  noSmooth();

  frameRate(30);

  processed = createGraphics(width, height);

  processed.noSmooth();

  img.resize(width, height);

  // LOAD PIXELS ONLY ONCE
  img.loadPixels();

  calculateShapeColors();

  selectedColor = color(255);

  createUI();

  rebuildImage();
}



// ----------------------------------------------------
// UI
// ----------------------------------------------------

function createUI() {

  sizeSlider = createSlider(10, 50, 15, 1);
  sizeSlider.position(20, 20);
  sizeSlider.input(uiChanged);

  hueSlider = createSlider(0, 255, 0, 1);
  hueSlider.position(20, 50);
  hueSlider.input(uiChanged);

  thresholdSlider = createSlider(0, 255, 150, 1);
  thresholdSlider.position(20, 80);
  thresholdSlider.input(uiChanged);

  ditherSlider = createSlider(1, 5, 2, 1);
  ditherSlider.position(20, 110);
  ditherSlider.input(uiChanged);

  negativeButton = createButton("NEGATIVE");

  negativeButton.position(20, 145);

  negativeButton.mousePressed(() => {

    img.filter(INVERT);

    img.loadPixels();

    needsUpdate = true;
  });
}



function uiChanged() {

  rectS = max(10, int(sizeSlider.value()));

  hueValue = int(hueSlider.value());

  threshold = int(thresholdSlider.value());

  factor = max(1, int(ditherSlider.value()));

  needsUpdate = true;
}



// ----------------------------------------------------
// DRAW
// ----------------------------------------------------

function draw() {

  background(0);

  if (needsUpdate) {

    rebuildImage();

    needsUpdate = false;
  }

  image(processed, 0, 0);

  drawLabels();

  if (isRecording) {

    fill(255, 0, 0);

    noStroke();

    ellipse(width - 20, 20, 12, 12);
  }
}



// ----------------------------------------------------
// LABELS
// ----------------------------------------------------

function drawLabels() {

  fill(255);

  noStroke();

  textSize(12);

  text("SIZE", 170, 35);

  text("HUE", 170, 65);

  text("THRESHOLD", 170, 95);

  text("DITHER", 170, 125);
}



// ----------------------------------------------------
// MAIN RENDER
// ----------------------------------------------------

function rebuildImage() {

  processed.clear();

  processed.imageMode(CENTER);

  let sr = red(selectedColor);
  let sg = green(selectedColor);
  let sb = blue(selectedColor);

  for (let gx = 0; gx < width; gx += rectS) {

    for (let gy = 0; gy < height; gy += rectS) {

      let px = floor(gx + rectS * 0.5);

      let py = floor(gy + rectS * 0.5);

      // SAFE BOUNDS
      px = constrain(px, 0, width - 1);
      py = constrain(py, 0, height - 1);

      let idx = 4 * (px + py * width);

      let r = img.pixels[idx];
      let g = img.pixels[idx + 1];
      let b = img.pixels[idx + 2];

      // SAFETY
      if (
        r === undefined ||
        g === undefined ||
        b === undefined
      ) continue;

      let rr, gg, bb;

      // DISTANCE TO PICKED COLOR
      let d = dist(r, g, b, sr, sg, sb);

      if (d < threshold) {

        // FAST RGB SHIFT
        rr = constrain(r + hueValue, 0, 255);
        gg = g;
        bb = b;

      } else {

        // BACKGROUND AREA
        rr = r * 0.15;
        gg = g * 0.15;
        bb = b * 0.15;
      }

      // DITHER
      rr = quantize(rr, factor);
      gg = quantize(gg, factor);
      bb = quantize(bb, factor);

      // MATCH TILE
      let sIdx = findBestMatch(rr, gg, bb);

      let tIdx =
        (floor(gx / rectS) % 4) +
        (floor(gy / rectS) % 4) * 4;

      processed.image(
        tiles[sIdx][tIdx],
        gx + rectS * 0.5,
        gy + rectS * 0.5,
        rectS,
        rectS
      );
    }
  }

  processed.imageMode(CORNER);
}



// ----------------------------------------------------
// HELPERS
// ----------------------------------------------------

function quantize(v, f) {

  return round(f * v / 255) * (255 / f);
}



function calculateShapeColors() {

  for (let i = 0; i < totalShapes; i++) {

    let tile = tiles[i][0];

    tile.loadPixels();

    let r = 0;
    let g = 0;
    let b = 0;

    let count = tile.pixels.length / 4;

    for (let p = 0; p < tile.pixels.length; p += 4) {

      r += tile.pixels[p];
      g += tile.pixels[p + 1];
      b += tile.pixels[p + 2];
    }

    shapeColors[i] = color(
      r / count,
      g / count,
      b / count
    );
  }
}



function findBestMatch(r, g, b) {

  let best = 0;

  let minDist = Infinity;

  for (let i = 0; i < totalShapes; i++) {

    let c = shapeColors[i];

    let d = dist(
      r,
      g,
      b,
      red(c),
      green(c),
      blue(c)
    );

    if (d < minDist) {

      minDist = d;

      best = i;
    }
  }

  return best;
}



// ----------------------------------------------------
// INTERACTION
// ----------------------------------------------------

function mousePressed() {

  if (
    mouseX >= 0 &&
    mouseX < width &&
    mouseY >= 0 &&
    mouseY < height
  ) {

    selectedColor = img.get(mouseX, mouseY);

    needsUpdate = true;
  }
}



function keyPressed() {

  if (key === 'r' || key === 'R') {

    isRecording = !isRecording;

    if (isRecording) {

      console.log("RECORDING STARTED");

    } else {

      console.log("RECORDING STOPPED");
    }
  }
}