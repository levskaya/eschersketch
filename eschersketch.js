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

//Event Bus -- use Vuex instead?
var bus = new Vue();

// Symmetries
const allsyms = ['p1','diagonalgrid','pm','cm','pg',            //rot-free
                 'pmg','pgg','pmm','p2','cmm',   //180deg containing
                 'p4', 'p4g', 'p4m',             //square
                 'hexgrid','p3','p6','p31m','p3m1','p6m']; //hex
var selectedsym = 'p6m';

var gridstate = {x:800, y:400, d:100, t:0}; // XXX: Nx, Ny should be here too
//const GRIDNX = 37;
//const GRIDNY = 31;
const GRIDNX = 18;
const GRIDNY = 14;

// Constants
const CANVAS_WIDTH  = 1600;
const CANVAS_HEIGHT = 1200;
const MIN_LINEWIDTH = 0.01;
const MAX_LINEWIDTH = 4;

//stores the rescaling ratio used by pixelFix, needed for pixel-level manipulation
var pixelratio = 1;

var ctxStyle = {
  lineCap: "butt", // butt, round, square
  lineJoin: "round", // round, bevel, miter
  miterLimit: 10.0, // applies to miter setting above
  lineWidth: 1.0
};

var strokecolor = {r: 100, g:100, b:100, a:1.0};
var fillcolor =   {r: 200, g:100, b:100, a:0.0};

var lattice = {};
var affineset = {};


// Symmetry Selection UI
//------------------------------------------------------------------------------
Vue.component('es-button', {
  template: `<div class="symsel"
              :class="selected"
              @click="bclick">
                {{ sym.name }}
              </div>`,
  props: ['sym'],
  methods: {
    bclick: function(){
      //console.log("clicked ", this.sym.name);
      this.$emit("bclick", this.sym.name);
    }
  },
  computed: {
    selected: function() {
      return {selected: this.sym.selected};
    }
  }
});

var vuesymsel = new Vue({
  el: '#vuesymsel',
  data: { selected: selectedsym },
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
      selectedsym = symname; //global
      this.selected = symname;
      for(var sym of this.syms){
        if(sym.name == symname) {sym.selected=true;}
        else {sym.selected=false;}
      }
      var gridcopy = {x:gridstate.x, y:gridstate.y, d:gridstate.d, t:gridstate.t};
      cmdstack.push(new SymmOp(symname, gridcopy));
      rerender(ctx);

      //HACK: if the gridtool is active, update canvas if the grid ui is altered
      if(curTool=="grid"){ drawTools["grid"].enter()};
    }
  },
});


// Grid UI
//------------------------------------------------------------------------------
Vue.component('es-numfield', {
  template: `<input type="text" @change="numchange" :value="val" size="3"/>`,
  props: ['name', 'val'],
  methods: {
    numchange: function({type, target}){
      target.blur();
      //console.log("numchange ", this.name, target.value);
      this.$emit("numchange", this.name, target.value);
    }
  }
});

var gridUI = new Vue({
  el: '#gridUI',
  data: gridstate,
  methods: {
    update: function(name, val){
      //console.log("grid update", name, val);
      gridstate[name]=Number(val);
      //console.log(vuesymsel.selected, gridstate);
      var gridcopy = {x:gridstate.x, y:gridstate.y, d:gridstate.d, t:gridstate.t};
      cmdstack.push(new SymmOp(vuesymsel.selected, gridcopy));
      rerender(ctx);

      //HACK: if the gridtool is active, update canvas if the grid ui is altered
      if(curTool=="grid"){ drawTools["grid"].enter()};
    },
    halveD: function(){ this.update("d", this.d/2.0); },
    doubleD: function(){ this.update("d", this.d*2.0); },
  },
  //updated: function(){console.log("gridstate changed", gridstate);}
});


// Line Width UI
//------------------------------------------------------------------------------
var thicknessUI = new Vue({
  el: '#thicknessUI',
  data: ctxStyle,
  //data: {value: 1.0, max:10.0, min:0.1, step:0.1, name:"thicknessUI"},
  created: function(){
    this.max = 10.0;
    this.min = 0.1;
    this.step = 0.1;
    this.name = "thicknessUI";
  },
  methods: {
    changethick: function({type, target}){
      //console.log("changethick ", this.name, target.value);
      //this.$emit("changethick", this.name, target.value);
      cmdstack.push(new StyleOp({lineWidth: target.value}));
      rerender(ctx);
    }
  }
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


strokecolorvue = new Vue({
  el:"#strokecolor",
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
    onUpdate: _.debounce(function(x){
      //console.log("stroke",x.rgba.r, x.rgba.g, x.rgba.b, x.rgba.a);
      cmdstack.push(new ColorOp("stroke",x.rgba.r,x.rgba.g,x.rgba.b,x.rgba.a));
      rerender(ctx);
      this.r = x.rgba.r;
      this.g = x.rgba.g;
      this.b = x.rgba.b;
      this.a = x.rgba.a;
    }, 200)
  }
});

fillcolorvue = new Vue({
  el:"#fillcolor",
  data: fillcolor,
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
    onUpdate: _.debounce(function(x){
      //console.log("fill",x.rgba.r, x.rgba.g, x.rgba.b, x.rgba.a);
      cmdstack.push(new ColorOp("fill",x.rgba.r,x.rgba.g,x.rgba.b,x.rgba.a));
      rerender(ctx);
      this.r = x.rgba.r;
      this.g = x.rgba.g;
      this.b = x.rgba.b;
      this.a = x.rgba.a;
    }, 200)
  }
});

document.getElementById("showstroke").onmousedown = function(e) {
  document.getElementById("fillcolor").style.display="none";
  document.getElementById("strokecolor").style.display="block";
};
document.getElementById("showfill").onmousedown = function(e) {
  document.getElementById("strokecolor").style.display="none";
  document.getElementById("fillcolor").style.display="block";
};





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

var dispatchMouseLeave = function(e) {
  if("mouseLeave" in drawTools[curTool]) {
    drawTools[curTool].mouseLeave(e);
  }
};

var dispatchKeyDown = function(e) {
  //e.preventDefault(); //?
  //console.log(e);
  if("keyDown" in drawTools[curTool]) {
    drawTools[curTool].keyDown(e);
  }
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
var rerender = function(ctx, clear=true) {
  //console.log("rerendering ", cmdstack.length, " ops");
  if(clear){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  for(var cmd of cmdstack){
    cmd.render(ctx);
  }
};
var undo_init_bound = 0;
var undo = function(){
  //make sure stateful drawing tool isn't left in a weird spot
  if('exit' in drawTools[curTool]) {drawTools[curTool].exit();}
  if(cmdstack.length > undo_init_bound){
    var cmd = cmdstack.pop();
    redostack.push(cmd);
    rerender(ctx);
  }
};
var redo = function(){
  if(redostack.length>0){
    var cmd = redostack.pop();
    cmdstack.push(cmd);
    rerender(ctx);
  }
};
var reset = function(){
  //make sure stateful drawing tool isn't left in a weird spot
  if('exit' in drawTools[curTool]) {drawTools[curTool].exit();}
  cmdstack = [];
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
  //console.log("affineset: ", sym, " N= ", affineset.length);
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
    selectedsym = this.sym;
    gridstate.x = this.grid.x;
    gridstate.y = this.grid.y;
    gridstate.d = this.grid.d;
    gridstate.t = this.grid.t;

    //HACK: if the gridtool is active, update canvas if the grid ui is altered
    if(curTool=="grid"){ drawTools["grid"].enter(); }
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
class ColorOp {
  constructor(target,r,g,b,a) {
    this.target = target; // "fill" or "stroke"
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  render(ctx){
    if(this.target == "stroke") {
      ctx.strokeStyle = "rgba("+this.r+","+this.g+","+this.b+","+this.a+")";
      // HACK: ghetto, fix application to all contexts...
      lctx.strokeStyle = "rgba("+this.r+","+this.g+","+this.b+","+this.a+")";
      // HACK: directly mutate global that's watched by vue...
      strokecolor.r = this.r;
      strokecolor.g = this.g;
      strokecolor.b = this.b;
      strokecolor.a = this.a;
    }
    else if(this.target == "fill") {
      ctx.fillStyle = "rgba("+this.r+","+this.g+","+this.b+","+this.a+")";
      // HACK: ghetto, fix application to all contexts...
      lctx.fillStyle = "rgba("+this.r+","+this.g+","+this.b+","+this.a+")";
      // HACK: directly mutate global that's watched by vue...
      fillcolor.r = this.r;
      fillcolor.g = this.g;
      fillcolor.b = this.b;
      fillcolor.a = this.a;
    }
  }

  serialize(){
    return ["color", this.target, this.r, this.g, this.b, this.a];
  }

  deserialize(data){
    return new ColorOp(data[1], data[2], data[3], data[4], data[5]);
  }
}

class StyleOp {
  /*
    lineCap	Sets or returns the style of the end caps for a line
    lineJoin	Sets or returns the type of corner created, when two lines meet
    lineWidth	Sets or returns the current line width
    miterLimit  Sets or returns the maximum miter length
  */
  constructor(styleProps) {
    //console.log(styleProps);
    this.styleProps = styleProps;
  }

  render(ctx){
    for(var prop of Object.keys(this.styleProps)){
      //console.log(prop);
      ctx[prop] = this.styleProps[prop];
      // HACK: ghetto, fix application to all contexts...
      lctx[prop] = this.styleProps[prop];
      // HACK: directly mutate global that's watched by vue...
      ctxStyle[prop] = this.styleProps[prop];
    }
  }

  serialize(){
    return ["style", this.styleProps];
  }

  deserialize(data){
    return new StyleOp(data[1]);
  }
}



//------------------------------------------------------------------------------
// Drawing Ops and Tools
//------------------------------------------------------------------------------
var l2dist = function(pt0, pt1){
  return Math.sqrt(Math.pow(pt1[0]-pt0[0],2)+Math.pow(pt1[1]-pt0[1],2));
};

class GridTool {
  constructor() {
    Object.assign(this, gridstate); //x,y,d,t
    this.p0 = [0,0];
    this.p1 = [0,0];
    this.pR = 10;
    this.state = "off";
  }

  enter(){
    Object.assign(this, gridstate); //x,y,d,t
    this.liverender();
  }

  exit(){
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
  }

  commit(){
    cmdstack.push(new SymmOp(selectedsym, {x: this.x, y: this.y, d: this.d, t: this.t}));
    rerender(ctx);
  }

  mouseDown(e) {
    e.preventDefault();
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];
    if(l2dist(pt,this.p0)<this.pR){
      this.state = "move";
    }
    if(l2dist(pt,this.p1)<this.pR){
      this.state = "scale";
    }
  }

  mouseMove(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];
    // dynamic mouse-pointer logic
    if(l2dist(pt, this.p0)<this.pR && this.state == "off"){
      livecanvas.style.cursor="all-scroll";
    } else if(l2dist(pt, this.p1)<this.pR && this.state == "off"){
      livecanvas.style.cursor="ew-resize";
    } else if(this.state == "off"){
      livecanvas.style.cursor="crosshair";
    } else {
      livecanvas.style.cursor="none";
    }

    if (this.state == "move") {
      this.x = pt[0];
      this.y = pt[1];
      this.liverender();
    }
    if (this.state == "scale") {
      let dist = l2dist(pt, this.p0);
      //grid vector not unit vectors! so we correct:
      let alpha = l2dist(this.p1, this.p0)/this.d;
      this.d = dist/alpha;
      this.liverender();
    }
  }

  mouseUp(e) {
    if(this.state != "off"){
      this.commit();
      this.state = "off";
      this.liverender();
    }
  }

  liverender() {
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
    //const v0 = RotationTransform(this.t).onVec(planarSymmetries[selectedsym].vec0);
    //const v1 = RotationTransform(this.t).onVec(planarSymmetries[selectedsym].vec1);
    const v0 = planarSymmetries[selectedsym].vec0;
    const v1 = planarSymmetries[selectedsym].vec1;
    let p0 = [this.x, this.y];
    let p1 = [(this.d * v0[0]) + this.x, (this.d * v0[1]) + this.y];
    let p2 = [(this.d * v1[0]) + this.x, (this.d * v1[1]) + this.y];
    this.p0 = p0; //save for canvas hit-detection
    this.p1 = p1;

    let newlattice = generateLattice(planarSymmetries[selectedsym],
                                  GRIDNX, GRIDNY,
                                  this.d, this.t,
                                  this.x, this.y);
    // Draw Lattice
    for (let af of newlattice) {
      let Tp0 = af.on(p0[0],p0[1]);
      let Tp1 = af.on(p1[0],p1[1]);
      let Tp2 = af.on(p2[0],p2[1]);
      lctx.beginPath();
      lctx.moveTo(Tp0[0],Tp0[1]);
      lctx.lineTo(Tp1[0],Tp1[1]);
      lctx.moveTo(Tp0[0],Tp0[1]);
      lctx.lineTo(Tp2[0],Tp2[1]);
      lctx.stroke();
    }

    const circR = this.pR;
    lctx.save();
    lctx.fillStyle = "rgba(0,0,0,0.1)";
    lctx.lineWidth = 4.0;
    if(this.state == "move"){ lctx.strokeStyle = "rgba(0,255,0,0.5)";}
    else {lctx.strokeStyle = "rgba(0,0,0,0.5)";}
    lctx.beginPath();
    lctx.arc(p0[0], p0[1], circR, 0, 2*Math.PI);
    lctx.stroke();
    lctx.fill();
    if(this.state == "scale"){ lctx.strokeStyle = "rgba(0,255,0,0.5)";}
    else {lctx.strokeStyle = "rgba(0,0,0,0.5)";}
    lctx.beginPath();
    lctx.arc(p1[0], p1[1], circR, 0, 2*Math.PI);
    lctx.stroke();
    lctx.fill();
    lctx.restore();
  }
}


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
  }

  serialize(){
    return ["line", this.start, this.end];
  }

  deserialize(data){
    return new LineOp(data[1], data[2]);
  }
}

class FancyLineTool {
  constructor() {
    this.start = {};
    this.end = {};
    this.state = "init";
    this.drawInterval = 0;
    this.pR = 4
  }

  liverender() {
    lctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let af of affineset) {
      const Tp1 = af.on(this.start.x, this.start.y);
      const Tp2 = af.on(this.end.x, this.end.y);
      lctx.line(Tp1[0], Tp1[1], Tp2[0], Tp2[1]);
    }
    lctx.save();
    lctx.fillStyle = "rgba(255,0,0,0.2)";
    lctx.lineWidth = 1.0;
    lctx.strokeStyle = "rgba(255,0,0,1.0)";
    lctx.beginPath();
    lctx.arc(this.start.x-1, this.start.y-1, this.pR, 0, 2*Math.PI);
    lctx.stroke();
    lctx.fill();
    lctx.beginPath();
    lctx.arc(this.end.x-1, this.end.y-1, this.pR, 0, 2*Math.PI);
    lctx.stroke();
    lctx.fill();
    lctx.restore();
  }

  commit() {
    cmdstack.push( new LineOp(this.start, this.end) );
    rerender(ctx);
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
  }

  cancel() {
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
    this.state = "init";
    this.start = {};
    this.end = {};
  }

  mouseDown(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];
    if(l2dist(pt,[this.start.x,this.start.y])<this.pR) {
      this.state = "moveStart";
    } else if(l2dist(pt,[this.end.x,this.end.y])<this.pR) {
      this.state = "moveEnd";
    } else {
      if(this.state=="off") {
        this.commit();
      }
      this.state = "newLine";
      this.start = { x: pt[0], y: pt[1] };
    }
  }

  mouseMove(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];
    if (this.state == "newLine") {
      if (this.drawInterval <= 0) {
        this.end = { x: pt[0], y: pt[1] };
        this.liverender();
        this.drawInterval = 1;
      }
      this.drawInterval--;
    }
    else if (this.state == "moveStart") {
      this.start = { x: pt[0], y: pt[1] };
      this.liverender();
    }
    else if (this.state == "moveEnd") {
      this.end = { x: pt[0], y: pt[1] };
      this.liverender();
    }
  }

  mouseUp(e) {
    this.state = "off";
  }

  mouseLeave(e) {
    this.exit();
  }

  keyDown(e) {
    console.log("recvd", e);
    if(e.code == "Enter"){
      this.state = "off";
      this.commit();
      this.start = {};
      this.end = {};
    } else if(e.code=="Escape"){
      this.cancel();
    }
  }

  exit(){
    if(this.state=="off") {
      this.commit();
      this.start = {};
      this.end = {};
      this.state = "init";
    }
  }
}



// Draw Raw Mousepath (Pencil)
//------------------------------------------------------------------------------
//TODO: add smoothing factor
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
    //console.log("penciltool mdown");
    var rect = canvas.getBoundingClientRect(); //XXX: which canvas appropriate?
    this.points.push({ x: e.clientX - rect.left,
                       y: e.clientY - rect.top});
    this.on = true;
  }

  mouseMove(e) {
    if (this.on) {
      //console.log("penciltool mmov");
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
    //console.log("penciltool mup");
    this.on = false;
    this.commit();
    this.points = [];
  }
}


class PolyOp {
  constructor(points) {
    this.points = points;
  }

  render(ctx) {
    for (let af of affineset) {
      ctx.beginPath();
      let Tpt = af.on(this.points[0][0], this.points[0][1]);
      ctx.moveTo(Tpt[0], Tpt[1]);
      for(let pt of this.points.slice(1)) {
        Tpt = af.on(pt[0], pt[1]);
        ctx.lineTo(Tpt[0], Tpt[1]);
      }
      ctx.closePath(); //necessary?
      ctx.stroke();
      ctx.fill();
    }
  }

  serialize() {
    return ["polygon", this.points];
  }

  deserialize(data) {
    return new PolyOp(data[1]);
  }
}

const _INIT = 0;
const _OFF  = 1;
const _ON   = 2;
const _MOVE = 3;
class PolyTool {
  constructor() {
    this.points = [];
    this.state = _INIT;
    this.selected = -1;
    this.pR = 4;
  }

  liverender() {
    lctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let af of affineset) {
      lctx.beginPath();
      let Tpt = af.on(this.points[0][0], this.points[0][1]);
      lctx.moveTo(Tpt[0], Tpt[1]);
      for(let pt of this.points.slice(1)) {
        Tpt = af.on(pt[0], pt[1]);
        lctx.lineTo(Tpt[0], Tpt[1]);
      }
      lctx.stroke();
      if(this.points.length > 2) {
        lctx.fill();
      }
    }

    // draw handles
    lctx.save();
    lctx.lineWidth = 1.0;
    lctx.fillStyle   = "rgba(255,0,0,0.2)";
    lctx.strokeStyle = "rgba(255,0,0,1.0)";
    for(let pt of this.points) {
      lctx.beginPath();
      lctx.arc(pt[0]-1, pt[1]-1, this.pR, 0, 2*Math.PI);
      lctx.stroke();
      lctx.fill();
    }
    lctx.restore();
  }

  commit() {
    cmdstack.push( new PolyOp(this.points) );
    rerender(ctx);
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
  }

  cancel() {
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
    this.state = _INIT;
    this.points = [];
  }

  mouseDown(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];

    if(this.state == _OFF) {
      let onPoint=false;
      for(let idx=0; idx<this.points.length; idx++) {
        if(l2dist(pt,this.points[idx])<this.pR) {
          this.state = _MOVE;
          this.selected = idx;
          onPoint = true;
          break;
        }
      }
      if(!onPoint){
        this.state = _ON;
        this.selected = this.points.length;
        this.points.push( [pt[0], pt[1]] );
        this.liverender();
      }
    }
    else if(this.state == _INIT) {
      this.state = _ON;
      this.points = [ [pt[0], pt[1]] ];
      this.selected = 0; //?
      this.liverender();
    }
    else if(this.state == _ON) {
      this.selected += 1;//this.state + 1;
      this.points.push( [pt[0], pt[1]] );
      this.liverender();
    }
  }

  mouseMove(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];

    if (this.state == _ON) {
      this.points[this.points.length-1] = [pt[0], pt[1]];
      this.liverender();
    }
    if (this.state == _MOVE) {
      this.points[this.selected] = [pt[0], pt[1]];
      this.liverender();
    }

  }

  mouseUp(e) {
    this.state = _OFF;
  }

  mouseLeave(e) {
    this.exit();
  }

  keyDown(e) {
    console.log("poly recvd", e);
    if(e.code == "Enter"){
      this.state = _OFF;
      this.commit();
      this.points = [];
      this.selected = 0;
    } else if(e.code=="Escape"){
      this.cancel();
    } else if(e.code=="KeyD"){
      if(this.points.length > 1 &&
         this.state == _OFF) {
        this.points.pop();
        this.selected -= 1;
        this.liverender();
      }
    }
  }

  exit(){
    if(this.state==_OFF) {
      if(this.points.length >2){
        this.commit();
      }
      this.points = [];
      this.selected = 0;
      this.state = _INIT;
    }
  }
}


class BezierOp {
  constructor(ops) {
    this.ops = ops;
  }
  //["M",x,y]
  //["L",x,y]
  //["C",x,y,xc1,yc1,x]

  render(ctx) {
    for (let af of affineset) {
      for(let op of this.ops){
        ctx.beginPath();
        if(op[0] == "M") {
          let Tpt = af.on(op[1], op[2]);
          ctx.moveTo(Tpt[0], Tpt[1]);
        }
        else if(op[0] == "L") {
          let Tpt = af.on(op[1], op[2]);
          ctx.lineTo(Tpt[0], Tpt[1]);
        }
        else if(op[0] == "C"){
          let Tpt0 = af.on(op[1], op[2]);
          let Tpt1 = af.on(op[3], op[4]);
          let Tpt2 = af.on(op[5], op[6]);
          ctx.bezierCurveTo(Tpt0[0], Tpt0[1], Tpt1[0], Tpt1[1], Tpt2[0], Tpt2[1]);
        }
      }
      ctx.stroke();
      ctx.fill();
    }
  }

  serialize() {
    return ["bezier", this.ops];
  }

  deserialize(data) {
    return new PolyOp(data[1]);
  }
}

class BezierTool {
  constructor() {
    this.ops = [];
    this.state = _INIT;
    this.cpoint = [];
    this.opselected = [];
    this.pR = 4;
  }

  liverender() {
    lctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let af of affineset) {
      lctx.beginPath();
      for(let op of this.ops){
        if(op[0] === "M") {
          let Tpt = af.on(op[1], op[2]);
          lctx.moveTo(Tpt[0], Tpt[1]);
        }
        else if(op[0] === "L") {
          let Tpt = af.on(op[1], op[2]);
          lctx.lineTo(Tpt[0], Tpt[1]);
        }
        else if(op[0] === "C"){
          let Tpt0 = af.on(op[1], op[2]);
          let Tpt1 = af.on(op[3], op[4]);
          let Tpt2 = af.on(op[5], op[6]);
          lctx.bezierCurveTo(Tpt0[0], Tpt0[1], Tpt1[0], Tpt1[1], Tpt2[0], Tpt2[1]);
        }
      }
      lctx.stroke();
      lctx.fill();
    }

    let lastpt = [];
    // draw handles
    lctx.save();
    lctx.lineWidth = 1.0;
    lctx.fillStyle   = "rgba(255,0,0,0.2)";
    lctx.strokeStyle = "rgba(255,0,0,1.0)";
    for(let op of this.ops) {
      if(op[0] == "M") {
        lctx.beginPath();
        lctx.arc(op[1], op[2], this.pR, 0, 2*Math.PI);
        lctx.stroke();
        lctx.fill();
        lastpt = [op[1], op[2]];
      }
      else if(op[0] == "L") {
        lctx.beginPath();
        lctx.arc(op[1], op[2], this.pR, 0, 2*Math.PI);
        lctx.stroke();
        lctx.fill();
        lastpt = [op[1], op[2]];
      }
      else if(op[0] == "C") {
        //endpoint
        lctx.beginPath();
        lctx.arc(op[5], op[6], this.pR, 0, 2*Math.PI);
        lctx.stroke();
        lctx.fill();
        //control points
        lctx.save();
        lctx.fillStyle = "rgba(255,0,0,1.0)";
        lctx.beginPath();
        lctx.arc(op[1], op[2], this.pR-2, 0, 2*Math.PI);
        lctx.stroke();
        lctx.fill();
        lctx.beginPath();
        lctx.arc(op[3], op[4], this.pR-2, 0, 2*Math.PI);
        lctx.stroke();
        lctx.fill();
        // handle lines for control points
        lctx.beginPath();
        lctx.moveTo(lastpt[0],lastpt[1]);
        lctx.lineTo(op[1],op[2]);
        lctx.stroke();
        lctx.beginPath();
        lctx.moveTo(op[3],op[4]);
        lctx.lineTo(op[5],op[6]);
        lctx.stroke();
        lctx.restore();
        lastpt = [op[5], op[6]];
      }
    }
    if(this.cpoint.length > 0){ //temp control point render
      lctx.save();
      lctx.fillStyle = "rgba(255,0,0,1.0)";
      lctx.beginPath();
      lctx.arc(this.cpoint[0], this.cpoint[1], this.pR-2, 0, 2*Math.PI);
      lctx.stroke();
      lctx.fill();
      // handle line
      lctx.beginPath();
      lctx.moveTo(lastpt[0],lastpt[1]);
      lctx.lineTo(this.cpoint[0],this.cpoint[1]);
      lctx.stroke();
      lctx.restore();
    }
    lctx.restore();
  }

  mouseDown(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];

    if(this.state == _INIT) { // NEW PATH
      this.state = _ON;
      this.ops = [ ["M", pt[0], pt[1]] ];
      this.liverender();
    }
    else if(this.state == _OFF) { // EXTANT PATH
      //-----------------------------------------------------------------------------
      // Adjustment of existing points
      // control-points and endpoints can overlap at discontinuities!
      // 4 possibilities:
      // - no overlap of control points
      // - previous control point, current endpoint
      // - current endpoint and next control point
      // - previous control point, current endpoint and next
      //   control point can all overlap
      let onPoint=false;
      for(let idx=0; idx<this.ops.length; idx++) {
        let op = this.ops[idx];
        if(op[0]=="M" || op[0] == "L") {
          if(l2dist(pt, [op[1],op[2]])<this.pR) {
            this.state = _MOVE;
            this.opselected = [[idx,0]];
            //this.ptselected = 0;
            onPoint = true;

            // does this endpoint overlap with a following control point?
            if(idx+1 < this.ops.length && this.ops[idx+1][0]=="C") {
              let nextop = this.ops[idx+1];
              let overlap = l2dist([op[1], op[2]], [nextop[1], nextop[2]]) < 1.0e-6;
              if(overlap){ this.opselected.push([idx+1,0]); }
            }
            break;
          }
        }
        else if(op[0]=="C") {
          // curve endpoint
          if(l2dist(pt, [op[5], op[6]])<this.pR) {
            this.state = _MOVE;
            this.opselected = [[idx,2]];
            onPoint = true;

            // does this endpoint overlap with it's previous control point?
            let overlap1 = l2dist([op[3], op[4]], [op[5], op[6]]) < 1.0e-6;
            if(overlap1){ this.opselected.push([idx,1]); }

            // does this endpoint overlap with a following control point?
            if(idx+1 < this.ops.length && this.ops[idx+1][0]=="C"){
              let nextop = this.ops[idx+1];
              let overlap2 = l2dist([op[5], op[6]], [nextop[1], nextop[2]]) < 1.0e-6;
              if(overlap2){ this.opselected.push([idx+1,0]); }
            }

            break;
          }

          // curve control-points - overlap ruled out by above cases
          if(l2dist(pt, [op[1], op[2]])<this.pR) {
            this.state = _MOVE;
            this.opselected = [[idx, 0]];
            onPoint = true;
            break;
          }
          if(l2dist(pt, [op[3], op[4]])<this.pR) {
            this.state = _MOVE;
            this.opselected = [[idx, 1]];
            onPoint = true;
            break;
          }
        }
      }
      //-----------------------------------------------------------------------------
      // Adding New Points
      if(!onPoint){
        if(this.cpoint.length === 0) {
          this.state = _ON;
          this.ops.push( ["L", pt[0], pt[1]] );
          this.liverender();
        } else {
          this.state = _ON;
          this.ops.push( ["C",
                             this.cpoint[0], this.cpoint[1],
                             pt[0], pt[1],
                             pt[0], pt[1] ] );
          this.cpoint = []; //clear tmp control pt
          this.liverender();
        }
      }
    }
  }

  getOpEndPoint(op){
    if(op[0]=="M"){return [op[1],op[2]];}
    else if(op[0]=="L"){return [op[1],op[2]];}
    else if(op[0]=="C"){return [op[5],op[6]];}
  }

  reflectPoint(pt0, pt1){
    let dx = pt1[0] - pt0[0];
    let dy = pt1[1] - pt0[1];
    return [pt0[0]-dx, pt0[1]-dy];
  }

  //could simplify this by not using L ops at all, just twiddling C ops
  //then at end of commit() convert C ops representing lines to L ops... i think?
  mouseMove(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];

    if (this.state == _ON) {
      if(this.ops[this.ops.length-1][0]=="M"){
        this.cpoint = [pt[0], pt[1]]; //tmp pt
        this.liverender();
      }
      //complicated, upconvert line operation to curve operation
      else if(this.ops[this.ops.length-1][0]=="L"){
        let thisop = this.ops[this.ops.length-1];
        let prevop = this.ops[this.ops.length-2];
        let thispt = this.getOpEndPoint(thisop); //line endpoint
        let prevpt = this.getOpEndPoint(prevop); //line startpoint
        let reflpt = this.reflectPoint(thispt, pt);
        this.ops[this.ops.length-1]=["C",
                                     prevpt[0], prevpt[1],
                                     reflpt[0], reflpt[1],
                                     thispt[0], thispt[1]];
        this.cpoint = [pt[0], pt[1]]; //tmp pt
        this.liverender();
      }
      else if(this.ops[this.ops.length-1][0]=="C"){
        let thisop = this.ops[this.ops.length-1];
        let thispt = this.getOpEndPoint(thisop); //line endpoint
        let reflpt = this.reflectPoint(thispt, pt);
        this.ops[this.ops.length-1]=["C",
                                     thisop[1], thisop[2],
                                     reflpt[0], reflpt[1],
                                     thispt[0], thispt[1]];
        this.cpoint = [pt[0], pt[1]]; //tmp pt
        this.liverender();
      }
    }
    else if(this.state == _MOVE) {
      //console.log(this.opselected);
      for(let hit of this.opselected){
        let idx = hit[0];
        let ptidx = hit[1];
        //console.log("hit",hit[0],hit[1]);
        this.ops[idx][2*ptidx + 1] = pt[0];
        this.ops[idx][2*ptidx + 2] = pt[1];
      }
      this.liverender();
    }
  }

  mouseUp(e) {
    this.state = _OFF;
    this.opselected = [];
    this.liverender();
    //console.log(this.ops);
  }

  mouseLeave(e) {
    this.exit();
  }

  keyDown(e) {
    console.log("poly recvd", e);
    if(e.code == "Enter"){
      this.state = _OFF;
      this.exit();
    } else if(e.code=="Escape"){
      this.cancel();
    } else if(e.code=="KeyD"){
      if(this.ops.length > 1 &&
         this.state == _OFF) {
        this.ops.pop();
        this.liverender();
      }
    }
  }

  commit() {
    cmdstack.push( new BezierOp(this.ops) );
    rerender(ctx);
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
  }

  cancel() {
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
    this.state = _INIT;
    this.ops = [];
  }

  exit(){
    if(this.state==_OFF) { // remove conditional?
      this.commit();
      this.ops = [];
      this.opselected = [];
      this.cpoint = [];
      this.state = _INIT;
    }
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
      ctx.fill();
    }
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
      lctx.fill();
    }
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
  line: new FancyLineTool(),
  circle: new CircleTool(),
  pencil: new PencilTool(),
  grid: new GridTool(),
  poly: new PolyTool(),
  bezier: new BezierTool()
};

var curTool = "line";

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


// Set up Save SVG / Save PNG
//------------------------------------------------------------------------------
// XXX: this can take a long damn time with a complicated scene! At minimum should
// do redraws with smaller grid Nx,Ny by default or just restrict SVG export to
// tile?
document.getElementById("saveSVG").onmousedown = function(e) {
  // canvas2svg fake context:
  C2Sctx = new C2S(canvas.width, canvas.height);
  C2Sctx.line = drawLine;
  rerender(C2Sctx);
  //serialize your SVG
  var mySerializedSVG = C2Sctx.getSerializedSvg(); // options?
  //save text blob as SVG
  var blob = new Blob([mySerializedSVG], {type: "image/svg+xml"});
  saveAs(blob, "eschersketch.svg");
};

document.getElementById("savePNG").onmousedown = function(e) {
    canvas.toBlob(blob => saveAs(blob, "eschersketch.png"));
};



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
  //HACK: set global
  pixelratio = ratio;

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


// should be "reset"
var initState = function() {
  cmdstack.push(new ColorOp(
    "stroke",
    strokecolor.r,
    strokecolor.g,
    strokecolor.b,
    strokecolor.a));

  cmdstack.push(new ColorOp(
    "fill",
    fillcolor.r,
    fillcolor.g,
    fillcolor.b,
    fillcolor.a));

  cmdstack.push(new StyleOp({
    lineCap: "butt",
    lineJoin: "round",
    miterLimit: 10.0,
    lineWidth: 1.0}));

  var gridcopy = {x:gridstate.x, y:gridstate.y, d:gridstate.d, t:gridstate.t};
  cmdstack.push(new SymmOp(
    allsyms[allsyms.length-1],
    gridcopy));

  // set global undo boundary so these initial
  // settings don't get lost (needed for drawstate stability
  // during reset on redraw)
  undo_init_bound = 4;

  rerender(ctx);
};


var initGUI = function() {

  canvas = document.getElementById("sketchrender");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  pixelFix(canvas);
  ctx = canvas.getContext("2d");
  ctx.line = drawLine;
  //ctx.fillStyle = "rgb(0, 255, 255)";

  livecanvas = document.getElementById("sketchlive");
  livecanvas.width = CANVAS_WIDTH;
  livecanvas.height = CANVAS_HEIGHT;
  pixelFix(livecanvas);
  lctx = livecanvas.getContext("2d");
  lctx.line = drawLine;
  //lctx.fillStyle =   "rgb(0, 255, 255)";

  livecanvas.onmousedown = dispatchMouseDown;
  livecanvas.onmouseup   = dispatchMouseUp;
  livecanvas.onmousemove = dispatchMouseMove;
  livecanvas.onmouseleave = dispatchMouseLeave;
  document.getElementsByTagName("body")[0].onkeydown = dispatchKeyDown;

  initState();

  doHACKS();

  // style init...
  document.getElementById("fillcolor").style.display="none";
  document.getElementById("strokecolor").style.display="block";

};


// Temporary HACKs (remove this shite)
var doHACKS = function() {
  //harmonize vue color picker style... need to fix in source...
  var _els = document.getElementsByClassName("vue-color__chrome");
  for(let _el of _els){
    _el.style.boxShadow="none";
  }
  _els = document.getElementsByClassName("vue-color__chrome__chrome-body");
  for(let _el of _els){
    _el.style.backgroundColor="#f9f9f9";
  }
};
