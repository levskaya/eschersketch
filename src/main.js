//------------------------------------------------------------------------------
//
// Eschersketch - A drawing program for exploring symmetrical designs
//
// Main UI
//
// Copyright (c) 2017 Anselm Levskaya (http://anselmlevskaya.com)
// Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
// license.
//
//------------------------------------------------------------------------------

// Imports
//------------------------------------------------------------------------------
import { _ } from 'underscore';
import Vue from 'vue';
import Hammer from 'hammerjs';
import {Chrome} from 'vue-color';
import {saveAs} from 'file-saver';

import {pixelFix, setCanvasPixelDensity} from './canvas_utils';
import {planarSymmetries} from './symmetryGenerator';

// Import all the Drawing Ops and Tools
//------------------------------------------------------------------------------
import {SymmOp, GridTool}     from './symmetryOps';
import {LineOp, LineTool}     from './lineTool';
import {PencilOp, PencilTool} from './pencilTool';
import {PolyOp, PolyTool}     from './polyTool';
import {PathOp, PathTool}     from './pathTool';
import {CircleOp, CircleTool} from './circleTool';
import {ColorOp, StyleOp}     from './styleOps';


// Global Constants
//------------------------------------------------------------------------------
export const gConstants = {
  CANVAS_WIDTH:     1600, //TODO: should be dynamic based on max screen size!
  CANVAS_HEIGHT:    1200, //
  MIN_LINEWIDTH:    0.1,
  MAX_LINEWIDTH:    10,
  DELTA_LINEWIDTH:  0.1,
  GRIDNX:           18,
  GRIDNY:           14,
  INITSYM:          'p6m',
  // All Symmetries made available
  ALLSYMS:          ['p1','diagonalgrid','pm','cm','pg', //rot-free
                     'pmg','pgg','pmm','p2','cmm',   //180deg containing
                     'p4', 'p4g', 'p4m',             //square
                     'hexgrid','p3','p6','p31m','p3m1','p6m'] //hex
};


// gS = global State
// holds the UI state as well as acting as top-level event bus
// should eventually port to vuex
//------------------------------------------------------------------------------
export const gS = new Vue({
  data: {
    // stupid hack, since Vue can't wrap atomics, have all simple atomic
    // state parameters in here, mutating params then induces reactivity
    params: {
      curTool: 'line',                 // Tool State
      symstate: gConstants.INITSYM     // Symmetry State
    },
    // grid Nx, Ny should NOT be too large, should clamp.
    gridstate: {x:800, y:400, d:100, t:0, Nx:18, Ny:14},

    // Style State
    //-------------------------------
    ctxStyle: {
      lineCap: "butt", // butt, round, square
      lineJoin: "round", // round, bevel, miter
      miterLimit: 10.0, // applies to miter setting above
      lineWidth: 1.0
    },
    fillcolor:   {target: "fill",   r: 200, g:100, b:100, a:0.0},
    strokecolor: {target: "stroke", r: 100, g:100, b:100, a:1.0},
    // Global Command and Redo Stacks
    //-------------------------------
    cmdstack: [], //<-- needed in here?
    redostack: [],
  }
});
gS.$on('symmUpdate',
       function(symName, gridSetting) {
         let op = new SymmOp(symName, _.clone(gridSetting));
         op.render(ctx);
         gS.cmdstack.push(op);
       });
gS.$on('styleUpdate',
       function(updateDict) {
         let op = new StyleOp(_.clone(updateDict));
         op.render(ctx);
         gS.cmdstack.push(op);
       });
gS.$on('colorUpdate',
       function(clr) {
         let op = new ColorOp(clr.target, clr.r, clr.g, clr.b, clr.a);
         op.render(ctx);
         gS.cmdstack.push(op);
       });
gS.$on('toolUpdate', function(tool){ changeTool(tool); });

// HACK: for debugging
window.gS=gS;

// UNUSED, thinking about how to change color/style ops from ops altogether and
// to bind drawing state more closely into actual drawing ops...
export const getDrawState = function(){
  var Dstate = {
    params:      _.clone(gS.params),
    gridstate:   _.clone(gS.gridstate),
    ctxStyle:    _.clone(gS.ctxStyle),
    fillcolor:   _.clone(gS.fillcolor),
    strokecolor: _.clone(gS.strokecolor)
  };
  return Dstate;
};
export const setDrawState = function(Dstate){
  for(key in Object.keys(Dstate)){
    Object.assign(gS[key], Dstate[key]);
  }
};



// Canvas / Context Globals
//------------------------------------------------------------------------------
export var livecanvas = {};
export var lctx = {};
export var canvas = {};
export var ctx = {};

// rescaling ratio used by pixelFix, needed for pixel-level manipulation
export var pixelratio = 1;

// Contains Symmetries used by all other operations
//------------------------------------------------------------------------------
export var affineset = {};
export var updateSymmetry = function (newset) { affineset = newset; };


// Set up Globals and UI for calling into Drawing Tools
//------------------------------------------------------------------------------
export var drawTools = {
  line: new LineTool(),
  circle: new CircleTool(),
  pencil: new PencilTool(),
  grid: new GridTool(),
  poly: new PolyTool(),
  bezier: new PathTool()
};

var changeTool = function(toolName){
  let oldTool = drawTools[gS.params.curTool];
  if('exit' in oldTool){
    oldTool.exit();
  }
  // update global
  gS.params.curTool = toolName;
  let newTool = drawTools[toolName];
  if('enter' in newTool){
    newTool.enter();
  }
};

// alter sensitivity radius of manually canvas-rendered UI elements
var changeHitRadius = function(newR){
  for(var key of Object.keys(drawTools)){
    if(drawTools[key].hasOwnProperty("hitRadius")){
      drawTools[key].hitRadius=newR;
    }
  }
};
//window.changeHitRadius = changeHitRadius;




// Canvas Mouse/Key Events -- dispatched to active Drawing Tool
//------------------------------------------------------------------------------
var dispatchMouseDown = function(e) {
  e.preventDefault();
  drawTools[gS.params.curTool].mouseDown(e);
};

var dispatchMouseUp = function(e) {
  e.preventDefault();
  drawTools[gS.params.curTool].mouseUp(e);
};

var dispatchMouseMove = function(e) {
  e.preventDefault();
  drawTools[gS.params.curTool].mouseMove(e);
};

var dispatchMouseLeave = function(e) {
  if("mouseLeave" in drawTools[gS.params.curTool]) {
    drawTools[gS.params.curTool].mouseLeave(e);
  }
};

var dispatchKeyDown = function(e) {
  if("keyDown" in drawTools[gS.params.curTool]) {
    drawTools[gS.params.curTool].keyDown(e);
  }
};


// Command Stack
//------------------------------------------------------------------------------
/* - objectify this
   - think about adding "caching layers" of canvas contexts to speed up render
     times during redos of complicated scenes
   - figure out how to fuse context updaters, e.g. color, symmetry, etc, they
     don't need to be stacked deep in the command stack
   - when to clear out redo stack?
   - shoudn't be able to clear the context initialization ops, otherwise redos
     unstable, keep color/symm inits in place...
*/

export var commitOp = function(op, rerender=false){
  gS.cmdstack.push(op);
  op.render(ctx);
  if(rerender) {rerender(ctx);} // never do this?
};

export var rerender = function(ctx, clear=true) {
  //console.log("rerendering ", gS.cmdstack.length, " ops");
  if(clear){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  for(var cmd of gS.cmdstack){
    cmd.render(ctx);
  }
};

var undo_init_bound = 0;
var undo = function(){
  //make sure stateful drawing tool isn't left in a weird spot
  if('exit' in drawTools[gS.params.curTool]) {drawTools[gS.params.curTool].exit();}
  if(gS.cmdstack.length > undo_init_bound){
    var cmd = gS.cmdstack.pop();
    gS.redostack.push(cmd);
    rerender(ctx);
  }
};
var redo = function(){
  if(gS.redostack.length>0){
    var cmd = gS.redostack.pop();
    gS.cmdstack.push(cmd);
    rerender(ctx);
  }
};
var reset = function(){
  //make sure stateful drawing tool isn't left in a weird spot
  if('exit' in drawTools[gS.params.curTool]) {drawTools[gS.params.curTool].exit();}
  gS.cmdstack = [];
  initState();
};

document.getElementById("undo").onmousedown =
  function(e) {
    e.preventDefault();
    undo();
  };
document.getElementById("redo").onmousedown =
  function(e) {
    e.preventDefault();
    redo();
  };
document.getElementById("reset").onmousedown =
  function(e) {
    e.preventDefault();
    if(e.target.classList.contains('armed')){
      reset();
      e.target.classList.remove('armed');
      e.target.innerHTML = "reset";
    } else {
      e.target.classList.add('armed');
      e.target.innerHTML = "reset?!";
    }
  };
document.getElementById("reset").onmouseleave =
  function(e) {
    if(e.target.classList.contains('armed')){
      e.target.classList.remove('armed');
      e.target.innerHTML = "reset";
    }
  };



// Tool Selection UI
//------------------------------------------------------------------------------
import toolUi from './components/toolUI';
var vueSym = new Vue({
  el: '#toolUI',
  template: '<tool-ui :params="params" />',
  components: { toolUi },
  data: { params: gS.params }
});

// Symmetry Selection UI
//------------------------------------------------------------------------------
import symmetryUi from './components/symmetryUI';
var vueSym = new Vue({
  el: '#symUI',
  template: '<symmetry-ui :params="params" :allsyms="allsyms"/>',
  components: { symmetryUi },
  data: { params: gS.params, 'allsyms': gConstants.ALLSYMS}
});

// Grid UI
//------------------------------------------------------------------------------
import gridUi from './components/gridUI';
var vueGrid = new Vue({
  el: '#gridUI',
  template: '<grid-ui :x="x" :y="y" :d="d"/>',
  components: {gridUi},
  data: gS.gridstate
});

// Line Styling UI
//------------------------------------------------------------------------------
import styleUi from './components/styleUI';
var vueStyle = new Vue({
  el: '#styleUI',
  template: '<style-ui :lineWidth="lineWidth"/>',
  components: {styleUi},
  data: gS.ctxStyle
});

// Color UI
//------------------------------------------------------------------------------
import colorUi from './components/colorUI';
var vueColor = new Vue({
  el: '#colorUI',
  template: `<color-ui :strokeColor="strokeColor" :fillColor="fillColor"/>`,
  components: {colorUi},
  data: {strokeColor: gS.strokecolor,
         fillColor: gS.fillcolor}
});


// Set up Save SVG / Save PNG
//------------------------------------------------------------------------------
// XXX: this can take a long damn time with a complicated scene! At minimum should
// do redraws with smaller grid Nx,Ny by default or just restrict SVG export to
// tile?
var saveSVG = function() {
  // canvas2svg fake context:
  var C2Sctx = new C2S(canvas.width, canvas.height);
  rerender(C2Sctx);
  //serialize the SVG
  var mySerializedSVG = C2Sctx.getSerializedSvg(); // options?
  //save text blob as SVG
  var blob = new Blob([mySerializedSVG], {type: "image/svg+xml"});
  saveAs(blob, "eschersketch.svg");
};

// TODO : allow arbitrary upscaling of canvas pixel backing density using
//        setCanvasPixelDensity
var savePNG = function() {
  canvas.toBlobHD(blob => saveAs(blob, "eschersketch.png"));
};

// Export small, hi-res, square-tileable PNG
var savePNGTile = function(){
  const pixelScale = 4; // pixel density scaling factor

  // get square tile dimensions
  let [dX, dY] = planarSymmetries[gS.params.symstate].tile;
  dX *= gS.gridstate.d * pixelScale;
  dY *= gS.gridstate.d * pixelScale;

  // Render into tile-sized canvas for blob conversion and export
  let tileCanvas = document.createElement('canvas');
  tileCanvas.width = dX;
  tileCanvas.height = dY;
  let tctx = tileCanvas.getContext("2d");
  //correct for center off-set and pixel-scaling
  tctx.scale(pixelScale, pixelScale);
  tctx.translate(-1*gS.gridstate.x, -1*gS.gridstate.x);
  //rerender scene and export bitmap
  rerender(tctx);
  tileCanvas.toBlobHD(blob => saveAs(blob, "eschersketch_tile.png"));
  tileCanvas.remove();
};

document.getElementById("saveSVG").onmousedown = function(e) { saveSVG(); };
document.getElementById("savePNG").onmousedown = function(e) { savePNG(); };
document.getElementById("savePNGtile").onmousedown = function(e) { savePNGTile(); };

// should be "reset"
var initState = function() {
  gS.cmdstack.push(new ColorOp(
    "stroke",
    gS.strokecolor.r,
    gS.strokecolor.g,
    gS.strokecolor.b,
    gS.strokecolor.a));

  gS.cmdstack.push(new ColorOp(
    "fill",
    gS.fillcolor.r,
    gS.fillcolor.g,
    gS.fillcolor.b,
    gS.fillcolor.a));

  gS.cmdstack.push(new StyleOp({
    lineCap: "butt",
    lineJoin: "round",
    miterLimit: 10.0,
    lineWidth: 1.0}));

  gS.cmdstack.push(new SymmOp(
    gConstants.INITSYM,
    _.clone(gS.gridstate)));

  // set global undo boundary so these initial
  // settings don't get lost (needed for drawstate stability
  // during reset on redraw)
  undo_init_bound = gS.cmdstack.length;

  rerender(ctx);
};


var initGUI = function() {

  canvas = document.getElementById("sketchrender");
  canvas.width = gConstants.CANVAS_WIDTH;
  canvas.height = gConstants.CANVAS_HEIGHT;
  pixelratio = pixelFix(canvas);
  ctx = canvas.getContext("2d");

  livecanvas = document.getElementById("sketchlive");
  livecanvas.width = gConstants.CANVAS_WIDTH;
  livecanvas.height = gConstants.CANVAS_HEIGHT;
  pixelFix(livecanvas);
  lctx = livecanvas.getContext("2d");

  livecanvas.onmousedown  = dispatchMouseDown; //disable for touch
  livecanvas.onmouseup    = dispatchMouseUp;   //disable for touch
  livecanvas.onmousemove  = dispatchMouseMove; //disable for touch
  livecanvas.onmouseleave = dispatchMouseLeave;
  document.getElementsByTagName("body")[0].onkeydown = dispatchKeyDown;

  initState();

};

// This "works" for both mouse and touch events, but
// really the whole UI needs major rework for mobile...
var initTouchEvents = function() {
  // get a reference to top canvas element
  var stage = document.getElementById('sketchlive');
  // create a manager for that element
  var mc = new Hammer.Manager(stage);
  var Pan = new Hammer.Pan({
    direction: Hammer.DIRECTION_ALL,
    threshold: 1
  });
  mc.add(Pan);
  mc.on('panstart', function(e) {
    var fakeEv = {clientX: e.center.x,
                  clientY: e.center.y,
                  preventDefault: e.preventDefault};
    dispatchMouseDown(fakeEv);
  });
  mc.on('panmove', function(e) {
    var fakeEv = {clientX: e.center.x,
                  clientY: e.center.y,
                  preventDefault: e.preventDefault};
    dispatchMouseMove(fakeEv);
  });
  mc.on('panend', function(e) {
    var fakeEv = {clientX: e.center.x,
                  clientY: e.center.y,
                  preventDefault: e.preventDefault};
    dispatchMouseUp(fakeEv);
  });

  livecanvas.onmousedown  = null;
  livecanvas.onmouseup    = null;
  livecanvas.onmousemove  = null;

  changeHitRadius(15);
};
window.initTouchEvents = initTouchEvents;


// Finally, Initialize the UI
//------------------------------------------------------------------------------
initGUI();

// Crappy Mobile Detection
//------------------------------------------------------------------------------
if (Modernizr.touchevents) {
  initTouchEvents();
}
