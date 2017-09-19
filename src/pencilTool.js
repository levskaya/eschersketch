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
        livecanvas, lctx, canvas, ctx, lattice,
        affineset, updateSymmetry, updateStyle, drawKeyToOrderMap,
        //pressure,
        commitOp
       } from './main';
import { _ } from 'underscore';
//import {l2dist} from './math_utils';
import {parseColor} from './canvas_utils';

import {simplifyPoints} from './simplifyPoints'; // Douglas-Peucker

// Draw Raw Mousepath (Pencil)
//------------------------------------------------------------------------------
//TODO: add smoothing factor
export class PencilOp {
  constructor(symmState, ctxStyle, points, options) {
    this.tool = "pencil";
    this.points = points;
    this.options = options;
    this.ctxStyle = ctxStyle;
    this.symmState = symmState;
  }

  render(ctx){
    _.assign(ctx, this.ctxStyle);
    updateSymmetry(this.symmState);
    //gS.$emit('symmUpdate', this.symmState);
    for (let af of affineset) {
      ctx.beginPath();
      const Tpt0 = af.onVec(this.points[0]);
      ctx.moveTo(Tpt0[0], Tpt0[1]);
      for (let pt of this.points.slice(1)) {
        const Tpt = af.onVec(pt);
        ctx.lineTo(Tpt[0], Tpt[1]);
      }
      ctx.stroke();
    }
  }
}

const bakeOptions = function(options){
  let simpleOptions = {};
  for(let key of Object.keys(options)){
    simpleOptions[key] = options[key].val;
  }
  return simpleOptions;
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
    this.options = {
        simplify: {val:0.6, type: "slider", min:0.4, max:10, step:0.2},
    };
  }

  liverender_precise() {
    lctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let af of affineset) {
      lctx.beginPath();
      const Tpt0 = af.onVec(this.points[0]);
      lctx.moveTo(Tpt0[0], Tpt0[1]);
      for (let pt of this.points.slice(1)) {
        const Tpt = af.onVec(pt);
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
        const Tpt0 = af.onVec(this.points[this.points.length-3]);
        const Tpt1 = af.onVec(this.points[this.points.length-2]);
        const Tpt2 = af.onVec(this.points[this.points.length-1]);

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
        const Tpt0 = af.onVec(this.points[this.points.length-2]);
        const Tpt1 = af.onVec(this.points[this.points.length-1]);
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
        updateStyle(op.ctxStyle);
        updateSymmetry(op.symmState);
        if(op.options){
          for(let key of Object.keys(op.options)){
            this.options[key].val = op.options[key];
          }
        }
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
    let ctxStyle = _.clone(gS.ctxStyle);
    let symmState = _.clone(gS.symmState);
    let simplifiedPoints = simplifyPoints(this.points, this.options.simplify.val, true);
    commitOp(new PencilOp(symmState, ctxStyle, simplifiedPoints, bakeOptions(this.options)));
    //console.log("pencil: point reduction", this.points.length, simplifiedPoints.length);
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
  }

  cancel() { //not used, just here for consistency
    this.points = [];
    this.state = _INIT_;
  }

  mouseDown(e) {
    if(this.state==_OFF_) {
      this.commit(); //XXX: autocommit
    }
    this.state = _ON_;
    let {left, top} = livecanvas.getBoundingClientRect();
    this.points = [[e.clientX - left, e.clientY - top]];
  }

  mouseMove(e) {
    if (this.state == _ON_) {
      let {left, top} = livecanvas.getBoundingClientRect();
      this.points.push([e.clientX - left, e.clientY - top]);
      this.liverender();
    }
  }

  mouseUp(e) {
    if(this.state != _INIT_){
      this.commit(); //XXX: autocommit
      this.points = [];
      this.state = _INIT_;
    }
  }
}
