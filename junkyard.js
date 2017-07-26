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
