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
import {add2, sub2, scalar2, normalize, l2norm, l2dist, reflectPoint, angleBetween, orthoproject2} from './math_utils';

import {RotationAbout, RotationTransform, ScalingTransform} from './symmetryGenerator';

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

const { PI, asin } = Math;
const pointToAngle = function(pt0,pt1) {
  const pt = normalize(sub2(pt1,pt0));
  let angle = 0;
  if(pt[0]>=0){
    if(pt[1]>=0){ // UR quadrant
      angle = asin(pt[1]);
    } else {      // LR quadrant
      angle = 2*PI - asin(-pt[1]);
    }
  } else {
    if(pt[1]>=0){ // UL quadrant
      angle = PI - asin(pt[1]);
    } else {      // LL quadrant
      angle = PI + asin(-pt[1]);
    }
  }
  //console.log(angle);
  return angle;
}

// Draw Circles, Ellipses, Arc-segments
//------------------------------------------------------------------------------
export class CircleOp {
  constructor(symmState, ctxStyle, points, options) {
    this.tool = "circle";
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
      const Tp0 = af.on(this.points[0][0], this.points[0][1]);
      const Tp1 = af.on(this.points[1][0], this.points[1][1]);
      const Tp2 = af.on(this.points[2][0], this.points[2][1]);
      let Tmajor = l2dist(Tp0,Tp1);
      let Tminor = l2dist(Tp0,Tp2);
      let angle = pointToAngle(Tp0,Tp1);
      ctx.beginPath();
      ctx.ellipse(Tp0[0], Tp0[1], Tmajor, Tminor, angle, 0, Math.PI/180.0 * this.options.arcAngle,0);
      ctx.stroke();
      ctx.fill();
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
const _MOVECENTER_ = 3;
const _MOVEMAJOR_ = 4;
const _MOVEMINOR_ = 5;
const _MOVEARC_ = 6;

export class CircleTool {
  constructor() {
    this.points = [[0,0],[0,0],[0,0]];
    this.state = _INIT_;
    this.hitRadius = 4;
    this.actions = [
      {name: "cancel", desc: "cancel",    icon: "icon-cross",     key: "Escape"},
      {name: "commit", desc: "start new (automatic on new click)", icon: "icon-checkmark", key: "Enter"},
    ];
    this.options = {
        arcAngle: {val: 360, type: "slider", min:1, max:360, step:1},
    }
  }

  liverender() {
    lctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let af of affineset) {
      const Tp0 = af.on(this.points[0][0], this.points[0][1]);
      const Tp1 = af.on(this.points[1][0], this.points[1][1]);
      const Tp2 = af.on(this.points[2][0], this.points[2][1]);
      let Tmajor = l2dist(Tp0,Tp1);
      let Tminor = l2dist(Tp0,Tp2);
      let angle = pointToAngle(Tp0,Tp1);
      lctx.beginPath();
      lctx.ellipse(Tp0[0], Tp0[1], Tmajor, Tminor, angle, 0, Math.PI/180.0*this.options.arcAngle.val,0);
      lctx.stroke();
      lctx.fill();
    }
    drawHitCircle(lctx, this.points[0][0]-0.5, this.points[0][1]-0.5, this.hitRadius);
    drawHitCircle(lctx, this.points[1][0]-0.5, this.points[1][1]-0.5, this.hitRadius);
    drawHitCircle(lctx, this.points[2][0]-0.5, this.points[2][1]-0.5, this.hitRadius);
  }

  enter(op){
    if(op){
        updateStyle(op.ctxStyle);
        updateSymmetry(op.symmState);
        for(let key of Object.keys(op.options)){
          this.options[key].val = op.options[key];
        }
        this.points = op.points;
        this.state = _OFF_;
        this.liverender();
    } else{
      this.points = [[0,0],[0,0],[0,0]];
      this.state = _INIT_;
    }
  }

  exit(){
      this.points = [[0,0],[0,0],[0,0]];
      this.state = _INIT_;
  }

  commit() {
    if(this.state == _INIT_){return;}
    let ctxStyle = _.clone(gS.ctxStyle);
    let symmState = _.clone(gS.symmState);
    commitOp(new CircleOp(symmState, ctxStyle, this.points, bakeOptions(this.options)));
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
    this.points = [[0,0],[0,0],[0,0]];
    this.state = _INIT_;
  }

  cancel() {
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
    this.points = [[0,0],[0,0],[0,0]];
    this.state = _INIT_;
  }

  mouseDown(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];
    if(l2dist(pt, this.points[0])<this.hitRadius) {
      this.state = _MOVECENTER_;
    } else if(l2dist(pt, this.points[1])<this.hitRadius) {
      this.state = _MOVEMAJOR_;
    } else if(l2dist(pt, this.points[2])<this.hitRadius) {
      this.state = _MOVEMINOR_;
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
        this.points[2] = [-(pt[1]-this.points[0][1])+this.points[0][0],
                           (pt[0]-this.points[0][0])+this.points[0][1]]; //90deg CCW rotation of pt around points[0]
        this.liverender();
    }
    else if (this.state == _MOVECENTER_) {
      let delt = sub2(pt, this.points[0]);
      let newmajor = add2(this.points[1],delt);
      let newminor = add2(this.points[2],delt);
      this.points = [pt, newmajor, newminor];
      this.liverender();
    }
    else if (this.state == _MOVEMAJOR_) {
      //this.points[1] = pt;
      //this.liverender();
      let theta = angleBetween(this.points[0], this.points[1], pt);
      let rotM  = RotationAbout(-theta, this.points[0][0], this.points[0][1]);
      let scale = l2norm(sub2(pt,this.points[0])) / (l2norm(sub2(this.points[1],this.points[0])) + 1.0e-9); //XXX: NaN edgecase?
      this.points[1] = pt;
      let Rpt2 = rotM.onVec(this.points[2]);
      this.points[2] = add2(scalar2(sub2(Rpt2,this.points[0]), scale), this.points[0]);
      this.liverender();
    }
    else if (this.state == _MOVEMINOR_) {
      this.points[2] = orthoproject2(this.points[0], this.points[1], pt);
      this.liverender();
    }
  }

  mouseUp(e) {
    this.state = _OFF_;
  }

  keyDown(e) {
    if(e.target.type){return;} // don't interfere with input UI key-events
    for(let action of this.actions){
      if(action.key == e.code){
        this[action.name]();
      }
    }
  }

}
