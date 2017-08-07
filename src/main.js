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

import {deepClone} from './utils';
import {pixelFix, setCanvasPixelDensity, parseColor} from './canvas_utils';
import {generateTiling, planarSymmetries, RosetteGroup, IdentitySet} from './symmetryGenerator';


// Import all the Drawing Tools
//------------------------------------------------------------------------------
import {GridTool}     from './gridTool';
import {LineTool, LineOp}     from './lineTool';
import {PencilTool, PencilOp}   from './pencilTool';
import {PolyTool, PolyOp}     from './polyTool';
import {PathTool, PathOp}     from './pathTool';
import {CircleTool, CircleOp}   from './circleTool';


// gS = global State
// holds the UI state as well as acting as top-level event bus
// should eventually port to vuex
//------------------------------------------------------------------------------
export const gS = new Vue({
  data: {
    // random global UI state variables
    params: {
      curTool: 'pencil',         // Tool State
      fullUI: true,
      showNav: true,
      showTool: true,
      showColor: true,
      showLine: true,
      showSymm: true,
      showFile: true,
      showHelp: false,
      showConfig: false,
      showHints: false,           //contextual help, still janky...
      hintText: "",
      canvasHeight: 1200,
      canvasWidth:  1600,
      filename: "eschersketch",
      versionString: "v0.3",      //Eschersketch version
    },
    options: {
      minLineWidth: 0.1,
      deltaLineWidth: 0.1,
      maxLineWidth: 10,
      dynamicGridSize: true,      // recalculate grid Nx,Ny on grid delta change
      maxGridNx: 50,
      maxGridNy: 50,
      pngTileUpsample: 4,
      //pngUpsample: 2,    //TODO: implement complete redraw for whole frame PNG export
      //pngGridNx: 20,
      //pngGridNy: 20,
      svgGridNx: 10,
      svgGridNy: 10,
    },
    // Symmetry State - captured
    //-------------------------------
    // -- each drawing op caches the current value of these params when committed
    symmState: {sym: 'p6m',    // symmetry name/key
                x:800, y:400,  // center of constructed grid symmetry
                d:100, t:0,    // grid-spacing and rotation (not implemented yet)
                Nx:18, Ny:14,  // grid Nx, Ny should NOT be too large - too large --> too many draw calls!
                Nrot: 0, Nref: 3, rot: 0 // Rosette parameters
              },
    // Style State
    //-------------------------------
    // -- the keys of this object also determine which canvas ctx properties are cached inside drawing ops
    ctxStyle: {
      lineCap:     "butt",  // butt, round, square
      lineJoin:    "round", // round, bevel, miter
      miterLimit:  10.0,    // applies to miter setting above
      lineWidth:   1.0,
      fillStyle:   "rgba(200, 100, 100, 0.5)",
      strokeStyle: "rgba(100, 100, 100, 1.0)"
    },
    //....
    //cmdstack: [],
    //redostack: [],
  }
});

// Global Command and Redo Stacks
//-------------------------------
var cmdStack = [];
var redoStack = [];
window.cmdStack=cmdStack; //HACK

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
//window.currentAffine = () => affineset; //HACK: debugging


// Global indices into Instantiated Tools and their Ops
//------------------------------------------------------------------------------
export const drawTools = {
  line: new LineTool(),
  circle: new CircleTool(),
  pencil: new PencilTool(),
  grid: new GridTool(), //not a drawing tool
  poly: new PolyTool(),
  path: new PathTool()
};
//window.drawTools = drawTools; //HACK: debugging

const opsTable = {
  line: LineOp,
  pencil: PencilOp,
  circle: CircleOp,
  path: PathOp,
  poly: PolyOp
};


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
gS.$on('optionsUpdate', function(name, val){ gS.options[name] = val; });
gS.$on('paramsUpdate', function(name, val){ gS.params[name] = val;});
gS.$on('setHint', function(val){
  if(gS.params.showHints) { gS.params.hintText = val; }
});

gS.$on('undo', function(){ undo(); });
gS.$on('redo', function(){ redo(); });
gS.$on('reset', function(){ reset(); });

// Pure UI Events
//------------------------------------------------------------------------------------------
gS.$on('toggleUI', function() {
  //console.log("toggleUI");
  if(gS.params.fullUI){
    document.getElementById("sketch-UI").classList.remove("max-UI");
    document.getElementById("sketch-UI").classList.add("min-UI");
    gS.params.fullUI = false;
    gS.params.showTool = false;
    gS.params.showColor = false;
    gS.params.showLine = false;
    gS.params.showSymm = false;
    gS.params.showFile = false;
  } else {
    document.getElementById("sketch-UI").classList.remove("min-UI");
    document.getElementById("sketch-UI").classList.add("max-UI");
    gS.params.fullUI = true;
    gS.params.showTool = true;
    gS.params.showColor = true;
    gS.params.showLine = true;
    gS.params.showSymm = true;
    gS.params.showFile = true;
  }});
gS.$on('help', function(){ gS.params.showHelp = ! gS.params.showHelp;});
gS.$on('config', function(){ gS.params.showConfig = ! gS.params.showConfig; });
gS.$on('toggleParam', function(paramName) { gS.params[paramName] = ! gS.params[paramName] });

window.gS=gS;  // HACK: for debugging


// Symmetry Functions
//-------------------------------------------------------------------------------------------------

const memo_generateTiling = _.memoize(generateTiling,
                                function(){return JSON.stringify(arguments);});

//HACK: quick and dirty, fix the call structure to be clean interface
export const updateSymmetry = function(symmState) {

  if(gS.options.dynamicGridSize) {
    let newNx = Math.round((gS.params.canvasWidth  / gS.symmState.d)*2);
    let newNy = Math.round((gS.params.canvasHeight / gS.symmState.d)*2);
    // basic safety so as not to grind CPU to a halt...
    gS.symmState.Nx = newNx < gS.options.maxGridNx ? newNx : gS.options.maxGridNx;
    gS.symmState.Ny = newNy < gS.options.maxGridNy ? newNy : gS.options.maxGridNy;
    console.log("grid Nx", gS.symmState.Nx, "Ny", gS.symmState.Ny);
  }

  if(symmState.sym == "none"){
    affineset = IdentitySet();
  }
  else if(Object.keys(planarSymmetries).includes(symmState.sym)) {
    affineset = memo_generateTiling(planarSymmetries[symmState.sym],
                                    symmState.Nx,symmState.Ny,
                                    symmState.d, symmState.t,
                                    symmState.x, symmState.y);
  }
  else {
    affineset = RosetteGroup(symmState.Nrot,
                            symmState.Nref,
                            symmState.x,
                            symmState.y,
                            symmState.rot/180.0*Math.PI);
  }
};


// Set up Globals and UI for calling into Drawing Tools
//------------------------------------------------------------------------------
const changeTool = function(toolName){
  let oldTool = drawTools[gS.params.curTool];
  oldTool.commit();
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
const changeHitRadius = function(newR){
  for(var key of Object.keys(drawTools)){
    if(drawTools[key].hasOwnProperty("hitRadius")){
      drawTools[key].hitRadius=newR;
    }
  }
};
//window.changeHitRadius = changeHitRadius;



// Canvas Mouse/Key Events -- dispatched to active Drawing Tool
//------------------------------------------------------------------------------
const dispatchMouseDown = function(e) {
  e.preventDefault();
  drawTools[gS.params.curTool].mouseDown(e);
};

const dispatchMouseUp = function(e) {
  e.preventDefault();
  drawTools[gS.params.curTool].mouseUp(e);
};

const dispatchMouseMove = function(e) {
  e.preventDefault();
  drawTools[gS.params.curTool].mouseMove(e);
};

const dispatchMouseLeave = function(e) {
  if("mouseLeave" in drawTools[gS.params.curTool]) {
    drawTools[gS.params.curTool].mouseLeave(e);
  }
};

const dispatchKeyDown = function(e) {
  if("keyDown" in drawTools[gS.params.curTool]) {
    drawTools[gS.params.curTool].keyDown(e);
  }
};

const dispatchKeyUp = function(e) {
  if("keyUp" in drawTools[gS.params.curTool]) {
    drawTools[gS.params.curTool].keyUp(e);
  }
};

window.addEventListener('orientationchange', function(){
  console.log("orientation change");
  onResize();
});
window.addEventListener('resize', function(){
    console.log("resize");
    onResize();
  });


// Command Stack
//------------------------------------------------------------------------------
/* - objectify this
   - think about adding "caching layers" of canvas contexts to speed up render
     times during redos of complicated scenes
   - when to clear out redo stack?
*/

export const rerender = function(ctx, {clear=true, modifier=null}={}) {
  if(clear){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  // Allow passing in modifier of op state
  // modifier can return a single op or a new array of ops
  if(modifier){
    for(let cmd of cmdStack){
      let modcmd = modifier(cmd);
      if(_.isArray(modcmd)){
          for(let subcmd of modcmd){
            subcmd.render(ctx);
          }
      } else {
        modcmd.render(ctx);
      }
    }
  // no modifier, just step through ops and render each
  } else {
    for(let cmd of cmdStack){
      cmd.render(ctx);
    }
  }
};

export const commitOp = function(op){
  cmdStack.push(op);
  op.render(ctx);
};
//window.commitOp=commitOp; //HACK

//only used for undo/redo
const switchTool = function(toolName, op){
  let oldTool = drawTools[gS.params.curTool];
  if('exit' in oldTool){ oldTool.exit();  }
  // update global
  gS.params.curTool = toolName;
  let newTool = drawTools[toolName];
  if('enter' in newTool){ newTool.enter(op); }
};

const undo = function(){
  //console.log("undo cmdstack", cmdStack.length, "redostack", redoStack.length);
  drawTools[gS.params.curTool].commit();  //commit live tool op
  let cmd = cmdStack.pop(); //now remove it
  if(cmd){ // if at first step with INIT tool, may not have anything, abort!
    redoStack.push(cmd);
    if(cmdStack.length>0){
      let cmd2 = cmdStack.pop(); //get last op
      rerender(ctx); //rebuild history
      switchTool(cmd2.tool, cmd2); //enter()s and exit()s
    } else {
      drawTools[gS.params.curTool].exit();
      rerender(ctx); //rebuild history
      lctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  //console.log("undo cmdstack len=", cmdStack.length, "redostack len=", redoStack.length);
};

const redo = function(){
  //console.log("redo cmdstack", cmdStack.length, "redostack", redoStack.length);
  if(redoStack.length>0){
    drawTools[gS.params.curTool].commit();  //commit live tool op
    let cmd = redoStack.pop();
    rerender(ctx);
    switchTool(cmd.tool, cmd); //enter()s and exit()s
  }
};

const reset = function(){
  //make sure stateful drawing tool isn't left in a weird spot
  if('exit' in drawTools[gS.params.curTool]) {drawTools[gS.params.curTool].exit();}
  redoStack = [];
  cmdStack = [];
  lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
  initState();
};

const serialize = function(){
  let saveObj = {
    name: gS.params.filename,
    version: getESVersion(),
    data: cmdStack
  }
  //let jsonStr = JSON.stringify(cmdStack);
  let jsonStr = JSON.stringify(saveObj);
  return jsonStr;
}

const ressurectOp = function(deadOp){
    let op = new opsTable[deadOp.tool];
    return _.assign(op, deadOp)
}

const deserialize = function(jsonStr){
  reset();
  let loadObj = JSON.parse(jsonStr);
  gS.params.filename = loadObj.name;
  console.log("loading ES file from version", loadObj.version);
  let newstack = [];
  for(let obj of loadObj.data){
    newstack.push(ressurectOp(obj));
  }
  cmdStack = newstack;
  rerender(ctx);
}


// Set up Save of Scene to JSON and Restore
//------------------------------------------------------------------------------
export const saveJSON = function() {
  let sketchdata = serialize();
  var blob = new Blob([sketchdata], {type: "application/json"});
  saveAs(blob, gS.params.filename + ".json");
}

export const loadJSON = function(file) {
  var reader = new FileReader();
  reader.onload = function(event) {
    deserialize(event.target.result);
  }
  reader.readAsText(file);
}

// Set up Save SVG / Save PNG
//------------------------------------------------------------------------------
// XXX: this can take a long damn time with a complicated scene!
export const saveSVG = function() {
  // canvas2svg fake context:
  var C2Sctx = new C2S(canvas.width, canvas.height);
  // prevent recursion stack limit by constraining number of repeats exported
  let gridLimiter = function(op) {
    let newop = ressurectOp(deepClone(op));
    newop.symmState.Nx = gS.options.svgGridNx;
    newop.symmState.Ny = gS.options.svgGridNy;
    return newop;
  }
  rerender(C2Sctx, {modifier: gridLimiter});
  //serialize the SVG
  var mySerializedSVG = C2Sctx.getSerializedSvg(); // options?
  //save text blob as SVG
  var blob = new Blob([mySerializedSVG], {type: "image/svg+xml"});
  saveAs(blob, gS.params.filename + ".svg");
};

export const saveSVGTile = function() {
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

  // prevent recursion stack limit by constraining number of repeats exported
  let gridLimiter = function(op) {
    let newop = ressurectOp(deepClone(op));
    newop.symmState.Nx = gS.options.svgGridNx;
    newop.symmState.Ny = gS.options.svgGridNy;
    return newop;
  }
  rerender(C2Sctx, modifier=gridLimiter);
  //serialize the SVG
  var mySerializedSVG = C2Sctx.getSerializedSvg(); // options?
  //save text blob as SVG
  var blob = new Blob([mySerializedSVG], {type: "image/svg+xml"});
  saveAs(blob, gS.params.filename + ".svg");
};

// TODO : allow arbitrary upscaling of canvas pixel backing density using
//        setCanvasPixelDensity
export const savePNG = function() {
  canvas.toBlobHD(blob => saveAs(blob, gS.params.filename + ".png"));
};


// Makes transparent fill objects look cleaner by rendering fills first then strokes
const cleanLinesModifier = function(op){
    let strokeOp = ressurectOp(deepClone(op));
    let fillOp = ressurectOp(deepClone(op));
    fillOp.ctxStyle.strokeStyle = "rgba(0,0,0,0.0)"
    strokeOp.ctxStyle.fillStyle = "rgba(0,0,0,0.0)"
    return [fillOp, strokeOp];
}

// Export small, hi-res, square-tileable PNG
export const savePNGTile = function(){
  const pixelScale = gS.options.pngTileUpsample; // pixel density scaling factor

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
  //rerender(tctx, {modifier: cleanLinesModifier}); //XXX: very clean effect!
  rerender(tctx);
  tileCanvas.toBlobHD(blob => saveAs(blob, gS.params.filename + "_tile.png"));
  tileCanvas.remove();
};



// Top State Control UI
//------------------------------------------------------------------------------
import stateUi from './components/stateUI';
var vueSym = new Vue({
  el: '#stateUI',
  template: '<state-ui :params="params"/>',
  components: { stateUi },
  data: {params: gS.params}
});


import navPanel from './components/navPanel';
var vueSym = new Vue({
  el: '#navPanel',
  template: '<nav-panel :params="params"/>',
  components: { navPanel },
  data: {params: gS.params}
});

import hintPanel from './components/hintPanel';
var vueSym = new Vue({
  el: '#hintPanel',
  template: '<hint-panel :params="params"/>',
  components: { hintPanel },
  data: {params: gS.params}
});


// Config UI
//------------------------------------------------------------------------------
import configUi from './components/configUI';
var vueSym = new Vue({
  el: '#configUI',
  template: '<config-ui :options="options" :params="params"/>',
  components: { configUi },
  data: {options: gS.options, params: gS.params}
});

// Floating Overlay Help Panel
//------------------------------------------------------------------------------
import helpPanel from './components/helpPanel';
var vueHelpPanel = new Vue({
  el: '#helpPanel',
  template: '<help-panel :params="params"/>',
  components: { helpPanel },
  data: {params: gS.params}
});
//window.helpP = vueHelpPanel;

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
  template: '<symmetry-ui :symmState="symmState" :params="params" :options="options"/>',
  components: { symmetryUi },
  data: {symmState: gS.symmState, params: gS.params, options: gS.options}
});

// Line Styling UI
//------------------------------------------------------------------------------
import styleUi from './components/styleUI';
var vueStyle = new Vue({
  el: '#styleUI',
  //  template: '<style-ui :lineWidth="lineWidth" :miterLimit="miterLimit" :lineJoin="lineJoin" :lineCap="lineCap"/>',
    template: '<style-ui :ctxStyle="ctxStyle" :params="params" :options="options"/>',
  components: {styleUi},
  data: { ctxStyle: gS.ctxStyle, params: gS.params, options: gS.options }
});

// Color UI
//------------------------------------------------------------------------------
import colorUi from './components/colorUI';
var vueColor = new Vue({
  el: '#colorUI',
  template: `<color-ui :params="params" :strokeColor="strokeColor" :fillColor="fillColor"/>`,
  components: {colorUi},
  data: {params: gS.params},
  computed: { strokeColor:
      function(){
        let tmp = [].concat(parseColor(gS.ctxStyle.strokeStyle));
        return {r:tmp[0], g:tmp[1], b:tmp[2], a:tmp[3]};
      },
      fillColor:
      function(){
        let tmp = [].concat(parseColor(gS.ctxStyle.fillStyle));
        return {r:tmp[0], g:tmp[1], b:tmp[2], a:tmp[3]};
      }
  }
});

// File UI
//------------------------------------------------------------------------------
import fileUi from './components/fileUI';
var vueFile = new Vue({
  el: '#fileUI',
  data: {params: gS.params},
  template: '<file-ui :params="params"/>',
  components: {fileUi},
});

var vueEnd = new Vue({ //XXX: a bit crufty this...
  el: '#endcomments',
  data: {params: gS.params},
  computed: {displayMe: function(){ return {display: this.params.fullUI ? "block" : "none"}} },
  template: `<div :style="displayMe"><br><br>
              <div style="font-size:10px;text-align:center;">Anselm Levskaya &copy; 2017</div>
            </div>`,
});

// Major Canvas Handling Functions
//--------------------------------------------------------------------------------------------------------
var onResize = function() { // also for onOrientationChange !
  drawTools[gS.params.curTool].commit();  //commit live tool op first!
  let w = window.innerWidth;
  let h = window.innerHeight;
  console.log("window innerDims ", w, h);
  gS.params.canvasWidth = w;
  gS.params.canvasHeight = h;
  canvas.width = w;
  canvas.height = h;
  livecanvas.width = w;
  livecanvas.height = h;
  pixelratio = pixelFix(canvas);
  pixelFix(livecanvas);

  // restore context state to live canvas
  _.assign(lctx, gS.ctxStyle);
  // recalculate grid replicates
  gS.symmState.Nx = Math.round((w / gS.symmState.d)*2); //redundant I think
  gS.symmState.Ny = Math.round((h / gS.symmState.d)*2); //redundant I think
  //console.log("grid Nx,Ny ", gS.symmState.Nx, gS.symmState.Ny); //redundant I think

  // now update global affineset and rerender ctx and live ctx
  updateSymmetry(_.clone(gS.symmState));
  rerender(ctx);
  drawTools[gS.params.curTool].liverender();
}

// set up initial context and symmetry
const initState = function() {
  _.assign(lctx, gS.ctxStyle);

  //update version
  gS.params.versionString = getESVersion();

  let w = window.innerWidth;
  let h = window.innerHeight;
  gS.symmState.x = Math.round(w/2);
  gS.symmState.y = Math.round(h/2);
  gS.symmState.Nx = Math.round((w / gS.symmState.d)*2);
  gS.symmState.Ny = Math.round((h / gS.symmState.d)*2);
  //console.log("grid Nx,Ny ",gS.symmState.Nx, gS.symmState.Ny);

  updateSymmetry(_.clone(gS.symmState));
  rerender(ctx);
};

// get version string
export const getESVersion = function() {
  if(window.ES_VERSION){ return ES_VERSION; } else { return "v0.3"; }
}

const initGUI = function() {
  console.log("Eschersketch", getESVersion());

  // set up symmetry grid based on screen size
  let w = window.innerWidth;
  let h = window.innerHeight;
  console.log("window innerDims ", w, h);
  gS.params.canvasWidth = w;
  gS.params.canvasHeight = h;

  canvas = document.getElementById("sketchrender");
  canvas.width = gS.params.canvasWidth;
  canvas.height = gS.params.canvasHeight;
  pixelratio = pixelFix(canvas);
  ctx = canvas.getContext("2d");

  livecanvas = document.getElementById("sketchlive");
  livecanvas.width = gS.params.canvasWidth;
  livecanvas.height = gS.params.canvasHeight;
  pixelFix(livecanvas);
  lctx = livecanvas.getContext("2d");
  window.lctx = lctx;//HACK

  livecanvas.onmousedown  = dispatchMouseDown; //disable for touch
  livecanvas.onmouseup    = dispatchMouseUp;   //disable for touch
  livecanvas.onmousemove  = dispatchMouseMove; //disable for touch
  livecanvas.onmouseleave = dispatchMouseLeave;//disable for touch

  document.getElementsByTagName("body")[0].onkeydown = dispatchKeyDown;
  document.getElementsByTagName("body")[0].onkeyup = dispatchKeyUp;

  initState();
};

// This "works" for both mouse and touch events, but
// really the whole UI needs major rework for mobile...
const initTouchEvents = function() {
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

/* Crude, but this works! -------------------------------------------------------------
import Pressure from 'pressure';
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
