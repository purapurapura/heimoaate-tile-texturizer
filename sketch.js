// noprotect

// ----------------------------------------------------
// MAIN
// ----------------------------------------------------

let img;
let workingImg;
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

// ----------------------------------------------------
// EXPORT
// ----------------------------------------------------

let exportScale = 2;

// ----------------------------------------------------
// DISPLAY
// ----------------------------------------------------

const MAX_WORKING_SIZE = 1024;
const MAX_DISPLAY_HEIGHT = 900;

let canvasDisplayWidth = 100;
let canvasDisplayHeight = 100;

let displayOffsetX = 0;
let displayOffsetY = 0;

// ----------------------------------------------------
// UI
// ----------------------------------------------------

let panelContainer;

let sizeSlider;
let thresholdSlider;
let hueSlider;
let ditherSlider;
let exportSlider;

let negativeButton;
let saveButton;
let uploadInput;
let menuImages;

const defaultImages = [
  "zebra.png",
  "mask.png",
  "hugo.jpg",
  "manypupuner.jpg",
  "me.jpeg"
];

// ----------------------------------------------------
// DATA
// ----------------------------------------------------

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

  img = loadImage("./data/zebra.png");

  for (let i = 0; i < totalShapes; i++) {

    tiles[i] = [];

    for (let t = 0; t < 16; t++) {

      tiles[i][t] =
        loadImage(
          `./data/${baseNames[i]}_${t}.png`
        );
    }
  }
}



// ----------------------------------------------------
// SETUP
// ----------------------------------------------------

function setup() {

  createCanvas(windowWidth, windowHeight);

  pixelDensity(1);

  noSmooth();

  frameRate(30);

  processed = createGraphics(1, 1);

  processed.noSmooth();

  processed.drawingContext.imageSmoothingEnabled = false;

  calculateShapeColors();

  selectedColor = color(255);

  createUI();

  applyNewImage(img);
}



// ----------------------------------------------------
// UI
// ----------------------------------------------------

function createUI() {

  panelContainer = createDiv('');

  panelContainer.position(30, 30);

  panelContainer.style(
    'background-color',
    'rgba(0,0,0,0.85)'
  );

  panelContainer.style('padding', '16px');

  panelContainer.style('width', '280px');

  panelContainer.style('color', '#fff');

  panelContainer.style(
    'font-family',
    'sans-serif'
  );

  panelContainer.style(
    'border-radius',
    '8px'
  );

  panelContainer.style('z-index', '999');

  panelContainer.style(
    'line-height',
    '1.1'
  );

  panelContainer.style(
    'user-select',
    'none'
  );

  panelContainer.elt.addEventListener(
    'mousedown',
    (e) => {
      e.stopPropagation();
    }
  );

  panelContainer.elt.addEventListener(
    'touchstart',
    (e) => {
      e.stopPropagation();
    }
  );

  function createLabeledSlider(
    label,
    min,
    max,
    value,
    step
  ) {

    let row = createDiv(label);

    row.parent(panelContainer);

    row.style('margin-top', '10px');

    let slider =
      createSlider(
        min,
        max,
        value,
        step
      );

    slider.parent(row);

    slider.style('width', '100%');

    return slider;
  }

  sizeSlider =
    createLabeledSlider(
      "SIZE",
      5,
      50,
      15,
      1
    );

  hueSlider =
    createLabeledSlider(
      "HUE",
      0,
      255,
      0,
      1
    );

  thresholdSlider =
    createLabeledSlider(
      "THRESHOLD",
      0,
      255,
      255,
      1
    );

  ditherSlider =
    createLabeledSlider(
      "DITHER",
      1,
      5,
      2,
      1
    );

  exportSlider =
    createLabeledSlider(
      "EXPORT SCALE",
      1,
      8,
      2,
      1
    );

  sizeSlider.input(uiChanged);
  hueSlider.input(uiChanged);
  thresholdSlider.input(uiChanged);
  ditherSlider.input(uiChanged);

  exportSlider.input(() => {

    exportScale =
      int(exportSlider.value());
  });

  // BUTTONS

  let btnRow = createDiv('');

  btnRow.parent(panelContainer);

  btnRow.style('margin-top', '16px');

  negativeButton =
    createButton('NEGATIVE');

  negativeButton.parent(btnRow);

negativeButton.mousePressed(() => {

  // 1. инверсия пространства анализа
  workingImg.filter(INVERT);
  workingImg.loadPixels();

  // 2. сброс якоря восприятия (ВАЖНО для стабильности mask)
let r = 255 - red(selectedColor);
let g = 255 - green(selectedColor);
let b = 255 - blue(selectedColor);

selectedColor = color(r, g, b);

  // 3. принудительный пересчёт сцены
  needsUpdate = true;
});

  saveButton =
    createButton('SAVE');

  saveButton.parent(btnRow);

  saveButton.style(
    'margin-left',
    '10px'
  );

  saveButton.mousePressed(() => {

    exportRender();
  });

  // FILE INPUT

  uploadInput =
    createFileInput(handleFile);

  uploadInput.parent(panelContainer);

  uploadInput.style(
    'margin-top',
    '16px'
  );

  uploadInput.style(
    'max-width',
    '100%'
  );

  // IMAGE MENU

  let menuRow =
    createDiv('SELECT IMAGE');

  menuRow.parent(panelContainer);

  menuRow.style(
    'margin-top',
    '16px'
  );

  menuImages = createSelect();

  menuImages.parent(menuRow);

  menuImages.style('width', '100%');

  menuImages.style(
    'margin-top',
    '6px'
  );

  for (let i = 0; i < defaultImages.length; i++) {

    menuImages.option(
      defaultImages[i]
    );
  }

  menuImages.changed(() => {

    let selected =
      menuImages.value();

    loadImage(
      `./data/${selected}`,
      (newImg) => {

        applyNewImage(newImg);
      }
    );
  });
}



// ----------------------------------------------------
// UI UPDATE
// ----------------------------------------------------

function uiChanged() {

  rectS =
    max(
      5,
      int(sizeSlider.value())
    );

  hueValue =
    int(hueSlider.value());

  threshold =
    int(thresholdSlider.value());

  factor =
    max(
      1,
      int(ditherSlider.value())
    );

  needsUpdate = true;
}



// ----------------------------------------------------
// DRAW
// ----------------------------------------------------

function draw() {

  background(20);

  if (needsUpdate) {

    rebuildImage();

    needsUpdate = false;
  }

  image(
    processed,
    displayOffsetX,
    displayOffsetY
  );
}



// ----------------------------------------------------
// MAIN RENDER
// ----------------------------------------------------

function rebuildImage() {

  processed.clear();

  processed.imageMode(CORNER);

  let sr = red(selectedColor);
  let sg = green(selectedColor);
  let sb = blue(selectedColor);

  for (
    let gx = 0;
    gx < processed.width;
    gx += rectS
  ) {

    for (
      let gy = 0;
      gy < processed.height;
      gy += rectS
    ) {

      let px =
        floor(
          map(
            gx,
            0,
            processed.width,
            0,
            workingImg.width
          )
        );

      let py =
        floor(
          map(
            gy,
            0,
            processed.height,
            0,
            workingImg.height
          )
        );

      px =
        constrain(
          px,
          0,
          workingImg.width - 1
        );

      py =
        constrain(
          py,
          0,
          workingImg.height - 1
        );

      let idx =
        4 * (
          px +
          py * workingImg.width
        );

      let r =
        workingImg.pixels[idx];

      let g =
        workingImg.pixels[idx + 1];

      let b =
        workingImg.pixels[idx + 2];

      if (
        r === undefined ||
        g === undefined ||
        b === undefined
      ) continue;

      let rr, gg, bb;

      let d =
        dist(
          r,
          g,
          b,
          sr,
          sg,
          sb
        );

      if (d < threshold) {

        rr =
          constrain(
            r + hueValue,
            0,
            255
          );

        gg = g;
        bb = b;

      } else {

        rr = r * 0.15;
        gg = g * 0.15;
        bb = b * 0.15;
      }

      rr = quantize(rr, factor);
      gg = quantize(gg, factor);
      bb = quantize(bb, factor);

      let sIdx =
        findBestMatch(rr, gg, bb);

      let tIdx =
        (floor(gx / rectS) % 4) +
        (floor(gy / rectS) % 4) * 4;

      // INTEGER SNAP
      let drawX = floor(gx);
      let drawY = floor(gy);

      // OVERLAP FIX
      let overlap = 0.8;

      processed.image(
        tiles[sIdx][tIdx],
        drawX,
        drawY,
        rectS + overlap,
        rectS + overlap
      );
    }
  }
}



// ----------------------------------------------------
// APPLY IMAGE
// ----------------------------------------------------

function applyNewImage(newImg) {

  img = newImg;

  workingImg = img.get();

  if (
    workingImg.width >
      MAX_WORKING_SIZE ||
    workingImg.height >
      MAX_WORKING_SIZE
  ) {

    if (
      workingImg.width >
      workingImg.height
    ) {

      workingImg.resize(
        MAX_WORKING_SIZE,
        0
      );

    } else {

      workingImg.resize(
        0,
        MAX_WORKING_SIZE
      );
    }
  }

  workingImg.loadPixels();

  let ratio =
    img.width / img.height;

  canvasDisplayHeight =
    min(
      MAX_DISPLAY_HEIGHT,
      windowHeight - 40
    );

  canvasDisplayWidth =
    floor(
      canvasDisplayHeight * ratio
    );

  if (
    canvasDisplayWidth >
    windowWidth - 360
  ) {

    canvasDisplayWidth =
      windowWidth - 360;

    canvasDisplayHeight =
      floor(
        canvasDisplayWidth /
        ratio
      );
  }

  processed =
    createGraphics(
      canvasDisplayWidth,
      canvasDisplayHeight
    );

  processed.noSmooth();

  processed.drawingContext.imageSmoothingEnabled = false;

 let uiWidth = 340;

let freeSpaceWidth =
  windowWidth - uiWidth;

displayOffsetX =
  floor(
    uiWidth +
    (
      freeSpaceWidth -
      canvasDisplayWidth
    ) * 0.5
  );

  displayOffsetY =
    floor(
      (
        windowHeight -
        canvasDisplayHeight
      ) * 0.5
    );

  selectedColor = color(255);

  needsUpdate = true;
}



// ----------------------------------------------------
// EXPORT
// ----------------------------------------------------

function exportRender() {

  let exportW =
    processed.width *
    exportScale;

  let exportH =
    processed.height *
    exportScale;

  // SAFETY LIMIT

  let maxPixels = 16000000;

  if (
    exportW * exportH >
    maxPixels
  ) {

    let scale =
      sqrt(
        maxPixels /
        (exportW * exportH)
      );

    exportW =
      floor(exportW * scale);

    exportH =
      floor(exportH * scale);
  }

  let exportCanvas =
    createGraphics(
      exportW,
      exportH
    );

  exportCanvas.pixelDensity(1);

  exportCanvas.noSmooth();

  exportCanvas.drawingContext.imageSmoothingEnabled = false;

  exportCanvas.clear();

  exportCanvas.imageMode(CORNER);

  let exportRectS =
    rectS * exportScale;

  let sr = red(selectedColor);
  let sg = green(selectedColor);
  let sb = blue(selectedColor);

  for (
    let gx = 0;
    gx < exportW;
    gx += exportRectS
  ) {

    for (
      let gy = 0;
      gy < exportH;
      gy += exportRectS
    ) {

      let sampleX =
        floor(
          map(
            gx,
            0,
            exportW,
            0,
            workingImg.width
          )
        );

      let sampleY =
        floor(
          map(
            gy,
            0,
            exportH,
            0,
            workingImg.height
          )
        );

      sampleX =
        constrain(
          sampleX,
          0,
          workingImg.width - 1
        );

      sampleY =
        constrain(
          sampleY,
          0,
          workingImg.height - 1
        );

      let idx =
        4 * (
          sampleX +
          sampleY * workingImg.width
        );

      let r =
        workingImg.pixels[idx];

      let g =
        workingImg.pixels[idx + 1];

      let b =
        workingImg.pixels[idx + 2];

      let rr, gg, bb;

      let d =
        dist(
          r,
          g,
          b,
          sr,
          sg,
          sb
        );

      if (d < threshold) {

        rr =
          constrain(
            r + hueValue,
            0,
            255
          );

        gg = g;
        bb = b;

      } else {

        rr = r * 0.15;
        gg = g * 0.15;
        bb = b * 0.15;
      }

      rr = quantize(rr, factor);
      gg = quantize(gg, factor);
      bb = quantize(bb, factor);

      let sIdx =
        findBestMatch(rr, gg, bb);

      let tIdx =
        (floor(gx / exportRectS) % 4) +
        (floor(gy / exportRectS) % 4) * 4;

      // INTEGER SNAP
      let drawX = floor(gx);
      let drawY = floor(gy);

      // SEAM FIX
      let overlap = 1.0;

      exportCanvas.image(
        tiles[sIdx][tIdx],
        drawX,
        drawY,
        exportRectS + overlap,
        exportRectS + overlap
      );
    }
  }

  save(
    exportCanvas,
    `render_${Date.now()}.png`
  );
}



// ----------------------------------------------------
// HELPERS
// ----------------------------------------------------

function quantize(v, f) {

  return (
    round(f * v / 255) *
    (255 / f)
  );
}



function calculateShapeColors() {

  for (
    let i = 0;
    i < totalShapes;
    i++
  ) {

    let tile = tiles[i][0];

    tile.loadPixels();

    let r = 0;
    let g = 0;
    let b = 0;

    let count =
      tile.pixels.length / 4;

    for (
      let p = 0;
      p < tile.pixels.length;
      p += 4
    ) {

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

  for (
    let i = 0;
    i < totalShapes;
    i++
  ) {

    let c = shapeColors[i];

    let d =
      dist(
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

function mousePressed(event) {

  if (
    event &&
    event.target &&
    event.target.tagName.toLowerCase()
      !== 'canvas'
  ) return;

  let mx =
    mouseX - displayOffsetX;

  let my =
    mouseY - displayOffsetY;

  if (
    mx >= 0 &&
    mx < processed.width &&
    my >= 0 &&
    my < processed.height
  ) {

    let workX =
      floor(
        map(
          mx,
          0,
          processed.width,
          0,
          workingImg.width
        )
      );

    let workY =
      floor(
        map(
          my,
          0,
          processed.height,
          0,
          workingImg.height
        )
      );

    selectedColor =
      workingImg.get(
        workX,
        workY
      );

    needsUpdate = true;
  }
}



// ----------------------------------------------------
// RESIZE
// ----------------------------------------------------

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );

  applyNewImage(img);
}



// ----------------------------------------------------
// FILE INPUT
// ----------------------------------------------------

function handleFile(file) {

  if (file.type === 'image') {

    loadImage(
      file.data,
      (newImg) => {

        applyNewImage(newImg);
      }
    );
  }
}
