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
                     'hexgrid','p3','p6','p31m','p3m1','p6m', //hex
                     'rosette'],
  //ctx state to store inside draw ops
  CTXPROPS:          ['fillStyle', 'strokeStyle', 'lineCap', 'lineJoin', 'miterLimit', 'lineWidth'],
  TILINGSYMS:       ['p1','diagonalgrid','pm','cm','pg',      //rot-free
                     'pmg','pgg','pmm','p2','cmm',             //180deg containing
                     'p4', 'p4g', 'p4m',                       //square
                     'hexgrid','p3','p6','p31m','p3m1','p6m']
};


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
      showTool: true,
      showColor: true,
      showLine: true,
      showSymm: true,
      showFile: true,
      showHelp: false,
      showConfig: false,
      versionString: "v0.3",      //Eschersketch version
    },
    options: {
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
    // Symmetry State
    //-------------------------------
    symmState: {sym: gCONSTS.INITSYM,
                x:800, y:400,
                d:100, t:0,
                Nx:18, Ny:14,  // grid Nx, Ny should NOT be large (i.e. >50)
                Nrot: 0, Nref: 3, rot: 0},
    // Style State
    //-------------------------------
    ctxStyle: {
      lineCap:     "butt", // butt, round, square
      lineJoin:    "round", // round, bevel, miter
      miterLimit:  10.0, // applies to miter setting above
      lineWidth:   1.0,
      fillStyle:   "rgba(200, 100, 100, 0.5)",
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
gS.$on('optionsUpdate', function(name, val){ gS.options[name] = val; });
gS.$on('undo', function(){ undo(); });
gS.$on('redo', function(){ redo(); });
gS.$on('reset', function(){ reset(); });

// Pure UI Events
//------------------------------------------------------------------------------------------
gS.$on('toggleUI', function() {
  console.log("toggleUI");
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
gS.$on('help', function(){
  console.log("help");
  gS.params.showHelp = ! gS.params.showHelp;
});
gS.$on('config', function(){ gS.params.showConfig = ! gS.params.showConfig; });
gS.$on('toggleParam', function(paramName) { gS.params[paramName] = ! gS.params[paramName] });

window.gS=gS;  // HACK: for debugging


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
window.currentAffine = () => affineset; //HACK: debugging

const memo_generateTiling = _.memoize(generateTiling,
                                function(){return JSON.stringify(arguments);});

//HACK: quick and dirty, fix the call structure to be clean interface
export const updateSymmetry = function(symmState) {

  if(gS.options.dynamicGridSize) {
    let newNx = Math.round((gCONSTS.CANVAS_WIDTH  / gS.symmState.d)*2);
    let newNy = Math.round((gCONSTS.CANVAS_HEIGHT / gS.symmState.d)*2);
    // basic safety so as not to grind CPU to a halt...
    gS.symmState.Nx = newNx < gS.options.maxGridNx ? newNx : gS.options.maxGridNx;
    gS.symmState.Ny = newNy < gS.options.maxGridNy ? newNy : gS.options.maxGridNy;
    console.log("grid Nx,Ny ",gS.symmState.Nx, gS.symmState.Ny);
  }

  if(symmState.sym == "none"){
    affineset = IdentitySet();
  }
  else if(gCONSTS.TILINGSYMS.includes(symmState.sym)) {
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
export const drawTools = {
  line: new LineTool(),
  circle: new CircleTool(),
  pencil: new PencilTool(),
  grid: new GridTool(),
  poly: new PolyTool(),
  bezier: new PathTool()
};
//window.drawTools = drawTools; //HACK: debugging

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

//document.getElementsByTagName("body").onresize = function() { console.log("resized!"); onResize();};
//var throttledOnResize = _.throttle(onResize, 400, {trailing: false});
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
var undo_init_bound = 0;

export const rerender = function(ctx, {clear=true, modifier=null}={}) {
  if(clear){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  // Allow passing in modifier of op state
  // modifier can return a single op or a new array of ops
  if(modifier){
    for(let cmd of gS.cmdstack){
      let modcmd = modifier(cmd);
      if(_.isArray(modcmd)){
          for(let subcmd of modcmd){
            subcmd.render(ctx);
          }
      } else {
        modcmd.render(ctx);
      }
    }
  } else {
    for(let cmd of gS.cmdstack){
      cmd.render(ctx);
    }
  }
};

export const commitOp = function(op){
  gS.cmdstack.push(op);
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
  console.log("undo cmdstack", gS.cmdstack.length, "redostack", gS.redostack.length);
  drawTools[gS.params.curTool].commit();  //commit live tool op
  let cmd = gS.cmdstack.pop(); //now remove it
  if(cmd){ // if at first step with INIT tool, may not have anything, abort!
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
  }
  console.log("undo cmdstack", gS.cmdstack.length, "redostack", gS.redostack.length);
};

const redo = function(){
  console.log("redo cmdstack", gS.cmdstack.length, "redostack", gS.redostack.length);
  if(gS.redostack.length>0){
    drawTools[gS.params.curTool].commit();  //commit live tool op
    let cmd = gS.redostack.pop();
    rerender(ctx);
    switchTool(cmd.tool, cmd); //enter()s and exit()s
  }
};

const reset = function(){
  //make sure stateful drawing tool isn't left in a weird spot
  if('exit' in drawTools[gS.params.curTool]) {drawTools[gS.params.curTool].exit();}
  gS.redostack = [];
  gS.cmdstack = [];
  lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
  initState();
};

const serialize = function(){
  let jsonStr = JSON.stringify(gS.cmdstack);
  return jsonStr;
}

const opsTable = {line: LineOp,
                  pencil: PencilOp,
                  circle: CircleOp,
                  bezier: PathOp,
                  poly: PolyOp};

const ressurectOp = function(deadOp){
    let op = new opsTable[deadOp.tool];
    return _.assign(op, deadOp)
}

const deserialize = function(jsonStr){
  reset();
  let deadArr = JSON.parse(jsonStr);
  let newstack = [];
  for(let obj of deadArr){
    newstack.push(ressurectOp(obj));
  }
  gS.cmdstack = newstack;
  rerender(ctx);
}
//window.serialize=serialize; //HACK
//window.deserialize=deserialize; //HACK


// Set up Save of Scene to JSON and Restore
//------------------------------------------------------------------------------
export const saveJSON = function() {
  let sketchdata = serialize();
  var blob = new Blob([sketchdata], {type: "application/json"});
  saveAs(blob, "eschersketch.json");
}
//window.saveJSON=saveJSON;

export const renderImage = function(file) {
  var reader = new FileReader();
  reader.onload = function(event) {
    deserialize(event.target.result);
  }
  reader.readAsText(file);
}

// Set up Save SVG / Save PNG
//------------------------------------------------------------------------------
// XXX: this can take a long damn time with a complicated scene! At minimum should
// do redraws with smaller grid Nx,Ny by default or just restrict SVG export to
// tile?
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
  saveAs(blob, "eschersketch.svg");
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
  saveAs(blob, "eschersketch.svg");
};

// TODO : allow arbitrary upscaling of canvas pixel backing density using
//        setCanvasPixelDensity
export const savePNG = function() {
  canvas.toBlobHD(blob => saveAs(blob, "eschersketch.png"));
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
  tileCanvas.toBlobHD(blob => saveAs(blob, "eschersketch_tile.png"));
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
window.helpP = vueHelpPanel;

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

var onResize = function() { // also for onOrientationChange !
  drawTools[gS.params.curTool].commit();  //commit live tool op first!
  let w = window.innerWidth;
  let h = window.innerHeight;
  console.log("window innerDims ", w, h);
  gCONSTS.CANVAS_WIDTH = w;
  gCONSTS.CANVAS_HEIGHT = h;
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
  console.log("grid Nx,Ny ", gS.symmState.Nx, gS.symmState.Ny); //redundant I think

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
  console.log("grid Nx,Ny ",gS.symmState.Nx, gS.symmState.Ny);

  updateSymmetry(_.clone(gS.symmState));
  undo_init_bound = gS.cmdstack.length;
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
  gCONSTS.CANVAS_WIDTH = w;
  gCONSTS.CANVAS_HEIGHT = h;

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
