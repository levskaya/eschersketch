// simple canvas line method
const drawLine = function(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

class LineTool {
  constructor() {
    this.start = {};
    this.end = {};
    this.on = false;
    this.drawInterval = 0;
  }

  liverender() {
    lctx.clearRect(0, 0, canvas.width, canvas.height);
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


/*  Magic Wand Tool FAIL
 *  ...basically I'm making a vector-drawing app.
 *  it is highly nontrivial to mix pixel-oriented operations like magic-wand-floodfill
 *  and derived polygon traces and have it produce good-looking results...
 *  the below mess was close to "working" but looked like shit.
 *
 *  For now, I shall stick to true vector operations...  if I built a grid-snap tool for
 *  endpts and intersections one could manually overlay filled polygons to achieve the same
 *  effect in proper vector form...
 */
class PolyOp {
  constructor(points) {
    this.points = points;
  }

  __render(ctx) {
    for (let af of affineset) {
      ctx.beginPath();
      let Tpt = af.on(this.points[0][0], this.points[0][1]);
      ctx.moveTo(Tpt[0], Tpt[1]);
      for(let pt of this.points.slice(1)) {
        Tpt = af.on(pt[0], pt[1]);
        ctx.lineTo(Tpt[0], Tpt[1]);
      }
      ctx.closePath();//?
      //ctx.stroke();
      ctx.fill();
    }
  }
  //HACK tmp check:
  render(ctx) {
    ctx.beginPath();
    let Tpt = [this.points[0][0], this.points[0][1]];
    ctx.moveTo(Tpt[0], Tpt[1]);
    for(let pt of this.points.slice(1)) {
      Tpt = [pt[0], pt[1]];
      ctx.lineTo(Tpt[0], Tpt[1]);
    }
    //ctx.closePath();//?
    //ctx.stroke();
    ctx.fill();
  }

  serialize() {
    return ["polygon", this.points];
  }

  deserialize(data) {
    return new PolyOp(data[1]);
  }
}


class MagicFillTool {
  constructor() {
    this.pts=[];
    this.threshold = 50;
    this.blurRadius = 10;
  }

  liverender() {
    //lctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  commit() {
    cmdstack.push( new PolyOp(this.pts) );
    rerender(ctx);
    //lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
  }

  genpoly(_x, _y){
    // XXX: if ctx has a scale transform (e.g. for retina pixelfix) we have to correct for
    // our screen coordinates to get accurate pixel coordinates!
    // amazingly there is no standard way of obtaining a context's current transform,
    // ctx.currentTransform is defunct, ctx.getTransform is spec'd now, but nobody implements it
    let x = pixelratio * _x;
    let y = pixelratio * _y;

    // const _h = 800;
    // const _w = 2*_h;
    // var imgdata = ctx.getImageData(x-_h, y-_h, _w, _w);
    // var image = {
    //   data: imgdata.data,
    //   width: _w,
    //   height: _w,
    //   bytes: 4
    // };
    // var mask = MagicWand.floodFill(image, _h, _h, 10);
    // var newData = ctx.createImageData(_w,_w);
    // for(var i=0; i<_w; i++){
    //   for(var j=0; j<_w; j++){
    //     newData.data[i*4*_w + 4*j + 0] = 100*mask.data[i*_w + j];
    //     newData.data[i*4*_w + 4*j + 1] = 0;
    //     newData.data[i*4*_w + 4*j + 2] = 0;
    //     newData.data[i*4*_w + 4*j + 3] = 255;
    //   }
    // }
    // ctx.putImageData(newData,x-_h,y-_h);

    /*
    console.log("pixel color at", x, y, " = ",
                imgdata.data[(y*imgdata.width + x)*4 + 0],
                imgdata.data[(y*imgdata.width + x)*4 + 1],
                imgdata.data[(y*imgdata.width + x)*4 + 2],
                imgdata.data[(y*imgdata.width + x)*4 + 3]);
    //var tmpdata = ctx.getImageData(x, y, 1, 1);
    //console.log(tmpdata.data[0],tmpdata.data[1],tmpdata.data[2],tmpdata.data[3]);
    */

    var imgdata = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var image = {
      data: imgdata.data,
      width: canvas.width,
      height: canvas.height,
      bytes: 4
    };
    var mask = MagicWand.floodFill(image, x, y, this.threshold);
    mask = MagicWand.gaussBlurOnlyBorder(mask, this.blurRadius);

    console.log("mask bounds ",mask.bounds.minX, mask.bounds.maxX, mask.bounds.minY, mask.bounds.maxY);

    /*
    var newData = ctx.createImageData(canvas.width, canvas.height);
    for(let i=0; i<newData.height; i++){
      for(let j=0; j<newData.width; j++){
        newData.data[i*4*newData.width + 4*j + 0] = fillcolor.r*mask.data[i*newData.width + j];
        newData.data[i*4*newData.width + 4*j + 1] = fillcolor.g*mask.data[i*newData.width + j];
        newData.data[i*4*newData.width + 4*j + 2] = fillcolor.b*mask.data[i*newData.width + j];
        newData.data[i*4*newData.width + 4*j + 3] = fillcolor.a*255*mask.data[i*newData.width + j];
      }
    }*/
    for(let i=0; i<imgdata.height; i++){
      for(let j=0; j<imgdata.width; j++){
        if(mask.data[i*imgdata.width + j] > 0) {
          imgdata.data[i*4*imgdata.width + 4*j + 0] = fillcolor.r*mask.data[i*imgdata.width + j];
          imgdata.data[i*4*imgdata.width + 4*j + 1] = fillcolor.g*mask.data[i*imgdata.width + j];
          imgdata.data[i*4*imgdata.width + 4*j + 2] = fillcolor.b*mask.data[i*imgdata.width + j];
          imgdata.data[i*4*imgdata.width + 4*j + 3] = fillcolor.a*255*mask.data[i*imgdata.width + j];
        }
      }
    }
    ctx.putImageData(imgdata,0,0);

    var cs = MagicWand.traceContours(mask);
    const simplifyTolerant = 0;
    const simplifyCount = 30;
    cs = MagicWand.simplifyContours(cs, simplifyTolerant, simplifyCount);
    console.log("cs length ", cs.length);

    var polypts=[];
    //for (var i = 0; i < cs.length; i++) {
    //  if (cs[i].inner) continue;
    var ps = cs[0].points;
    //ctx.moveTo(ps[0].x, ps[0].y);
    polypts.push([ps[0].x/2, ps[0].y/2]);
    for (var j = 1; j < ps.length; j++) {
      polypts.push([ps[j].x/2, ps[j].y/2]);
      //ctx.lineTo(ps[j].x, ps[j].y);
    }
    //}
    this.pts=polypts;
    //this.commit();
  }

  mouseDown(e) {
    var rect = livecanvas.getBoundingClientRect(); //XXX: which canvas appropriate?
    //console.log(rect);
    var pt = { x: e.clientX - rect.left,
               y: e.clientY - rect.top };
    this.genpoly(pt.x, pt.y);
  }

  mouseMove(e) {}

  mouseUp(e) {}
}



// Old Bezier Tool
class BezierOp {
  constructor(points) {
    this.points = points;
  }

  render(ctx) {
    for (let af of affineset) {
      ctx.beginPath();
      if(this.points.length >= 4) {
        let Tpt = af.on(this.points[0][0], this.points[0][1]);
        ctx.moveTo(Tpt[0], Tpt[1]);
        for(let idx=1; idx < this.points.length; idx+=3) {
          if(this.points.length-idx < 3){ break; }
          let pt0 = this.points[idx];
          let pt1 = this.points[idx+1];
          let pt2 = this.points[idx+2];
          let Tpt0 = af.on(pt0[0], pt0[1]);
          let Tpt1 = af.on(pt1[0], pt1[1]);
          let Tpt2 = af.on(pt2[0], pt2[1]);
          ctx.bezierCurveTo(Tpt0[0], Tpt0[1], Tpt1[0], Tpt1[1], Tpt2[0], Tpt2[1] );
        }
        ctx.stroke();
        ctx.fill();
      }
    }
  }

  serialize() {
    return ["bezier", this.points];
  }

  deserialize(data) {
    return new PolyOp(data[1]);
  }
}

class BezierTool {
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
      if(this.points.length >= 4) {
        let Tpt = af.on(this.points[0][0], this.points[0][1]);
        lctx.moveTo(Tpt[0], Tpt[1]);
        for(let idx=1; idx < this.points.length; idx+=3) {
          if(this.points.length-idx < 3){ break; }
          let pt0 = this.points[idx];
          let pt1 = this.points[idx+1];
          let pt2 = this.points[idx+2];
          let Tpt0 = af.on(pt0[0], pt0[1]);
          let Tpt1 = af.on(pt1[0], pt1[1]);
          let Tpt2 = af.on(pt2[0], pt2[1]);
          lctx.bezierCurveTo(Tpt0[0], Tpt0[1], Tpt1[0], Tpt1[1], Tpt2[0], Tpt2[1] );
        }
        lctx.stroke();
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
    cmdstack.push( new BezierOp(this.points) );
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



// this works...
// Enable Touch Events via Hammer.js
//var VueTouch = require('vue-touch')
//Vue.use(VueTouch, {name: 'v-touch'});
var vueTest = new Vue({
  el: '#testUI',
  template: `<v-touch class="button" @tap="tappyTap">Tap me!</v-touch>`,
  data: {},
  methods: {
    tappyTap: function(e){
      console.log("tap", e);
      console.log("tap", e.target);
      if(e.target.classList.contains("selected")){
        e.target.classList.remove("selected");
      } else {
        e.target.classList.add("selected");
      }
    }
  }
});


const hexgrids = ["hexgrid","p3","p6","p31m","p3m1","p6m"];
const diaggrids = ["diagonalgrid","cm","cmm"];
const squaregrids = ["squaregrid","p1","pm","pg","pmg","pgg","pmm","p2","p4","p4g","p4m"];

  if(hexgrids.includes(gS.params.symstate)){
    //let dX = Math.abs(v0[0]+v0[0]) * gS.symmState.d * pixelratio;
    //let dY = Math.abs(v0[1]+v0[1]) * gS.symmState.d * pixelratio;
    dX = Math.sqrt(3) * gS.symmState.d * pixelratio;
    dY = 3 * gS.symmState.d * pixelratio;
  }
  else if(diaggrids.includes(gS.params.symstate)){
    dX = Math.sqrt(2) * gS.symmState.d * pixelratio;
    dY = Math.sqrt(2) * gS.symmState.d * pixelratio;
  } else {
    dX = gS.symmState.d * pixelratio;
    dY = gS.symmState.d * pixelratio;
  }



  <select style="font-size:16px" class="button">
    <option value="p1">p1</option>
    <option value="diag">diag</option>
    <option value="pm">pm</option>
    <option value="cm">cm</option>
    <option value="pg">pg</option>
    <option value="pmg">pmg</option>
    <option value="pgg">pgg</option>
    <option value="pmm">pmm</option>
    <option value="p2">p2</option>
    <option value="cmm">cmm</option>
    <option value="p4">p4</option>
    <option value="p4g">p4g</option>
    <option value="p4m">p4m</option>
    <option value="hexgrid">hexgrid</option>
    <option value="p3">p3</option>
    <option value="p6">p6</option>
    <option value="p31m">p31m</option>
    <option value="p3m1">p3m1</option>
    <option value="p6">p6</option>
  </select>
