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
import {gS, gConstants,
        livecanvas, lctx, canvas, ctx,
        affineset, updateTiling,
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
    this.symstate = gS.params.symstate;
    this.gridstate = _.clone(gS.gridstate);
  }

  render(ctx){
    _.assign(ctx, this.ctxStyle);
    //console.log("circle ", this.symstate, this.gridstate);
    updateTiling(this.symstate, this.gridstate);
    //_.assign(lctx, this.ctxStyle);
    //_.extend(gS.ctxStyle, this.ctxStyle);
    //console.log("render", this.ctxStyle.fillStyle);
    for (let af of affineset) {
      const Tc1 = af.onVec(this.center);
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
        _.assign(gS.gridstate, op.gridstate);
        gS.params.symstate = op.symstate;
        updateTiling(op.symstate, op.gridstate);
        //console.log("loading ", op.ctxStyle.fillStyle);
        //console.log("loading comp gS", gS.ctxStyle.fillStyle);
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
    if(this.state == _OFF_){
      //this.commit(stack);
    }
    this.state = _INIT_;
    this.center = [];
    this.radius = 0;
  }

  commit() {
    if(this.state==_INIT_){return;}
    //let ctxStyle = _.assign({}, _.pick(gS.ctxStyle, ...gConstants.CTXPROPS));
    let ctxStyle = _.assign({}, _.pick(lctx, ...gConstants.CTXPROPS));
    //console.log("saving ", ctxStyle.fillStyle);
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
    //this.commit();
    //this.center = {};
    //this.radius = 0;
  }
}
