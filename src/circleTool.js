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
        affineset, updateSymmetry, updateStyle,
        commitOp
       } from './main';
import { _ } from 'underscore';
import {add2, sub2, scalar2, normalize, l2norm, l2dist, reflectPoint} from './math_utils';

import {drawHitCircle} from './canvas_utils';

/*
const drawEllipseByCenter = function(ctx, cx, cy, w, h) {
  drawEllipse(ctx, cx - w/2.0, cy - h/2.0, w, h);
}
const drawEllipse = function(ctx, x, y, w, h) {
  var kappa = .5522848,
      ox = (w / 2) * kappa, // control point offset horizontal
      oy = (h / 2) * kappa, // control point offset vertical
      xe = x + w,           // x-end
      ye = y + h,           // y-end
      xm = x + w / 2,       // x-middle
      ym = y + h / 2;       // y-middle

  ctx.beginPath();
  ctx.moveTo(x, ym);
  ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
  ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
  ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
  ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
  //ctx.closePath(); // not used correctly, see comments (use to close off open path)
  ctx.stroke();
}
*/

// Draw Simple Circles, no ellipse / arc-segments yet!
//------------------------------------------------------------------------------
export class CircleOp {
  constructor(ctxStyle, points) {
    this.tool = "circle";
    this.points = points;
    this.ctxStyle = ctxStyle;
    this.symmState = _.clone(gS.symmState);
  }

  render(ctx){
    _.assign(ctx, this.ctxStyle);
    updateSymmetry(this.symmState);
    //gS.$emit('symmUpdate', this.symmState);
    for (let af of affineset) {
      const Tp1 = af.on(this.points[0][0], this.points[0][1]);
      const Tp2 = af.on(this.points[1][0], this.points[1][1]);
      let Tr = l2dist(Tp1,Tp2);
      ctx.beginPath();
      ctx.arc(Tp1[0], Tp1[1], Tr, 0, 2*Math.PI);
      ctx.stroke();
      ctx.fill();
    }
  }
}

//State Labels
const _INIT_ = 0;
const _OFF_  = 1;
const _ON_   = 2;
const _MOVESTART_ = 3;
const _MOVEEND_ = 4;

export class CircleTool {
  constructor() {
    this.points = [[0,0],[0,0]];
    this.state = _INIT_;
    this.hitRadius = 4;
    this.actions = [
      {name: "cancel", desc: "cancel",    icon: "icon-cross",     key: "Escape"},
      {name: "commit", desc: "start new (automatic on new click)", icon: "icon-checkmark", key: "Enter"},
    ];
  }

  liverender() {
    lctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let af of affineset) {
      const Tp1 = af.on(this.points[0][0], this.points[0][1]);
      const Tp2 = af.on(this.points[1][0], this.points[1][1]);
      let Tr = l2dist(Tp1,Tp2);
      lctx.beginPath();
      lctx.arc(Tp1[0], Tp1[1], Tr, 0, 2*Math.PI);
      lctx.stroke();
      lctx.fill();
    }
    drawHitCircle(lctx, this.points[0][0]-0.5, this.points[0][1]-0.5, this.hitRadius);
    drawHitCircle(lctx, this.points[1][0]-0.5, this.points[1][1]-0.5, this.hitRadius);
  }

  enter(op){
    if(op){
        updateStyle(op.ctxStyle);
        updateSymmetry(op.symmState);
        this.points = op.points;
        this.state = _OFF_;
        this.liverender();
    } else{
      this.points = [[0,0],[0,0]];
      this.state = _INIT_;
    }
  }

  exit(){
      this.points = [[0,0],[0,0]];
      this.state = _INIT_;
  }

  commit() {
    if(this.state == _INIT_){return;}
    let ctxStyle = _.assign({}, _.pick(lctx, ...Object.keys(gS.ctxStyle)));
    commitOp(new CircleOp(ctxStyle, this.points));
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
    this.points = [[0,0],[0,0]];
    this.state = _INIT_;
  }

  cancel() {
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
    this.points = [[0,0],[0,0]];
    this.state = _INIT_;
  }

  mouseDown(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];
    if(l2dist(pt, this.points[0])<this.hitRadius) {
      this.state = _MOVESTART_;
    } else if(l2dist(pt, this.points[1])<this.hitRadius) {
      this.state = _MOVEEND_;
    } else {
      if(this.state==_OFF_) {
        this.commit();
      }
      this.state = _ON_;
      this.points[0] = pt;
    }
  }

  mouseMove(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];
    if (this.state == _ON_) {
        this.points[1] = pt;
        this.liverender();
    }
    else if (this.state == _MOVESTART_) {
      let delt = sub2(pt, this.points[0]);
      let newend = add2(this.points[1],delt);
      this.points = [pt, newend];
      this.liverender();
    }
    else if (this.state == _MOVEEND_) {
      this.points[1] = pt;
      this.liverender();
    }
  }

  mouseUp(e) {
    this.state = _OFF_;
  }

  keyDown(e) {
    if(e.target.type){return;} // don't interfere with input UI key-events

    for(let action of this.actions){
      if(_.isArray(action.key)){
        for(let keyOption of action.key){
          if(keyOption == e.code) {
            this[action.name]();
          }
        }
      }
      else {
        if(action.key == e.code){
          this[action.name]();
        }
      }
    }
  }

}
