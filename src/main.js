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
import {Chrome} from 'vue-color';
import {saveAs} from 'file-saver';
import {generateTiling, generateLattice, planarSymmetries} from './geo';

import {pixelFix, setCanvasPixelDensity} from './canvas_utils';
//import {l2norm,l2dist,sub2,add2,scalar2,normalize,reflectPoint} from './math_utils';


// Global Constants
//------------------------------------------------------------------------------

export const gConstants = {
  CANVAS_WIDTH:     1600,
  CANVAS_HEIGHT:    1200,
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


// gS = global State, holds the UI state
// as well as acting as top-level event bus
export const gS = new Vue({
  data: {
    // Symmetry State
    //-------------------------------
    symstate: {sym: gConstants.INITSYM},
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
gS.$on('rerender', function() { rerender(ctx); });
gS.$on('symmUpdate',
       function(symName, gridSetting) {
         gS.cmdstack.push(new SymmOp(symName, _.clone(gridSetting)));
         rerender(ctx);
       });
gS.$on('styleUpdate',
       function(updateDict) {
         gS.cmdstack.push(new StyleOp(_.clone(updateDict)));
         rerender(ctx);
       });
gS.$on('colorUpdate',
       function(clr) {
         gS.cmdstack.push(new ColorOp(clr.target, clr.r, clr.g, clr.b, clr.a));
         rerender(ctx);
       });

// HACK: for debugging
window.gS=gS;


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


// Import all the Drawing Ops and Tools and wire them up
//------------------------------------------------------------------------------

import {ColorOp, StyleOp} from './styleOps';
import {SymmOp, GridTool} from './symmetryOps';
import {LineOp, LineTool} from './lineTool';
import {PencilOp, PencilTool} from './pencilTool';
import {PolyOp, PolyTool} from './polyTool';
import {PathOp, PathTool} from './pathTool';
import {CircleOp, CircleTool} from './circleTool';


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

export var curTool = "line";

var changeTool = function(toolName){
  let oldTool = drawTools[curTool];
  if('exit' in oldTool){
    oldTool.exit();
  }
  // update global
  curTool = toolName;
  let newTool = drawTools[toolName];
  if('enter' in newTool){
    newTool.enter();
  }
};

// Mouse Events -- dispatched to active Drawing Tool
//------------------------------------------------------------------------------
var dispatchMouseDown = function(e) {
  e.preventDefault();
  drawTools[curTool].mouseDown(e);
};

var dispatchMouseUp = function(e) {
  e.preventDefault();
  drawTools[curTool].mouseUp(e);
};

var dispatchMouseMove = function(e) {
  e.preventDefault();
  drawTools[curTool].mouseMove(e);
};

var dispatchMouseLeave = function(e) {
  if("mouseLeave" in drawTools[curTool]) {
    drawTools[curTool].mouseLeave(e);
  }
};

var dispatchKeyDown = function(e) {
  if("keyDown" in drawTools[curTool]) {
    drawTools[curTool].keyDown(e);
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

export var commitOp = function(op){
  gS.cmdstack.push(op);
  rerender(ctx);
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
  if('exit' in drawTools[curTool]) {drawTools[curTool].exit();}
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
  if('exit' in drawTools[curTool]) {drawTools[curTool].exit();}
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



//HACK : need to vueify the rest of the UI...
var exclusiveClassToggle = function(target, className){
  let _els = document.getElementsByClassName(className);
  for(let _el of _els){
    _el.classList.remove(className);
  }
  target.classList.add(className);
};

// tmp: directly link selectors to changeTool
document.getElementById("linetool").onmousedown   = function(e) {
  exclusiveClassToggle(e.target, "tool-selected");
  changeTool("line"); };
document.getElementById("circletool").onmousedown = function(e) {
  exclusiveClassToggle(e.target, "tool-selected");
  changeTool("circle"); };
document.getElementById("penciltool").onmousedown = function(e) {
  exclusiveClassToggle(e.target, "tool-selected");
  changeTool("pencil"); };
document.getElementById("showgrid").onmousedown   = function(e) {
  exclusiveClassToggle(e.target, "tool-selected");
  changeTool("grid"); };
document.getElementById("polytool").onmousedown   = function(e) {
  exclusiveClassToggle(e.target, "tool-selected");
  changeTool("poly"); };
document.getElementById("beziertool").onmousedown   = function(e) {
  exclusiveClassToggle(e.target, "tool-selected");
  changeTool("bezier"); };



// Symmetry Selection UI
//------------------------------------------------------------------------------
import symmetryUi from './components/symmetryUI';
var vueSym = new Vue({
  el: '#symUI',
  template: '<symmetry-ui :selected="selected" :allsyms="allsyms"/>',
  components: { symmetryUi },
  data: { selected: gS.symstate , 'allsyms': gConstants.ALLSYMS}
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
  template: '<color-ui :strokeColor="strokeColor" :fillColor="fillColor"/>',
  components: {colorUi},
  data: {strokeColor: gS.strokecolor,
         fillColor: gS.fillcolor}
});





// Set up Save SVG / Save PNG
//------------------------------------------------------------------------------
// XXX: this can take a long damn time with a complicated scene! At minimum should
// do redraws with smaller grid Nx,Ny by default or just restrict SVG export to
// tile?
document.getElementById("saveSVG").onmousedown = function(e) {
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
document.getElementById("savePNG").onmousedown = function(e) {
    canvas.toBlob(blob => saveAs(blob, "eschersketch.png"));
};



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
  undo_init_bound = 4;

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

  livecanvas.onmousedown  = dispatchMouseDown;
  livecanvas.onmouseup    = dispatchMouseUp;
  livecanvas.onmousemove  = dispatchMouseMove;
  livecanvas.onmouseleave = dispatchMouseLeave;
  document.getElementsByTagName("body")[0].onkeydown = dispatchKeyDown;

  initState();

};

initGUI();
