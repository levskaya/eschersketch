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

// Global Assets
//------------------------------------------------------------------------------
require('./assets/eschersketch.css'); //global css
//require('./assets/icomoon.css');    //icon fonts

// Library Imports
//------------------------------------------------------------------------------
import { _ } from 'underscore';
import Vue from 'vue';
import Hammer from 'hammerjs'; // touch-event support

// polyfills for saving files
import {saveAs} from './libs/FileSaver.js';
import {blobPolyfillLoader} from './libs/Blob.js';
blobPolyfillLoader();
// modifies global canvas object to allow blob export
import {canvastoBlobLoader} from './libs/canvas-toBlob.js';
canvastoBlobLoader();

// need to use my tweaked version of canvas2svg to avoid regex recursion limit
import {canvas2SVGLoad} from './libs/canvas2svg.js';
canvas2SVGLoad();

// touch detection
import {modernizrLoader} from './libs/modernizr-custom.js';
modernizrLoader();

// Local Imports
//------------------------------------------------------------------------------
import {deepClone} from './utils';
import {pixelFix, setCanvasPixelDensity, parseColor} from './canvas_utils';
import {generateTiling, planarSymmetries, RosetteGroup, IdentitySet} from './symmetryGenerator';


// Import all the Drawing Tools
//------------------------------------------------------------------------------
import {GridTool}     from './gridTool';
import {LineTool, LineOp}     from './lineTool';
import {PencilTool, PencilOp}   from './pencilTool';
import {PolygonTool, PolygonOp}     from './polygonTool';

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
      showNetwork: false,
      showShareLinks: false,
      showHints: false,           //contextual help, still janky...
      hintText: "",
      canvasHeight: 1200,
      canvasWidth:  1600,
      filename: "eschersketch",
      versionString: "v0.3",      //Eschersketch version
      copyText:""
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
  }
});

// Global Command and Redo Stacks
//-------------------------------
var cmdStack = [];
var redoStack = [];
//window.getCmdStack = ()=>cmdStack; //HACK

// Canvas / Context Globals
//------------------------------------------------------------------------------
export var livecanvas = {};
export var lctx = {};
export var canvas = {};
export var ctx = {};

// rescaling ratio used by pixelFix, needed for pixel-level manipulation
var pixelratio = 1;

// Contains Symmetries used by all other operations
//------------------------------------------------------------------------------
export var affineset = {};
//window.currentAffine = () => affineset; //HACK: debugging


// Global indices into Instantiated Tools and their Ops
//------------------------------------------------------------------------------
export const drawTools = {
  grid: new GridTool(), //not a _drawing_ tool
  line: new LineTool(),
  circle: new CircleTool(),
  pencil: new PencilTool(),
  poly: new PolyTool(),
  path: new PathTool(),
  polygon: new PolygonTool()
};
const opsTable = {
  line: LineOp,
  pencil: PencilOp,
  circle: CircleOp,
  polygon: PolygonOp,
  path: PathOp,
  poly: PolyOp
};


// Global Events
//------------------------------------------------------------------------------
gS.$on('symmUpdate',
       function(symmState) {
         updateSymmetry(symmState);
         //HACK: if the gridtool is active, update canvas if the grid ui is altered
         if(gS.params.curTool=="grid"){ drawTools["grid"].enter(); }
         drawTools[gS.params.curTool].liverender();
       });
gS.$on('styleUpdate',
       function(styles) {
         updateStyle(styles);
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
gS.$on('toolUpdate', function(tool){ changeTool(tool); });
gS.$on('toolOptionUpdate',
      function(name, value){
        drawTools[gS.params.curTool].options[name].val = value;
        drawTools[gS.params.curTool].liverender();
      });
gS.$on('optionsUpdate', function(name, val){ gS.options[name] = val; });
gS.$on('undo', function(){ undo(); });
gS.$on('redo', function(){ redo(); });
gS.$on('reset', function(){ reset(); });

// Pure UI Events
//------------------------------------------------------------------------------------------
gS.$on('toggleUI', function() {
  //console.log("toggleUI");
  if(gS.params.fullUI){
    gS.params.fullUI = false;
    gS.params.showTool = false;
    gS.params.showColor = false;
    gS.params.showLine = false;
    gS.params.showSymm = false;
    gS.params.showFile = false;
    gS.params.showNetwork = false;
  } else {
    gS.params.fullUI = true;
    gS.params.showTool = true;
    gS.params.showColor = true;
    gS.params.showLine = true;
    gS.params.showSymm = true;
    gS.params.showFile = true;
    gS.params.showNetwork = true;
  }});
gS.$on('help', function(){ gS.params.showHelp = ! gS.params.showHelp;});
gS.$on('config', function(){ gS.params.showConfig = ! gS.params.showConfig; });
gS.$on('paramsUpdate', function(name, val){ gS.params[name] = val;});
gS.$on('toggleParam', function(paramName) { gS.params[paramName] = ! gS.params[paramName] });
gS.$on('setHint', function(val){
  if(gS.params.showHints) { gS.params.hintText = val; }
});

window.gS=gS;  // HACK: for debugging


// Initialize Vue UI
//------------------------------------------------------------------------------
import topUi from './components/topUI';
var vueUI = new Vue({
  el: '#topUI',
  template: '<top-ui :params="params" :options="options" :symmState="symmState" :ctxStyle="ctxStyle" />',
  components: { topUi },
  data: {params: gS.params, options: gS.options, symmState: gS.symmState, ctxStyle: gS.ctxStyle}
});


//Style update
export const updateStyle = function(styles) {
  _.assign(lctx, _.clone(styles));
  _.assign(gS.ctxStyle, _.clone(styles));
}

// Symmetry Functions
//-------------------------------------------------------------------------------------------------
const memo_generateTiling = _.memoize(generateTiling,
                                function(){return JSON.stringify(arguments);});

export const updateSymmetry = function(symmState) {

  _.assign(gS.symmState, symmState);

  if(gS.options.dynamicGridSize) {
    let newNx = Math.round((gS.params.canvasWidth  / gS.symmState.d)*2);
    let newNy = Math.round((gS.params.canvasHeight / gS.symmState.d)*2);
    // basic safety so as not to grind CPU to a halt...
    gS.symmState.Nx = newNx < gS.options.maxGridNx ? newNx : gS.options.maxGridNx;
    gS.symmState.Ny = newNy < gS.options.maxGridNy ? newNy : gS.options.maxGridNy;
    // console.log("grid Nx", gS.symmState.Nx, "Ny", gS.symmState.Ny);
  }

  if(gS.symmState.sym == "none"){
    affineset = IdentitySet();
  }
  else if(Object.keys(planarSymmetries).includes(gS.symmState.sym)) {
    affineset = memo_generateTiling(planarSymmetries[gS.symmState.sym],
                                    gS.symmState.Nx,gS.symmState.Ny,
                                    gS.symmState.d, gS.symmState.t,
                                    gS.symmState.x, gS.symmState.y);
  }
  else {
    affineset = RosetteGroup(gS.symmState.Nrot,
                            gS.symmState.Nref,
                            gS.symmState.x,
                            gS.symmState.y,
                            gS.symmState.rot/180.0*Math.PI);
  }
};


// Set up Globals and UI for calling into Drawing Tools
//------------------------------------------------------------------------------
const changeTool = function(toolName){
  let oldTool = drawTools[gS.params.curTool];
  oldTool.commit();
  oldTool.exit();
  gS.params.curTool = toolName;
  let newTool = drawTools[toolName];
  newTool.enter();
};

// alter sensitivity radius of manually canvas-rendered UI elements
const changeHitRadius = function(newR){
  for(var key of Object.keys(drawTools)){
    if(drawTools[key].hasOwnProperty("hitRadius")){
      drawTools[key].hitRadius=newR;
    }
  }
};



// Command Stack
//------------------------------------------------------------------------------

// Makes transparent fill objects look cleaner by rendering fills first then strokes
const cleanLinesModifier = function(op){
    let strokeOp = restoreOp(deepClone(op));
    let fillOp = restoreOp(deepClone(op));
    fillOp.ctxStyle.strokeStyle = "rgba(0,0,0,0.0)"
    strokeOp.ctxStyle.fillStyle = "rgba(0,0,0,0.0)"
    return [fillOp, strokeOp];
}

// Makes solid fill objects look cleaner by rendering all strokes then making clean interiors w. fills
const cleanFillsModifier = function(op){
    let strokeOp = restoreOp(deepClone(op));
    let fillOp = restoreOp(deepClone(op));
    fillOp.ctxStyle.strokeStyle = "rgba(0,0,0,0.0)"
    strokeOp.ctxStyle.fillStyle = "rgba(0,0,0,0.0)"
    return [strokeOp, fillOp];
}

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

//only used for undo/redo
const switchTool = function(toolName, op){
  drawTools[gS.params.curTool].exit();
  gS.params.curTool = toolName;
  drawTools[gS.params.curTool].enter(op);
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
  if(redoStack.length>0){
    drawTools[gS.params.curTool].commit();  //commit live tool op
    let cmd = redoStack.pop();
    rerender(ctx);
    switchTool(cmd.tool, cmd); //enter()s and exit()s
  }
};

const reset = function(){
  //make sure stateful drawing tool isn't left in a weird spot
  drawTools[gS.params.curTool].exit();
  redoStack = [];
  cmdStack = [];
  lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
  initState();
};

const serialize = function(){
  let saveObj = {
    name: gS.params.filename,
    version: getESVersion(),
    format: 1,
    data: cmdStack
  }
  let jsonStr = JSON.stringify(saveObj);
  return jsonStr;
}

const restoreOp = function(deadOp){
    let op = new opsTable[deadOp.tool];
    return _.assign(op, deadOp)
}

export const deserialize = function(jsonStr){
  reset();
  let loadObj = JSON.parse(jsonStr);
  gS.params.filename = loadObj.name;
  console.log("loading ES file from version", loadObj.version);
  let newstack = [];
  for(let obj of loadObj.data){
    newstack.push(restoreOp(obj));
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
  // prevent problems with huge SVG size by constraining number of repeats exported
  let gridLimiter = function(op) {
    let newop = restoreOp(deepClone(op));
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
    let newop = restoreOp(deepClone(op));
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

// Get base64 encoded JPG of current scene (for snapshot upload)
export const getJPGdata = function(){
  const pixelScale = 1;//gS.options.pngTileUpsample; // pixel density scaling factor
  const jpegQuality = 0.9;
  // get square tile dimensions
  let [dX, dY] = planarSymmetries[gS.symmState.sym].tile;
  dX *= gS.symmState.d * pixelScale;
  dY *= gS.symmState.d * pixelScale;

  // Render into tile-sized canvas for blob conversion and export
  let tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = 1200;
  tmpCanvas.height = 600;
  let tctx = tmpCanvas.getContext("2d");
  //correct for center off-set and pixel-scaling
  //tctx.scale(pixelScale, pixelScale);
  //tctx.translate(-1*gS.symmState.x, -1*gS.symmState.x);
  //rerender scene and export bitmap
  //rerender(tctx, {modifier: cleanLinesModifier}); //XXX: very clean effect!
  //rerender(tctx, {modifier: cleanFillsModifier}); //XXX: very clean effect!
  tctx.save();
  tctx.fillStyle="rgba(255,255,255,1.0)";
  tctx.fillRect(0, 0, canvas.width, canvas.height);
  tctx.restore();
  rerender(tctx, {clear: false});
  let jpegData = tmpCanvas.toDataURL("image/jpeg", jpegQuality);
  //saveAs(jpegData, gS.params.filename + "_tmp.jpeg");
  //tmpCanvas.toBlobHD(blob => saveAs(blob, gS.params.filename + "_tmp.jpg"));
  tmpCanvas.remove();
  return jpegData;
};

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
  //rerender(tctx, {modifier: cleanFillsModifier}); //XXX: very clean effect!
  rerender(tctx);
  tileCanvas.toBlobHD(blob => saveAs(blob, gS.params.filename + "_tile.png"));
  tileCanvas.remove();
};

// experimental cloud storage -----------------------------------------------------------------
export const prepForUpload = function() {
  let jsonstr = JSON.stringify({
              name: gS.params.filename,
              version: getESVersion(),
              data: cmdStack
             });
  console.log("JSON size is ", jsonstr.length);
  return jsonstr;
}
export const fetchFromCloud = function(jsonStr){
  reset();
  let shellObj = JSON.parse(jsonStr);
  let loadObj = shellObj.content;
  gS.params.filename = loadObj.name;
  console.log("loading ES SketchID", shellObj.sketchID, "from version", loadObj.version);
  let newstack = [];
  for(let obj of loadObj.data){
    newstack.push(restoreOp(obj));
  }
  cmdStack = newstack;
  rerender(ctx);
}

import {loadSketch} from './network.js';
const loadGivenSketch = function(){
  let urlObj = new URL(window.location.href);
  let querySketchID = urlObj.searchParams.get("s");
  let urlSketchID = window.location.href.split('s/')[1];
  if(querySketchID){
    console.log("Query sketchID", querySketchID, "requested");
    loadSketch(querySketchID);
  } else if(urlSketchID){
    console.log("URL sketchID", urlSketchID, "requested");
    loadSketch(urlSketchID);
  }
}
// end experimental cloud storage -------------------------------------------------------------



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

  livecanvas.onmousedown  = dispatchMouseDown; //disable for touch
  livecanvas.onmouseup    = dispatchMouseUp;   //disable for touch
  livecanvas.onmousemove  = dispatchMouseMove; //disable for touch
  livecanvas.onmouseleave = dispatchMouseLeave;//disable for touch

  document.getElementsByTagName("body")[0].onkeydown = dispatchKeyDown;
  document.getElementsByTagName("body")[0].onkeyup = dispatchKeyUp;

  initState();

  //parse URL for get params and load from backend
  loadGivenSketch();

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
