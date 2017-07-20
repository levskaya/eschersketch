//--------------------------------------------------------------------------------------------------
//
// Eschersketch - A drawing program for exploring symmetrical designs
//
// Main UI
//
// Copyright (c) 2017 Anselm Levskaya (http://anselmlevskaya.com)
// Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
// license.
//
//--------------------------------------------------------------------------------------------------


// Globals
//--------------------------------------------------------------------------------------------------

// Constants
const CANVAS_WIDTH  = 1600;
const CANVAS_HEIGHT = 1200;
const MIN_LINEWIDTH = 0.01;
const MAX_LINEWIDTH = 4;

// Uninitialized Variables
let sketch = {};
let canvas = {};
let ctx = {};
let gridcanvas = {};
let gridctx = {};
let affineset = [];
let lattice = {};
//placementui = {}
//rotscaleui = {}


// Important State Variables
//--------------------------------------------------------------------------------------------------
const uiState = {
  opacity: 1.0,
  red: 0,
  green: 0,
  blue: 0,
  linewidth: 1.0,
  newline: true,  // bool for determining to start a new line
  // variables for panning the canvas:
  canvasActive: false,
  canvasPanning: false,
  canvasCursorM: false,
  canvasXonPan: 0,
  canvasYonPan: 0,
  mouseXonPan: 0,
  mouseYonPan: 0,
  drawInterval: 0,
  // planar symmetry parameters:
  gridNx: 37,
  gridNy: 31,
  gridX0: 800,
  gridY0: 400,
  gridspacing: 100,
  gridrotation: 0,
  showgrid: false,
  symmetry: "p4m",
  //_gridspacing: 0, //for grid rotation, not used right now
  //_gridrotation: 0, //for grid rotation, not used right now
  linecapround: false
};

// Records state of keys: false is up, true is down
const keyState = {
  space: false,
  shift: false,
  ctrl: false
};


// Initial Transform
//--------------------------------------------------------------------------------------------------

const updateTiling = function() {
    affineset = generateTiling(planarSymmetries[uiState.symmetry],
                              uiState.gridNx, uiState.gridNy,
                              uiState.gridspacing, uiState.gridrotation,
                              uiState.gridX0, uiState.gridY0);
    lattice = generateLattice(planarSymmetries[uiState.symmetry],
                              uiState.gridNx, uiState.gridNy,
                              uiState.gridspacing, uiState.gridrotation,
                              uiState.gridX0, uiState.gridY0);
  };

const updateLattice = () =>
    lattice = generateLattice(planarSymmetries[uiState.symmetry],
                              uiState.gridNx, uiState.gridNy,
                              uiState.gridspacing, uiState.gridrotation,
                              uiState.gridX0, uiState.gridY0)
  ;

// Build Initial Tiling Set
updateTiling();


// Drawing Object
//  just a cache of previously drawn points
//--------------------------------------------------------------------------------------------------

class Drawing {
  constructor() {
    this.pointCache = new Array();
    this.drawnP = 0;
  }

  addPoint(p) {
    this.pointCache.push(p);
    this.drawnP++;
  }

  render() {
    const dp = this.drawnP;
    const pc = this.pointCache;
    if (dp > 0) { lastline(pc); }
    //if (dp > 0) { lastline_quadratic(pc); }
    //if (dp > 0) { circlepaint(pc); }
  }
 
  dumpCache() {
    this.pointCache.length = 0;
  }
}


// Drawing Functions
// these drawing functions should be assoc'd w. renderer, not point...
//--------------------------------------------------------------------------------------------------

// Strokes lines between last two points in set
var lastline = function(pointSet) {
  const ps = pointSet.length;
  if ((ps > 1) && !uiState.newline) {
    const p1 = pointSet[ps - 1];
    const p2 = pointSet[ps - 2];
    //the below line slows things down, state changes are costly in canvas
    //ctx.strokeStyle = "rgba(#{uiState.red},#{uiState.green},#{uiState.blue},#{uiState.opacity})"
    //ctx.strokeStyle = "rgba( 0,0,0,.5)"

    for (let af of affineset) {
        const Tp1 = af.on(p1.x, p1.y);
        const Tp2 = af.on(p2.x, p2.y);
        //the below line slows things down, state changes are costly in canvas
        //ctx.lineWidth = p1.linewidth
        //ctx.lineWidth = uiState.linewidth
        ctx.line(Tp2[0], Tp2[1], Tp1[0], Tp1[1]);
    }

  } else if (uiState.newline) { 
      uiState.newline = false; 
  }
};

// Strokes quadratic lines between last two points in set
const lastline_quadratic = function(pointSet) {
  const ps = pointSet.length;
  if ((ps > 1) && !uiState.newline) {
    const p1 = pointSet[ps - 1];
    const p2 = pointSet[ps - 2];
    //the below line slows things down, state changes are costly in canvas
    //ctx.strokeStyle = "rgba(#{uiState.red},#{uiState.green},#{uiState.blue},#{uiState.opacity})"
    //ctx.strokeStyle = "rgba(0,0,0,.5)"

    for (let af of affineset) {
	const Tp1 = af.on(p1.x, p1.y);
	const Tp2 = af.on(p2.x, p2.y);
	//the below line slows things down, state changes are costly in canvas
	//ctx.lineWidth = p1.linewidth
	//ctx.lineWidth = uiState.linewidth
	const xc = (Tp1[0] + Tp2[0]) / 2;
	const yc = (Tp1[1] + Tp2[1]) / 2;
	ctx.beginPath();
	ctx.moveTo(Tp1[0], Tp1[1]);
	ctx.quadraticCurveTo(xc, yc, Tp2[0], Tp2[1]);
	//ctx.line Tp2[0], Tp2[1], Tp1[0], Tp1[1]
	ctx.stroke();
    }
    
  } else if (uiState.newline) { 
      uiState.newline = false; 
  }
};

// Draws circles at each point
const circlepaint = function(pointSet) {
  const ps = pointSet.length;
  const p1 = pointSet[ps - 1];
  for (let af of affineset) {
      const Tp1 = af.on(p1.x, p1.y);
      //ctx.lineWidth = p1.linewidth
      ctx.beginPath();
      ctx.arc(Tp1[0], Tp1[1], uiState.linewidth, 0, 2*PI, false);
      ctx.fillStyle = `rgba(${uiState.red},${uiState.green},${uiState.blue},${uiState.opacity})`;
      ctx.fill();
  }
};

// actually invokes drawing routine for events
const renderPoint = function(e) {
  sketch.addPoint({
    x: e.clientX - canvas.offset().left,
    y: e.clientY - canvas.offset().top
  });
    //linewidth: uiState.linewidth
  sketch.render();
};

// simple canvas line method
const drawLine = function(x1, y1, x2, y2) {
  this.beginPath();
  this.moveTo(x1, y1);
  this.lineTo(x2, y2);
  this.stroke();
};

const gridDraw = function() {
  //gridctx.strokeStyle = "rgb(100, 100, 100)"
  //gridctx.fillStyle = "rgb(100, 100, 100)"
  gridctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const v0 = RotationTransform(uiState.gridrotation).onVec(planarSymmetries[uiState.symmetry]['vec0']);
  const v1 = RotationTransform(uiState.gridrotation).onVec(planarSymmetries[uiState.symmetry]['vec1']);

  const p0 = [uiState.gridX0, uiState.gridY0];
  const p1 = [(uiState.gridspacing*v0[0])+uiState.gridX0, (uiState.gridspacing*v0[1])+uiState.gridY0];
  const p2 = [(uiState.gridspacing*v1[0])+uiState.gridX0, (uiState.gridspacing*v1[1])+uiState.gridY0];
  // Draw Lattice
  for (let af of lattice) {
    const Tp0 = af.on(p0[0],p0[1]);
    const Tp1 = af.on(p1[0],p1[1]);
    const Tp2 = af.on(p2[0],p2[1]);
    //console.log(Tp0,Tp1,Tp2)
    gridctx.beginPath();
    gridctx.moveTo(Tp0[0],Tp0[1]);
    gridctx.lineTo(Tp1[0],Tp1[1]);
    gridctx.moveTo(Tp0[0],Tp0[1]);
    gridctx.lineTo(Tp2[0],Tp2[1]);
    //gridctx.closePath()
    gridctx.stroke();
  }

  const circR=20;
  const c0 = [(p0[0] + gridcanvas.offset().left)-(circR/2),
        (p0[1] + gridcanvas.offset().top)-(circR/2)];
  const c1 = [(p1[0] + gridcanvas.offset().left)-(circR/2),
        (p1[1] + gridcanvas.offset().top)-(circR/2)];

  $('#center-ui').css({top:`${c0[1]}px`,left:`${c0[0]}px`,width:'20px',height:'20px'});
  $('#rotscale-ui').css({top:`${c1[1]}px`,left:`${c1[0]}px`,width:'20px',height:'20px'});
};

  //for p in [p0,p1,p2]
  //  gridctx.beginPath()
  //  gridctx.arc(p[0],p[1],10,0,2*PI)
  //  gridctx.fill()
  //  gridctx.stroke()

// Fixes DPI issues with Retina displays on Chrome
// http://www.html5rocks.com/en/tutorials/canvas/hidpi/
const pixelFix = function(canvas) {
  // get the canvas and context
  const context = canvas.getContext('2d');

  // finally query the various pixel ratios
  const devicePixelRatio = window.devicePixelRatio || 1;
  const backingStoreRatio = context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio || 1;

  const ratio = devicePixelRatio / backingStoreRatio;
  //console.log "pixel ratio", ratio

  // upscale the canvas if the two ratios don't match
  if (devicePixelRatio !== backingStoreRatio) {

    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    canvas.width = oldWidth * ratio;
    canvas.height = oldHeight * ratio;
    canvas.style.width = oldWidth + 'px';
    canvas.style.height = oldHeight + 'px';

    // now scale the context to counter
    // the fact that we've manually scaled
    // our canvas element
    context.scale(ratio, ratio);
  }
};

// Scales the number of "backing pixels" for a given on-screen pixel
// to a higher value - useful for high-DPI exports
const setCanvasPixelDensity = function(canvas, ratio) {
  // get the canvas and context
  const context = canvas.getContext('2d');

  const oldWidth = canvas.width;
  const oldHeight = canvas.height;
  canvas.width = oldWidth * ratio;
  canvas.height = oldHeight * ratio;
  canvas.style.width = oldWidth + 'px';
  canvas.style.height = oldHeight + 'px';

  // now scale the context to counter
  // the fact that we've manually scaled
  // our canvas element
  context.scale(ratio, ratio);
};


// Main GUI initialization function
//--------------------------------------------------------------------------------------------------

const initGUI = function() {
  sketch = new Drawing();
  canvas = $("#sketch");
  pixelFix(canvas[0]);

  //canvas.hide()
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  ctx = canvas[0].getContext("2d");
  ctx.line = drawLine;
  ctx.lineWidth = 0.5;
  ctx.fillStyle = "rgb(255, 255, 255)";
  //ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  //ctx.lineJoin="round"
  //ctx.lineCap="round"

  gridcanvas = $("#gridcanvas");
  pixelFix(gridcanvas[0]);
  gridcanvas.width = CANVAS_WIDTH;
  gridcanvas.height = CANVAS_HEIGHT;
  gridctx = gridcanvas[0].getContext("2d");
  //gridctx.globalAlpha = 0.5;
  gridctx.line = drawLine;
  gridctx.lineWidth = 0.5;
  gridctx.fillStyle = "rgba(0,0,0,0.0)";
  gridctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  //gridctx.strokeStyle = "rgb(0, 255, 255)"
  gridctx.strokeStyle = "rgba(0,0,0,0.5)";
  gridcanvas.hide();
  $('#grid-container').hide();
  gridDraw();


  canvas.mousedown(onCanvasMousedown);
  canvas.mouseup(onDocumentMouseup);
  canvas.mousemove(onDocumentMousemove);
  $('body').keyup(onDocumentKeyup);
  $('body').keydown(onDocumentKeydown);

  // center crosshairs
  //    these belong on a second UI canvas layer
  //ctx.line(800 - 5, 400, 800 + 5, 400)
  //ctx.line(800, 400 - 5, 800, 400 + 5)

  const gridUI = $('#grid-container');
  const centerUI = $('#center-ui');
  const rotscaleUI = $('#rotscale-ui');
  centerUI.mousedown(onCenterMousedown);
  rotscaleUI.mousedown(onRotScaleMousedown);
  gridUI.mouseup(onGridMouseUp);
  gridUI.mousemove(onGridMouseMove);

  //$('input[name=xpos]').val(uiState.gridX0)
  //$('input[name=ypos]').val(uiState.gridY0)
  //$('input[name=gridspacing]').val(uiState.gridspacing)
  //$('input[name=gridrotation]').val(uiState.gridrotation)

  // Set Up Symmetry Selector Buttons
  $(".symsel").click( function(){
    const newsym=$(this).text();
    uiState.symmetry = newsym;
    $(".symsel").removeClass('selected');
    $(this).addClass('selected');
    updateTiling();
    gridDraw();
    console.log("symmetry ", newsym, affineset.length);
    canvas.focus();
  });

  // highlight the initial startup symmetry button
  $(`.symsel:contains(${uiState.symmetry})`).addClass('selected');

  // Color Picker
  ColorPicker(
    $("#color-picker")[0],
    function(hex, hsv, rgb) {
	setColor(rgb);
	ctx.strokeStyle = `rgba(${uiState.red},${uiState.green},${uiState.blue},${uiState.opacity})`;
    });

  // Opacity Element
  const opacityui = $("#ui-opacity");
  opacityui.mousedown(changeOpacity);

  // Line Width Element
  const linewidthui = $("#ui-linewidth");
  const linewidthui_ctx=linewidthui[0].getContext("2d");
  linewidthui_ctx.beginPath();
  linewidthui_ctx.moveTo(0,0);
  linewidthui_ctx.lineTo(0,10);
  linewidthui_ctx.lineTo(200,10);
  linewidthui_ctx.lineTo(200,0);
  linewidthui_ctx.closePath();
  linewidthui_ctx.fillStyle="#fff";
  linewidthui_ctx.fill();
  linewidthui_ctx.beginPath();
  linewidthui_ctx.moveTo(0,0);
  linewidthui_ctx.lineTo(0,10);
  linewidthui_ctx.lineTo(200,5);
  linewidthui_ctx.lineTo(0,0);
  linewidthui_ctx.closePath();
  linewidthui_ctx.fillStyle="#000";
  linewidthui_ctx.fill();
  linewidthui.mousedown(changeLineWidth);

  // Clear Screen Button
  $('#clearscreen').click(clearScreen);

  // Save Image Button
  $('#saveimage').click(saveImage);

  // show grid
  $('#showgrid').click(toggleGrid);

  $('input[name="gridspacing"]').change( function(){
    uiState.gridspacing=Number($(this).val());
    updateTiling();
    gridDraw();
    $(this).blur();
    });

  $('input[name="xpos"]').change( function(){
    uiState.gridX0=Number($(this).val());
    updateTiling();
    gridDraw();
    $(this).blur();
    });

  $('input[name="ypos"]').change( function(){
    uiState.gridY0=Number($(this).val());
    updateTiling();
    gridDraw();
    $(this).blur();
    });

  $("input[name='linecapround']").click( function(){
    const val=$(this).val();
    if (uiState.linecapround) {
      ctx.lineCap="butt";
      $(this).prop('checked', false);
      uiState.linecapround = false;
    } else {
      ctx.lineCap="round";
      $(this).prop('checked', true);
      uiState.linecapround = true;
    }
    console.log("foo");
  });

  updateGUI();
};


// UI Helper Functions
//--------------------------------------------------------------------------------------------------

var updateGUI = function() {
  $('input[name="xpos"]').val(uiState.gridX0);
  $('input[name="ypos"]').val(uiState.gridY0);
  $('input[name="gridspacing"]').val(uiState.gridspacing);
  $('input[name="gridrotation"]').val(uiState.gridrotation);
};

var toggleGrid = function() {
  if (uiState.showgrid) {
    $('#grid-container').hide();
    gridcanvas.hide();
  } else {
    $('#grid-container').show();
    gridcanvas.show();
    gridDraw();
  }
  uiState.showgrid = (!uiState.showgrid);
};

var saveImage = function() {
    canvas[0].toBlob(blob => saveAs(blob, "eschersketch.png"));
};

var clearScreen = () =>
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

var setColor = function(rgb) {
    uiState.red = rgb.r;
    uiState.green = rgb.g;
    uiState.blue = rgb.b;
    //console.log("RGB: ", uiState.red, uiState.green, uiState.blue);
};

var changeOpacity = function(e) {
  const { left }=$(this).offset();
  const { top }=$(this).offset();
  const x = e.clientX - left;
  const y = e.clientY - top;
  const h = $(this).height();
  uiState.opacity = map(y,0,h,1.0,0.0);
  ctx.strokeStyle = `rgba(${uiState.red},${uiState.green},${uiState.blue},${uiState.opacity})`;
  //console.log("changeopacity ", x, y, h, uiState.opacity);
};

var changeLineWidth = function(e) {
  const x = e.clientX - $(this).offset().left;
  const y = e.clientY - $(this).offset().top;
  const h = $(this).height();
  const w = $(this).width();
  uiState.linewidth = map(x,0,w,MAX_LINEWIDTH,MIN_LINEWIDTH);
  ctx.lineWidth = uiState.linewidth;
  //console.log("changelinewidth ", x, y, h, uiState.linewidth);
};

// Export init function for invocation
window.initGUI = initGUI;


// Mouse Events
//--------------------------------------------------------------------------------------------------

var onCanvasMousedown = function(e) {
  e.preventDefault();
  if (keyState.space) {
    uiState.canvasPanning = true;
    uiState.mouseXonPan = e.clientX;
    uiState.mouseYonPan = e.clientY;
    uiState.canvasXonPan = canvas.offset().left;
    uiState.canvasYonPan = canvas.offset().top;
    return;
  }
  //else if (keyState.c) {
  //  uiState.gridX0 = e.clientX - canvas.offset().left;
  //  uiState.gridY0 = e.clientY - canvas.offset().top;
  //  return;
  //}
  uiState.newline = true;
  renderPoint(e);
  uiState.canvasActive = true;
};

var onDocumentMouseup = function(e) {
  uiState.canvasPanning = false;
  uiState.canvasActive = false;
  uiState.newline = false;
};

var onDocumentMousemove = function(e) {
  if (uiState.canvasPanning) {
    canvas[0].style.left=(((e.clientX - uiState.mouseXonPan) + uiState.canvasXonPan) + "px");
    canvas[0].style.top=(((e.clientY - uiState.mouseYonPan) + uiState.canvasYonPan) + "px");
  }

  if (keyState.space && uiState.canvasPanning && !uiState.canvasCursorM) {
    canvas.css("cursor", "move");
    uiState.canvasCursorM = true;

  } else if (!uiState.canvasPanning && uiState.canvasCursorM) {
    canvas.css("cursor", "crosshair");
    uiState.canvasCursorM = false;
  }

  if (uiState.canvasActive) {
    if (uiState.drawInterval <= 0) {
      // pressure = <use modern pressure lib here>
      // uiState.linewidth = map(pressure, 0, 1, MAX_LINEWIDTH, MIN_LINEWIDTH);
      // renderPoint(e);
      renderPoint(e);
      uiState.drawInterval = 1;
    }
    uiState.drawInterval--;
  }
};

var onCenterMousedown = function(e) {
  e.preventDefault();
  uiState.recentering = true;
  uiState.mouseXonPan = e.clientX;
  uiState.mouseYonPan = e.clientY;
  uiState.canvasXonPan = uiState.gridX0;
  uiState.canvasYonPan = uiState.gridY0;
};

var onRotScaleMousedown = function(e) {
  e.preventDefault();
  uiState.rotscaling = true;
  uiState.mouseXonPan = e.clientX;
  uiState.mouseYonPan = e.clientY;
  uiState._gridspacing = uiState.gridspacing;
  uiState._gridrotation = uiState.gridrotation;
};

const coordsToAngle = function(x,y) {
    let phi;
    if ((x === 0) && (y >= 0)) {
      phi = PI/2;
    } else if ((x === 0) && (y < 0)) {
      phi = -PI/2;
    } else if (x > 0) {
      phi = atan(y/x);
    } else if (x < 0) {
      phi = atan(y/x) + PI;
    }
    return phi;
  };

var onGridMouseMove = function(e) {
  e.preventDefault();
  if (uiState.recentering) {
    uiState.gridX0 = uiState.canvasXonPan + (e.clientX - uiState.mouseXonPan);
    uiState.gridY0 = uiState.canvasYonPan + (e.clientY - uiState.mouseYonPan);
    //canvas[0].style.left = ((e.clientX - uiState.mouseXonPan) + "px");
    //canvas[0].style.top  = ((e.clientY - uiState.mouseYonPan) + "px");
    //uiState.recentering  = false;
    gridDraw();
  }
  //uiState.recentering = true;
  if (uiState.rotscaling) {
    const v0      = RotationTransform(uiState._gridrotation).onVec(planarSymmetries[uiState.symmetry].vec0);
    const origPhi = coordsToAngle(uiState._gridspacing*v0[0], uiState._gridspacing*v0[1]);
    const origR   = uiState._gridspacing * sqrt((v0[0]*v0[0]) + (v0[1]*v0[1]));
    const deltaX  = (e.clientX - uiState.mouseXonPan) + (uiState._gridspacing * v0[0]);
    const deltaY  = (e.clientY - uiState.mouseYonPan) + (uiState._gridspacing * v0[1]);
    const newR    = sqrt((deltaX*deltaX) + (deltaY*deltaY));
    const newPhi  = coordsToAngle(deltaX, deltaY);
    uiState.gridspacing = (newR-origR) + uiState._gridspacing;
    //uiState.gridrotation = -1*(newPhi-origPhi) + uiState._gridrotation;
    //console.log(deltaR, -1*(newPhi-origPhi));
    updateLattice();
    gridDraw();
  }
  updateGUI();
};

var onGridMouseUp = function(e) {
  e.preventDefault();
  uiState.recentering = false;
  uiState.rotscaling = false;
  updateTiling();
};


// Key Handling
// ------------------------------------------------------------------------------

var onDocumentKeydown = function(e) {
  switch (e.keyCode) {
  case 32: //SPACE BAR
    keyState.space = true;
    break;
  case 16: //SHIFT
    keyState.shift = true;
    break;
  case 17: //CTRL
    keyState.ctrl = true;
    break;
  case 67: // C
    keyState.c = true;
    //when 83 #S
    //  saveDrawing()  if keyState.ctrl and keyState.shift
    break;
  case 8: case 46:  //backspace, delete
    if (keyState.ctrl) {
      sketch.dumpCache();
      sketch.drawnP = 0;
    }
    break;
  }
};

var onDocumentKeyup = function(e) {
  switch (e.keyCode) {
  case 32: //SPACE BAR
    keyState.space = false;
    break;
  case 16: //SHIFT
    keyState.shift = false;
    break;
  case 17: //CTRL
    keyState.ctrl = false;
    break;
  case 67: // C
    keyState.c = false;
    break;
  case 71: // C
    toggleGrid();
    break;
  }
};
