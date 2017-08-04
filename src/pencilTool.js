//------------------------------------------------------------------------------
//
// Eschersketch - A drawing program for exploring symmetrical designs
//
//
// Copyright (c) 2017 Anselm Levskaya (http://anselmlevskaya.com)
// Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
// license.
//
//------------------------------------------------------------------------------

// DRAWING GLOBALS
import {gS, gCONSTS,
        livecanvas, lctx, canvas, ctx, lattice,
        affineset, updateSymmetry, pressure,
        commitOp
       } from './main';
import { _ } from 'underscore';
//import {l2dist} from './math_utils';
import {parseColor} from './canvas_utils';


// Draw Raw Mousepath (Pencil)
//------------------------------------------------------------------------------
//TODO: add smoothing factor
export class PencilOp {
  constructor(ctxStyle, points) {
    this.ctxStyle = ctxStyle;
    this.points = points;
    this.tool = "pencil";
    this.symmState = _.clone(gS.symmState);
  }

  render(ctx){
    //if(this.points.length==0){return;} //empty data case
    _.assign(ctx, this.ctxStyle);
    updateSymmetry(this.symmState);
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
}


//State Labels
const _INIT_ = 0;
const _OFF_  = 1;
const _ON_   = 2;
const _MOVE_ = 3;

export class PencilTool {
  constructor() {
    this.points = [];
    this.state = _INIT_;
    this.liverender = this.liverender_fast;
  }

  liverender_precise() {
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

  liverender_fast() {
    lctx.save();
    // correct alpha to give accurate preview transparency given the 3-pt line overlap that this hack uses:
    let alpha = parseColor(lctx.strokeStyle)[3];
    lctx.globalAlpha = 0.5 + 0.5*Math.pow(alpha,2);

    if(this.points.length >= 3) {
      for (let af of affineset) {
        const Tpt0 = af.on(this.points[this.points.length-3].x, this.points[this.points.length-3].y);
        const Tpt1 = af.on(this.points[this.points.length-2].x, this.points[this.points.length-2].y);
        const Tpt2 = af.on(this.points[this.points.length-1].x, this.points[this.points.length-1].y);
        // A global pressure var from pressure.js actually works... hmm!
        //lctx.save();
        //lctx.lineWidth = pressure*30;
        //lctx.strokeStyle = "rgba(200,100,100,"+pressure+")";
        lctx.beginPath();
        lctx.moveTo(Tpt0[0], Tpt0[1]);
        lctx.lineTo(Tpt1[0], Tpt1[1]);
        lctx.lineTo(Tpt2[0], Tpt2[1]);
        lctx.stroke();
        //lctx.restore();
      }
    } else if(this.points.length >= 2){
      for (let af of affineset) {
        const Tpt0 = af.on(this.points[this.points.length-2].x, this.points[this.points.length-2].y);
        const Tpt1 = af.on(this.points[this.points.length-1].x, this.points[this.points.length-1].y);
        lctx.beginPath();
        lctx.moveTo(Tpt0[0], Tpt0[1]);
        lctx.lineTo(Tpt1[0], Tpt1[1]);
        lctx.stroke();
      }
    }
    lctx.restore();
  }

  enter(op){
    if(op){
        _.assign(gS.ctxStyle, _.clone(op.ctxStyle));
        _.assign(lctx, op.ctxStyle);
        this.ctxStyle = _.clone(op.ctxStyle); //not really necessary...
        _.assign(gS.symmState, op.symmState)
        updateSymmetry(op.symmState);
        this.points = op.points;
        this.state = _OFF_;
        this.liverender_precise();
    } else{
      this.points = [];
      this.state = _INIT_;
    }
  }

  exit(){
    this.points = [];
    this.state = _INIT_;
  }

  commit() {
    if(this.state===_INIT_){return;} //empty data case
    let ctxStyle = _.assign({}, _.pick(lctx, ...gCONSTS.CTXPROPS));
    commitOp(new PencilOp(ctxStyle, _.clone(this.points)));
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
  }

  cancel() { //not used, just here for consistency
    this.points = [];
    this.state = _INIT_;
  }

  mouseDown(e) {
    if(this.state==_OFF_) {
      this.commit();
    }
    this.state = _ON_;
    var rect = livecanvas.getBoundingClientRect();
    this.points = [{x: e.clientX - rect.left,
                    y: e.clientY - rect.top}];
  }

  mouseMove(e) {
    if (this.state == _ON_) {
        var rect = livecanvas.getBoundingClientRect();
        this.points.push({ x: e.clientX - rect.left,
                           y: e.clientY - rect.top});
        this.liverender();
    }
  }

  mouseUp(e) {
    if(this.state != _INIT_){
      this.commit();
      this.points = [];
      this.state = _INIT_;
    }
  }
}
