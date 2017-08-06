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
import {gS,
        livecanvas, lctx, canvas, ctx,
        affineset, updateSymmetry,
        commitOp
       } from './main';

import {l2dist} from './math_utils';
import {_} from 'underscore';

// Draw Circles
//------------------------------------------------------------------------------
export class CircleOp {
  constructor(ctxStyle, center, radius) {
    this.tool = "circle";
    this.center = center;
    this.radius = radius;
    this.ctxStyle = _.clone(ctxStyle);
    this.symmState = _.clone(gS.symmState);
  }

  render(ctx){
    _.assign(ctx, this.ctxStyle);
    updateSymmetry(this.symmState);
    for (let af of affineset) {
      const Tc1 = af.onVec(this.center);
      const Tr = this.radius; //XXX: not true for scaling trafos! fix!
      ctx.beginPath();
      ctx.arc(Tc1[0], Tc1[1], Tr, 0, 2*Math.PI);
      ctx.stroke();
      ctx.fill();
    }
  }
}

//State Labels
const _INIT_ = 0;
const _OFF_  = 1;
const _ON_   = 2;
const _MOVE_ = 3;

export class CircleTool {
  constructor() {
    this.center = [];
    this.radius = 0;
    this.state = _INIT_;
  }

  liverender() {
    lctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let af of affineset) {
      const Tc1 = af.onVec(this.center);
      const Tr = this.radius; //XXX: not true for scaling trafos! fix!
      lctx.beginPath();
      lctx.arc(Tc1[0], Tc1[1], Tr, 0, 2*Math.PI);
      lctx.stroke();
      lctx.fill();
    }
  }

  enter(op){
    if(op){
        _.assign(gS.ctxStyle, _.clone(op.ctxStyle));
        _.assign(lctx, op.ctxStyle);
        _.assign(gS.symmState, op.symmState);
        updateSymmetry(op.symmState);
        this.center = op.center;
        this.radius = op.radius;
        this.ctxStyle = _.clone(op.ctxStyle); //not really necessary...
        this.state = _OFF_;
        this.liverender();
    } else {
      this.center = [];
      this.radius = 0;
      this.state = _INIT_;
      this.liverender();
    }
  }

  exit(){
    this.state = _INIT_;
    this.center = [];
    this.radius = 0;
  }

  commit() {
    if(this.state==_INIT_){return;}
    //let ctxStyle = _.assign({}, _.pick(gS.ctxStyle, ...Object.keys(gS.ctxStyle)));
    let ctxStyle = _.assign({}, _.pick(lctx, ...Object.keys(gS.ctxStyle)));
    commitOp( new CircleOp(ctxStyle, this.center, this.radius) );
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
  }

  mouseDown(e) {
    if(this.state ==_OFF_){
      this.commit();
    }
    var rect = livecanvas.getBoundingClientRect();
    this.center = [e.clientX - rect.left, e.clientY - rect.top];
    this.radius = 0;
    this.state = _ON_;
  }

  mouseMove(e) {
    if (this.state == _ON_) {
      var rect = livecanvas.getBoundingClientRect();
      var pt = [e.clientX - rect.left,
                e.clientY - rect.top];
      this.radius = l2dist(this.center, pt);
      this.liverender();
    }
  }

  mouseUp(e) {
    this.state = _OFF_;
  }
}
