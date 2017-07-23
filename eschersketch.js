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
const { Chrome } = VueColor;

// Symmetries
const allsyms = ['p1','pm','cm','pg',            //rot-free
                 'pmg','pgg','pmm','p2','cmm',   //180deg containing
                 'p4', 'p4g', 'p4m',             //square
                 'p3','p6','p31m','p3m1','p6m']; //hex

var gridstate = {x:800, y:400, d:100, t:0};
const GRIDNX = 37;
const GRIDNY = 31;

// Constants
const CANVAS_WIDTH  = 1600;
const CANVAS_HEIGHT = 1200;
const MIN_LINEWIDTH = 0.01;
const MAX_LINEWIDTH = 4;

// Color, Opacity
// var defaultColorProps = {
//   hex: '#194d33',
//   hsl: { h: 150, s: 0.5, l: 0.2, a: 1  },
//   hsv: { h: 150, s: 0.66, v: 0.30, a: 1 },
//   rgba: { r: 25, g: 77, b: 51, a: 1},
//   a: 1
// };

var strokecolor = {r: 100, g:100, b:100, a:1.0};
//var fillcolor = {r: 100, g:100, b:100, a:1.0};

var lattice = {};
var affineset = {};


// Symmetry Selection UI
//------------------------------------------------------------------------------
Vue.component('es-button', {
  template: `<div class="symsel"
              v-bind:class="selected"
              v-on:click="bclick">
                {{ sym.name }}
              </div>`,
  props: ['sym'],
  methods: {
    bclick: function(){
      //console.log("clicked ", this.sym.name);
      this.$emit("bclick", this.sym.name);
    }
  },
  //data: function(){ return {}; },
  computed: {
    selected: function() {
      return {selected: this.sym.selected};
    }
  }
});


var vuesymsel = new Vue({
  el: '#vuesymsel',
  data: { selected: allsyms[allsyms.length-1] },
  computed: {
    syms: function(){
      symds=[];
      for(var sym of allsyms){
        symds.push({name: sym, selected: (sym==this.selected)});
      }
      return symds;
    }
  },
  methods: {
    changesym: function(symname){
      //console.log("bclick emitted ", symname);
      this.selected = symname;
      for(var sym of this.syms){
        if(sym.name == symname) {sym.selected=true;}
        else {sym.selected=false;}
      }
      var gridcopy = {x:gridstate.x, y:gridstate.y, d:gridstate.d, t:gridstate.t};
      cmdstack.push(new SymmOp(symname, gridcopy));
      rerender(ctx);
    }
  },

});


// Grid UI
//------------------------------------------------------------------------------
Vue.component('es-numfield', {
  template: `<input type="text"
              v-on:change="numch"
              v-bind:value="val"
              size="3"/>`,
  props: ['name', 'val'],
  methods: {
    numch: function({type, target}){
      target.blur();
      //console.log("numch ", this.name, target.value);
      this.$emit("numch", this.name, target.value);
    }
  }
});

var gridparams = new Vue({
  el: '#gridparams',
  data: gridstate,
  methods: {
    update: function(name, val){
      console.log("grid update", name, val);
      gridstate[name]=Number(val);
      //console.log(vuesymsel.selected, gridstate);
      var gridcopy = {x:gridstate.x, y:gridstate.y, d:gridstate.d, t:gridstate.t};
      cmdstack.push(new SymmOp(vuesymsel.selected, gridcopy));
      rerender(ctx);
    }
  },
  //hook:
  updated: function(){console.log("changed", gridstate);}
});

// Color UI
//------------------------------------------------------------------------------
var rgb2hex = function(r,g,b) {
  var pad = function(n, width=2, z=0) {
    return (String(z).repeat(width) + String(n)).slice(String(n).length);
  };
  var hexr = pad(parseInt(r,10).toString(16).slice(-2));
  var hexg = pad(parseInt(g,10).toString(16).slice(-2));
  var hexb = pad(parseInt(b,10).toString(16).slice(-2));
  return '#'+hexr+hexg+hexb;
};


colorvue = new Vue({
  el:"#viewcol",
  //data: {colors: defaultColorProps},
  data: strokecolor,
  computed: {
    colors: function(){
      let newColor = {
        hex: rgb2hex(this.r,this.g,this.b),
        a: this.a
      };
      return newColor;
      }
    },
  components: {
    'chrome-picker': Chrome
  },
  methods: {
    onUpdate: function(x){
      //console.log(x.rgba.r, x.rgba.g, x.rgba.b, x.rgba.a);
      cmdstack.push(new ColorOp(x.rgba.r,x.rgba.g,x.rgba.b,x.rgba.a));
      rerender(ctx);
      this.r = x.rgba.r;
      this.g = x.rgba.g;
      this.b = x.rgba.b;
      this.a = x.rgba.a;
    },
    // changeValue: function(r,g,b,a){
    //   let newColor = {
    //     hex: rgb2hex(r,g,b),
    //     a: a
    //   };
    //   console.log(newColor);
    //   this.colors = newColor;
    // }
  }
});

//window.colorvue = colorvue;




// Mouse Events -- dispatched to active Drawing Tool
//------------------------------------------------------------------------------
var dispatchMouseDown = function(e) {
  e.preventDefault(); //?
  drawTools[curTool].mouseDown(e);
};

var dispatchMouseUp = function(e) {
  e.preventDefault(); //?
  drawTools[curTool].mouseUp(e);
};

var dispatchMouseMove = function(e) {
  e.preventDefault(); //?
  drawTools[curTool].mouseMove(e);
};


// Canvas / Context Globals...
//------------------------------------------------------------------------------
var livecanvas = {};
var lctx = {};
var canvas = {};
var ctx = {};


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
var cmdstack = [];
var redostack = [];
var rerender = function(ctx, clear=false) {
  console.log("rerender w. ", cmdstack.length, " ops");
  if(clear){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  for(var cmd of cmdstack){
    cmd.render(ctx);
  }
};
var undo = function(){
  if(cmdstack.length>0){
    var cmd = cmdstack.pop();
    redostack.push(cmd);
    rerender(ctx, clear=true);
  }
};
var redo = function(){
  if(redostack.length>0){
    var cmd = redostack.pop();
    cmdstack.push(cmd);
    rerender(ctx, clear=true);
  }
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



//------------------------------------------------------------------------------
// Context / State Update Ops
//------------------------------------------------------------------------------
var memo_generateTiling = _.memoize(generateTiling,
                                function(){return JSON.stringify(arguments);});
var memo_generateLattice = _.memoize(generateLattice,
                                function(){return JSON.stringify(arguments);});
var updateTiling = function(sym, gridstate) {
  affineset = memo_generateTiling(planarSymmetries[sym],
                                  GRIDNX, GRIDNY,
                                  gridstate.d, gridstate.t,
                                  gridstate.x, gridstate.y);
  lattice = memo_generateLattice(planarSymmetries[sym],
                                 GRIDNX, GRIDNY,
                                 gridstate.d, gridstate.t,
                                 gridstate.x, gridstate.y);
  console.log("affineset: ", sym, " N= ", affineset.length);
};

// needed for responsize graphical grid update:
var updateLattice = function(sym, gridstate) {
    lattice = memo_generateLattice(planarSymmetries[sym],
                              GRIDNX, GRIDNY,
                              gridstate.d, gridstate.t,
                              gridstate.x, gridstate.y);
};

// SymmOp sets up set of affine trafos for a given symmetry
//------------------------------------------------------------------------------
class SymmOp {
  constructor(sym, grid) {
    this.sym = sym;
    this.grid = grid;
  }

  render(ctx){
    //update global storing current affineset... hacky
    updateTiling(this.sym, this.grid);
    // HACK: directly mutate global that's watched by vue...
    gridstate.x = this.grid.x;
    gridstate.y = this.grid.y;
    gridstate.d = this.grid.d;
    gridstate.t = this.grid.t;
  }

  serialize(){
    return ["sym", this.sym, this.grid.x, this.grid.y, this.grid.d, this.grid.t];
  }

  deserialize(data){
    return new SymmOp(data[1], data[2], data[3], data[4], data[5]);
  }
}

// ColorOp sets stroke color of ctx
//------------------------------------------------------------------------------
// XXX: figure out how to do fill color
class ColorOp {
  constructor(r,g,b,a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  render(ctx){
    ctx.strokeStyle = "rgba("+this.r+","+this.g+","+this.b+","+this.a+")";
    // HACK: ghetto, fix application to all contexts...
    lctx.strokeStyle = "rgba("+this.r+","+this.g+","+this.b+","+this.a+")";
    // HACK: directly mutate global that's watched by vue...
    strokecolor.r = this.r;
    strokecolor.g = this.g;
    strokecolor.b = this.b;
    strokecolor.a = this.a;
  }

  serialize(){
    return ["color", r, g, b, a];
  }

  deserialize(data){
    return new ColorOp(data[1], data[2], data[3], data[4]);
  }
}


//class LineThicknessOp {
//   constructor(w){
//  }
//}

//------------------------------------------------------------------------------
// Drawing Ops and Tools
//------------------------------------------------------------------------------


// class GridTool {
//   constructor(x,y,d,t) {
//     this.x = x;
//     this.y = y;
//     this.d = d;
//     this.t = t;
//   }
//
//   enter(){ // XXX: called when tool first selected
//     // DRAW GRID & Controls here
//   }
//
//   exit(){ // XXX: called when tool leaves
//     // Erase GRID & Controls
//   }
// }


// Draw Single Line Segments
//------------------------------------------------------------------------------
class LineOp {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  render(ctx){
    for (let af of affineset) {
      const Tp1 = af.on(this.start.x, this.start.y);
      const Tp2 = af.on(this.end.x, this.end.y);
      ctx.line(Tp1[0], Tp1[1], Tp2[0], Tp2[1]);
    }
    //ctx.line(this.start.x, this.start.y, this.end.x, this.end.y);
  }

  serialize(){
    return ["line", start, end];
  }

  deserialize(data){
    return new LineOp(data[1], data[2]);
  }
}

class LineTool {
  constructor() {
    this.start = {};
    this.end = {};
    this.on = false;
    this.drawInterval = 0;
  }

  liverender() {
    lctx.clearRect(0, 0, canvas.width, canvas.height);
    //lctx.line(this.start.x, this.start.y, this.end.x, this.end.y);
    for (let af of affineset) {
      const Tp1 = af.on(this.start.x, this.start.y);
      const Tp2 = af.on(this.end.x, this.end.y);
      lctx.line(Tp1[0], Tp1[1], Tp2[0], Tp2[1]);
    }
  }

  commit() {
    cmdstack.push( new LineOp(this.start, this.end) );
    rerender(ctx);
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
  }

  //cancel() { lctx.clearRect(0, 0, livecanvas.width, livecanvas.height); }

  mouseDown(e) {
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    this.start = { x: e.clientX - rect.left,
                   y: e.clientY - rect.top};
    this.on = true;
  }

  mouseMove(e) {
    if (this.on) {
      if (this.drawInterval <= 0) {
        var rect = canvas.getBoundingClientRect();
        this.end = { x: e.clientX - rect.left,
                     y: e.clientY - rect.top};
        this.liverender();
        this.drawInterval = 1;
      }
      this.drawInterval--;
    }
  }

  mouseUp(e) {
    this.on = false;
    this.commit();
    this.start = {};
    this.end = {};
  }
}

// Draw Raw Mousepath (Pencil)
//------------------------------------------------------------------------------
class PencilOp {
  constructor(points) {
    this.points = points;
  }

  render(ctx){
    for (let af of affineset) {
      ctx.beginPath();
      const Tpt0 = af.on(this.points[0].x, this.points[0].y);
      ctx.moveTo(Tpt0[0], Tpt0[1]);
      for (let pt of this.points.slice(1)) {
        const Tpt = af.on(pt.x, pt.y);
        ctx.lineTo(Tpt[0], Tpt[1]);
      }
      ctx.stroke();
    }
  }

  serialize(){
    return ["pencil", this.points];
  }

  deserialize(data){
    return new PencilOp(data[1]);
  }
}

class PencilTool {
  constructor() {
    this.points = [];
    this.on = false;
    this.drawInterval = 0;
  }

  liverender() {
    lctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let af of affineset) {
      lctx.beginPath();
      const Tpt0 = af.on(this.points[0].x, this.points[0].y);
      lctx.moveTo(Tpt0[0], Tpt0[1]);
      for (let pt of this.points.slice(1)) {
        const Tpt = af.on(pt.x, pt.y);
        lctx.lineTo(Tpt[0], Tpt[1]);
      }
      lctx.stroke();
    }
  }

  commit() {
    cmdstack.push( new PencilOp(this.points) );
    rerender(ctx);
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
  }

  //cancel() { lctx.clearRect(0, 0, livecanvas.width, livecanvas.height); }

  mouseDown(e) {
    //e.preventDefault();
    console.log("penciltool mdown");
    var rect = canvas.getBoundingClientRect(); //XXX: which canvas appropriate?
    this.points.push({ x: e.clientX - rect.left,
                       y: e.clientY - rect.top});
    this.on = true;
  }

  mouseMove(e) {
    if (this.on) {
    console.log("penciltool mmov");
      if (this.drawInterval <= 0) {
        var rect = canvas.getBoundingClientRect();
        this.points.push({ x: e.clientX - rect.left,
                           y: e.clientY - rect.top});
        this.liverender();
        this.drawInterval = 1;
      }
      this.drawInterval--;
    }
  }

  mouseUp(e) {
    console.log("penciltool mup");
    this.on = false;
    this.commit();
    this.points = [];
  }
}



// Draw Circles
//------------------------------------------------------------------------------
class CircleOp {
  constructor(center, radius) {
    this.center = center;
    this.radius = radius;
  }

  render(ctx){
    for (let af of affineset) {
      const Tc1 = af.on(this.center.x, this.center.y);
      const Tr = this.radius; //XXX: not true for scaling trafos! fix!
      ctx.beginPath();
      ctx.arc(Tc1[0], Tc1[1], Tr, 0, 2*Math.PI);
      ctx.stroke();
    }
    //ctx.beginPath();
    //ctx.arc(this.center.x, this.center.y, this.radius, 0, 2*Math.PI);
    //ctx.stroke();
  }

  serialize(){
    return ["circle", this.center, this.radius];
  }

  deserialize(data){
    return new CircleOp(data[1], data[2]);
  }
}

class CircleTool {
  constructor() {
    this.center = {};
    this.radius = 0;
    this.on = false;
    this.drawInterval = 0;
  }

  liverender() {
    lctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let af of affineset) {
      const Tc1 = af.on(this.center.x, this.center.y);
      const Tr = this.radius; //XXX: not true for scaling trafos! fix!
      lctx.beginPath();
      lctx.arc(Tc1[0], Tc1[1], Tr, 0, 2*Math.PI);
      lctx.stroke();
    }
    //lctx.beginPath();
    //lctx.arc(this.center.x, this.center.y, this.radius, 0, 2*Math.PI);
    //lctx.stroke();
  }

  commit() {
    cmdstack.push( new CircleOp(this.center, this.radius) );
    rerender(ctx);
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
  }

  //cancel() { lctx.clearRect(0, 0, livecanvas.width, livecanvas.height); }

  mouseDown(e) {
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    this.center = { x: e.clientX - rect.left,
                   y: e.clientY - rect.top};
    this.on = true;
  }

  mouseMove(e) {
    if (this.on) {
      if (this.drawInterval <= 0) {
        var rect = canvas.getBoundingClientRect();
        var tmp = { x: e.clientX - rect.left,
                    y: e.clientY - rect.top};
        this.radius =
          Math.sqrt(Math.pow(this.center.x-tmp.x, 2) + Math.pow(this.center.y-tmp.y, 2));
        this.liverender();
        this.drawInterval = 1;
      }
      this.drawInterval--;
    }
  }

  mouseUp(e) {
    this.on = false;
    this.commit();
    this.center = {};
    this.radius = 0;
  }
}



// Set up Globals and UI for calling into Drawing Tools
//------------------------------------------------------------------------------
var drawTools = {
  line: new LineTool(),
  circle: new CircleTool(),
  pencil: new PencilTool()
};
var curTool = "line";

//ghetto:
document.getElementById("linetool").onmousedown = function(e) { curTool = "line"; };
document.getElementById("circletool").onmousedown = function(e) { curTool = "circle"; };
document.getElementById("penciltool").onmousedown = function(e) { curTool = "pencil"; };



//------------------------------------------------------------------------------
// Canvas Tweaks
//------------------------------------------------------------------------------

// simple canvas line method
const drawLine = function(x1, y1, x2, y2) {
  //console.log("line:", x1, y1, x2, y2);
  this.beginPath();
  this.moveTo(x1, y1);
  this.lineTo(x2, y2);
  this.stroke();
};

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
  //console.log("pixel ratio", ratio);

  // upscale the canvas if the two ratios don't match
  if (devicePixelRatio !== backingStoreRatio) {

    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    canvas.width = oldWidth * ratio;
    canvas.height = oldHeight * ratio;
    canvas.style.width = oldWidth + 'px';
    canvas.style.height = oldHeight + 'px';

    // now scale the context to counter the fact that we've
    // manually scaled our canvas element
    context.scale(ratio, ratio);
  }
};




var initGUI = function() {

  canvas = document.getElementById("sketchrender");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  pixelFix(canvas);
  ctx = canvas.getContext("2d");
  ctx.line = drawLine;
  ctx.lineWidth = 1.0;
  ctx.fillStyle = "rgb(0, 255, 255)";
  ctx.strokeStyle = "rgb(0, 255, 255)";

  livecanvas = document.getElementById("sketchlive");
  livecanvas.width = CANVAS_WIDTH;
  livecanvas.height = CANVAS_HEIGHT;
  pixelFix(livecanvas);
  lctx = livecanvas.getContext("2d");
  lctx.line = drawLine;
  lctx.lineWidth = 1.0;
  lctx.fillStyle =   "rgb(0, 255, 255)";
  lctx.strokeStyle = "rgb(0, 255, 255)";

  livecanvas.onmousedown = dispatchMouseDown;
  livecanvas.onmouseup   = dispatchMouseUp;
  livecanvas.onmousemove = dispatchMouseMove;

  initState();
};

// should be "reset"
var initState = function() {
  cmdstack.push(new ColorOp(strokecolor.r,
                            strokecolor.g,
                            strokecolor.b,
                            strokecolor.a));

  cmdstack.push(new SymmOp(allsyms[allsyms.length-1], gridstate));

  rerender(ctx);
};
