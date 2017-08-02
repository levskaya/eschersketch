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
import Pressure from 'pressure';
import {Chrome} from 'vue-color';
import {saveAs} from 'file-saver';

import {pixelFix, setCanvasPixelDensity} from './canvas_utils';
import {generateTiling, planarSymmetries, RosetteGroup, IdentitySet} from './symmetryGenerator';


// Import all the Drawing Tools
//------------------------------------------------------------------------------
import {GridTool}     from './symmetryOps';
import {LineTool, LineOp}     from './lineTool';
import {PencilTool, PencilOp}   from './pencilTool';
import {PolyTool, PolyOp}     from './polyTool';
import {PathTool, PathOp}     from './pathTool';
import {CircleTool, CircleOp}   from './circleTool';


// Global "Constants"
//------------------------------------------------------------------------------
export const gCONSTS = {
  CANVAS_WIDTH:     1600, //XXX: not necessarily constant!
  CANVAS_HEIGHT:    1200, //XXX: not necessarily constant!
  MIN_LINEWIDTH:    0.1,
  MAX_LINEWIDTH:    10,
  DELTA_LINEWIDTH:  0.1,
  GRIDNX:           18,   //XXX: not necessarily constant!
  GRIDNY:           14,   //XXX: not necessarily constant!
  INITSYM:          'p6m',
  // All Symmetries made available
  ALLSYMS:          ['p1','diagonalgrid','pm','cm','pg',       //rot-free
                     'pmg','pgg','pmm','p2','cmm',             //180deg containing
                     'p4', 'p4g', 'p4m',                       //square
                     'hexgrid','p3','p6','p31m','p3m1','p6m'], //hex
  //ctx state to store inside draw ops
  CTXPROPS:          ['fillStyle', 'strokeStyle', 'lineCap', 'lineJoin', 'miterLimit', 'lineWidth']
};

const tilingSyms = ['p1','diagonalgrid','pm','cm','pg',       //rot-free
                   'pmg','pgg','pmm','p2','cmm',             //180deg containing
                   'p4', 'p4g', 'p4m',                       //square
                   'hexgrid','p3','p6','p31m','p3m1','p6m'];
const rosetteSyms = ['rosette'];

// gS = global State
// holds the UI state as well as acting as top-level event bus
// should eventually port to vuex
//------------------------------------------------------------------------------
export const gS = new Vue({
  data: {
    // stupid hack, since Vue can't wrap atomics, have all simple atomic
    // state parameters in here, mutating params then induces reactivity
    // waaa... am I smoking crack? this shouldn't be necessary, or?
    params: {
      curTool: 'pencil',                 // Tool State
      showUI: true
    },
    // grid Nx, Ny should NOT be too large, should clamp.
    symmState: {sym: gCONSTS.INITSYM,
                x:800, y:400,
                d:100, t:0,
                Nx:18, Ny:14,
                Nrot: 3, Nref: 2, rot: 0},

    // Style State
    //-------------------------------
    ctxStyle: {
      lineCap:     "butt", // butt, round, square
      lineJoin:    "round", // round, bevel, miter
      miterLimit:  10.0, // applies to miter setting above
      lineWidth:   1.0,
      fillStyle:   "rgba(200, 100, 100, 0)",
      strokeStyle: "rgba(100, 100, 100, 1.0)"
    },
    // Global Command and Redo Stacks
    //-------------------------------
    cmdstack: [], //<-- needed in here?
    redostack: [],
  }
});

// Global Events
//------------------------------------------------------------------------------
gS.$on('symmUpdate',
       function(gridSetting) {
         _.assign(gS.symmState, gridSetting);
         updateSymmetry(gS.symmState);
         //HACK: if the gridtool is active, update canvas if the grid ui is altered
         if(gS.params.curTool=="grid"){ drawTools["grid"].enter(); }
         drawTools[gS.params.curTool].liverender();
       });
gS.$on('styleUpdate',
       function(styles) {
         _.assign(lctx, _.clone(styles));
         _.assign(gS.ctxStyle, _.clone(styles));
         drawTools[gS.params.curTool].liverender();
       });
gS.$on('colorUpdate',
       function(clr) {
         if(clr.target == "stroke") {
           lctx.strokeStyle = "rgba("+clr.r+","+clr.g+","+clr.b+","+clr.a+")";
         } else {
           lctx.fillStyle = "rgba("+clr.r+","+clr.g+","+clr.b+","+clr.a+")";
         }
         drawTools[gS.params.curTool].liverender();
       });
gS.$on('toolUpdate',
       function(tool){
         changeTool(tool);
       });
gS.$on('undo', function(){ undo(); });
gS.$on('redo', function(){ redo(); });
gS.$on('reset', function(){ reset(); });
gS.$on('toggleUI', function(){  // HACK: until everything wrapped by vue
  if(gS.params.showUI){
    gS.params.showUI = false;
    document.getElementById("controls").style.display="none";
  } else {
    gS.params.showUI = true;
    document.getElementById("controls").style.display="block";
  }
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
//window.affineset = affineset; //HACK: debugging
const memo_generateTiling = _.memoize(generateTiling,
                                function(){return JSON.stringify(arguments);});
export const updateSymmetry = function(symmState) {
  if(symmState.sym == "none"){
    affineset = IdentitySet();
  }
  else if(tilingSyms.includes(symmState.sym)) {
    affineset = memo_generateTiling(planarSymmetries[symmState.sym],
                                    symmState.Nx,symmState.Ny,
                                    symmState.d, symmState.t,
                                    symmState.x, symmState.y);
  }
  else { //HACK: quick and dirty, fix the call structure to be clean interface
    affineset = RosetteGroup(symmState.Nrot,
                            symmState.Nref,
                            symmState.x,
                            symmState.y,
                            symmState.rot/180.0*Math.PI);
  }
};


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
//window.drawTools = drawTools; //HACK: debugging

var changeTool = function(toolName){
  let oldTool = drawTools[gS.params.curTool];
  oldTool.commit(); //XXX: good?
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
   - when to clear out redo stack?
*/
var undo_init_bound = 0;

export var rerender = function(ctx, clear=true) {
  //console.log("rerendering ", gS.cmdstack.length, " ops");
  if(clear){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  for(var cmd of gS.cmdstack){
    cmd.render(ctx);
  }
};

export var commitOp = function(op){
  gS.cmdstack.push(op);
  op.render(ctx);
};
window.commitOp=commitOp; //HACK

//only used for undo/redo
var switchTool = function(toolName, op){
  let oldTool = drawTools[gS.params.curTool];
  if('exit' in oldTool){ oldTool.exit();  }
  // update global
  gS.params.curTool = toolName;
  let newTool = drawTools[toolName];
  if('enter' in newTool){ newTool.enter(op); }
};

var undo = function(){
  console.log("undo cmdstack", gS.cmdstack.length, "redostack", gS.redostack.length);
  if(gS.cmdstack.length > undo_init_bound){
    drawTools[gS.params.curTool].commit();  //commit live tool op
    let cmd = gS.cmdstack.pop(); //now remove it
    gS.redostack.push(cmd);
    if(gS.cmdstack.length>0){
      let cmd2 = gS.cmdstack.pop(); //get last op
      rerender(ctx); //rebuild history
      switchTool(cmd2.tool, cmd2); //enter()s and exit()s
    } else {
      drawTools[gS.params.curTool].exit();
      rerender(ctx); //rebuild history
      lctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  } else {
      drawTools[gS.params.curTool].exit();
      lctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  console.log("undo cmdstack", gS.cmdstack.length, "redostack", gS.redostack.length);
};

var redo = function(){
  console.log("redo cmdstack", gS.cmdstack.length, "redostack", gS.redostack.length);
  if(gS.redostack.length>0){
    drawTools[gS.params.curTool].commit();  //commit live tool op
    let cmd = gS.redostack.pop();
    rerender(ctx);
    switchTool(cmd.tool, cmd); //enter()s and exit()s
  }
};

var reset = function(){
  //make sure stateful drawing tool isn't left in a weird spot
  if('exit' in drawTools[gS.params.curTool]) {drawTools[gS.params.curTool].exit();}
  gS.redostack = [];
  gS.cmdstack = [];
  lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
  initState();
};

var serialize = function(){
  let jsonStr = JSON.stringify(gS.cmdstack);
  return jsonStr;
}

const opsTable = {line: LineOp,
                  pencil: PencilOp,
                  circle: CircleOp,
                  bezier: PathOp,
                  poly: PolyOp};

var ressurectOp = function(deadOp){
    let op = new opsTable[deadOp.tool];
    return _.assign(op, deadOp)
}

var deserialize = function(jsonStr){
  reset();
  let deadArr = JSON.parse(jsonStr);
  let newstack = [];
  for(let obj of deadArr){
    newstack.push(ressurectOp(obj));
  }
  gS.cmdstack = newstack;
  rerender(ctx);
}
window.serialize=serialize; //HACK
window.deserialize=deserialize; //HACK


// Top State Control UI
//------------------------------------------------------------------------------
import stateUi from './components/stateUI';
var vueSym = new Vue({
  el: '#stateUI',
  template: '<state-ui :showUI="showUI"/>',
  components: { stateUi },
  data: gS.params//{params: gS.params}
});

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
  template: '<symmetry-ui :sym="sym"/>',
  components: { symmetryUi },
  data: gS.symmState
});

// Grid UI
//------------------------------------------------------------------------------
import gridUi from './components/gridUI';
var vueGrid = new Vue({
  el: '#gridUI',
  template: '<grid-ui :x="x" :y="y" :d="d"/>',
  components: {gridUi},
  data: gS.symmState
});

// Rosette UI
//------------------------------------------------------------------------------
import rosetteUi from './components/rosetteUI';
var vueRosette = new Vue({
  el: '#rosetteUI',
  template: '<rosette-ui :Nrot="Nrot" :Nref="Nref" :rot="rot"/>',
  components: {rosetteUi},
  data: gS.symmState
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

var parseColor = function(clrstr){
  if(/^#/.test(clrstr)){
    clrstr = clrstr.slice(1);
    var digit = clrstr.split("");
    if(digit.length === 3){
      digit = [ digit[0],digit[0],digit[1],digit[1],digit[2],digit[2] ]
    }
    var r = parseInt( [digit[0],digit[1] ].join(""), 16 );
    var g = parseInt( [digit[2],digit[3] ].join(""), 16 );
    var b = parseInt( [digit[4],digit[5] ].join(""), 16 );
    return [r,g,b,1.0];
  } else{
    let tmp = clrstr.substring(5, clrstr.length-1).replace(/ /g, '').split(',');
    return [parseInt(tmp[0]),parseInt(tmp[1]),parseInt(tmp[2]),parseFloat(tmp[3])];
  }
}

// Color UI
//------------------------------------------------------------------------------
import colorUi from './components/colorUI';
var vueColor = new Vue({
  el: '#colorUI',
  template: `<color-ui :strokeColor="strokeColor" :fillColor="fillColor"/>`,
  components: {colorUi},
  /*data: {strokeColor: gS.strokecolor,
         fillColor: gS.fillcolor},
         */
  computed: { strokeColor:
      function(){
        let tmp = [].concat(parseColor(gS.ctxStyle.strokeStyle));
        //console.log('ui-strokeColor', tmp);
        return {r:tmp[0], g:tmp[1], b:tmp[2], a:tmp[3]};
      },
      fillColor:
      function(){
        let tmp = [].concat(parseColor(gS.ctxStyle.fillStyle));
        //console.log('ui-fillColor ',tmp);
        return {r:tmp[0], g:tmp[1], b:tmp[2], a:tmp[3]};
      }
  }
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

var saveJSON = function() {
  let sketchdata = serialize();
  var blob = new Blob([sketchdata], {type: "application/json"});
  saveAs(blob, "eschersketch.json");
}
window.saveJSON=saveJSON;

document.getElementById("save-json").onmousedown = function() {
  saveJSON();
};

document.getElementById("the-file-input").onchange = function() {
    renderImage(this.files[0]);
};
function renderImage(file) {
  var reader = new FileReader();
  reader.onload = function(event) {
    deserialize(event.target.result);
  }
  reader.readAsText(file);
}

var saveSVGTile = function() {
  // get square tile dimensions
  let [dX, dY] = planarSymmetries[gS.symmState.sym].tile;
  dX *= gS.symmState.d;
  dY *= gS.symmState.d;

  // canvas2svg fake context:
  var C2Sctx = new C2S(dX, dY);
  //correct for center off-set and pixel-scaling
  //tctx.scale(pixelScale, pixelScale);
  C2Sctx.translate(-1*gS.symmState.x, -1*gS.symmState.y);
  /*C2Sctx.beginPath();
  C2Sctx.moveTo(gS.symmState.x, gS.symmState.y);
  C2Sctx.lineTo(gS.symmState.x+dX, gS.symmState.y);
  C2Sctx.lineTo(gS.symmState.x+dX, gS.symmState.y+dY);
  C2Sctx.lineTo(gS.symmState.x, gS.symmState.y+dY);
  C2Sctx.closePath();
  C2Sctx.clip();*/
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
  let [dX, dY] = planarSymmetries[gS.symmState.sym].tile;
  dX *= gS.symmState.d * pixelScale;
  dY *= gS.symmState.d * pixelScale;

  // Render into tile-sized canvas for blob conversion and export
  let tileCanvas = document.createElement('canvas');
  tileCanvas.width = dX;
  tileCanvas.height = dY;
  let tctx = tileCanvas.getContext("2d");
  //correct for center off-set and pixel-scaling
  tctx.scale(pixelScale, pixelScale);
  tctx.translate(-1*gS.symmState.x, -1*gS.symmState.x);
  //rerender scene and export bitmap
  rerender(tctx);
  tileCanvas.toBlobHD(blob => saveAs(blob, "eschersketch_tile.png"));
  tileCanvas.remove();
};

document.getElementById("saveSVG").onmousedown = function(e) { saveSVG(); };
document.getElementById("savePNG").onmousedown = function(e) { savePNG(); };
document.getElementById("savePNGtile").onmousedown = function(e) { savePNGTile(); };
//document.getElementById("saveSVGtile").onmousedown = function(e) { saveSVGTile(); };


// should be "reset"
var initState = function() {
  let initStyle = {
    lineCap: "butt",
    lineJoin: "round",
    miterLimit: 10.0,
    lineWidth: 1.0,
    strokeStyle: "rgba(100,100,100,1.0)",
    fillStyle: "rgba(200,100,100,0.5)"
  };
  _.assign(lctx, initStyle);
  _.assign(gS.ctxStyle, initStyle);

  updateSymmetry(_.clone(gS.symmState));
  undo_init_bound = gS.cmdstack.length;
  rerender(ctx);
};


var initGUI = function() {

  // set up symmetry grid based on screen size
  var w = window.innerWidth;
  var h = window.innerHeight;
  console.log("window innerDims ", w, h);
  gCONSTS.CANVAS_WIDTH = w;
  gCONSTS.CANVAS_HEIGHT = h;
  gS.symmState.x = Math.round(w/2);
  gS.symmState.y = Math.round(h/2);
  gS.symmState.Nx = Math.round((w / gS.symmState.d)*2);
  gS.symmState.Ny = Math.round((h / gS.symmState.d)*2);
  console.log("grid Nx,Ny ",gS.symmState.Nx, gS.symmState.Ny);

  canvas = document.getElementById("sketchrender");
  canvas.width = gCONSTS.CANVAS_WIDTH;
  canvas.height = gCONSTS.CANVAS_HEIGHT;
  pixelratio = pixelFix(canvas);
  ctx = canvas.getContext("2d");

  livecanvas = document.getElementById("sketchlive");
  livecanvas.width = gCONSTS.CANVAS_WIDTH;
  livecanvas.height = gCONSTS.CANVAS_HEIGHT;
  pixelFix(livecanvas);
  lctx = livecanvas.getContext("2d");
  window.lctx = lctx;//HACK

  livecanvas.onmousedown  = dispatchMouseDown; //disable for touch
  livecanvas.onmouseup    = dispatchMouseUp;   //disable for touch
  livecanvas.onmousemove  = dispatchMouseMove; //disable for touch
  livecanvas.onmouseleave = dispatchMouseLeave;//disable for touch
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
    threshold: 0
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

  // disable mouse-event handlers to prevent interference
  livecanvas.onmousedown  = null;
  livecanvas.onmouseup    = null;
  livecanvas.onmousemove  = null;
  livecanvas.onmouseleave = null;

  //XXX: should scale w. screen size, too big on tablets I suspect
  changeHitRadius(15);
};
//window.initTouchEvents = initTouchEvents;

/* // This Works! -------------------------------------------------------------
export var pressure;
// Pressure.js
Pressure.set('#sketchlive', {
  change: function(force, event){
    //console.log("force", force);
    pressure = force;
  },
  //unsupported: function(){
  //  console.log("nopressure");
  //}
}, {polyfill: false});
*/

// Finally, Initialize the UI
//------------------------------------------------------------------------------
initGUI();

// Crappy Mobile Detection
//------------------------------------------------------------------------------
if (Modernizr.touchevents) {
  initTouchEvents();
}
