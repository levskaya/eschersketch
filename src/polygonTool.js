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
import { _ } from 'underscore';
import {deepClone} from './utils';
import {sign, add2, sub2, scalar2, normalize, l2norm, l2dist, reflectPoint, angleBetween} from './math_utils';

import {RotationAbout, RotationTransform, ScalingTransform} from './symmetryGenerator';
const drawPolygon = function(ctx, pt0, pt1, Nedges){
  ctx.beginPath();
  ctx.moveTo(pt1[0], pt1[1]);
  let rotTr = RotationAbout(2*Math.PI/Nedges, pt0[0],pt0[1]);
  let Tpt = pt1;
  ctx.moveTo(Tpt[0], Tpt[1]);
  for(let i=0; i<Nedges; i++){
    Tpt = rotTr.onVec(Tpt);
    ctx.lineTo(Tpt[0], Tpt[1]);
  }
  ctx.stroke();
  ctx.fill();
}
const drawStar = function(ctx, pt0, pt1, pt2, Nrots){
  ctx.beginPath();
  ctx.moveTo(pt1[0], pt1[1]);
  let anglesign = sign(angleBetween(pt0,pt1,pt2));
  let rotTr = RotationAbout(anglesign*2*Math.PI/Nrots, pt0[0], pt0[1]);
  let Tpt1 = pt1;
  let Tpt2 = pt2;
  for(let i=0; i<Nrots; i++){
    Tpt1 = rotTr.onVec(Tpt1);
    Tpt2 = rotTr.onVec(Tpt2);
    ctx.lineTo(Tpt2[0], Tpt2[1]);
    ctx.lineTo(Tpt1[0], Tpt1[1]);
  }
  ctx.stroke();
  ctx.fill();
}

// Draw Simple Circles, no ellipse / arc-segments yet!
//------------------------------------------------------------------------------
export class PolygonOp {
  constructor(ctxStyle, points, options) {
    this.tool = "polygon";
    this.points = points;
    this.options = options;
    this.ctxStyle = ctxStyle;
    this.symmState = _.clone(gS.symmState);
  }

  render(ctx){
    _.assign(ctx, this.ctxStyle);
    updateSymmetry(this.symmState);
    for (let af of affineset) {
      const Tp0 = af.onVec(this.points[0]);
      const Tp1 = af.onVec(this.points[1]);
      const Tp2 = af.onVec(this.points[2]);
      if(this.options.star){
        drawStar(ctx, Tp0, Tp1, Tp2, this.options.edges);
      }
      else {
        drawPolygon(ctx, Tp0, Tp1, this.options.edges);
      }

    }
  }
}

//State Labels
const _INIT_ = 0;
const _OFF_  = 1;
const _ON_   = 2;
const _MOVECENTER_ = 3;
const _MOVEVERTEX_ = 4;
const _MOVESTAR_ = 5;

const simplifyOptions = function(options){
  let simpleOptions = {};
  for(let key of Object.keys(options)){
    simpleOptions[key] = options[key].val;
  }
  console.log(simpleOptions);
  return simpleOptions;
}

export class PolygonTool {
  constructor() {
    this.points = [[-100,-100],[-100,-100],[-100,-100]]; // [pt_center, pt_outer_edge, pt_star_inner]
    this.state = _INIT_;
    this.hitRadius = 4;
    this.options = {
        edges: {val: 6,     type: "number", min:3},
        star:  {val: false, type: "boolean"}
    };
    this.actions = [
      {name: "cancel", desc: "cancel",    icon: "icon-cross",     key: "Escape"},
      {name: "commit", desc: "start new (automatic on new click)", icon: "icon-checkmark", key: "Enter"},
    ];
  }

  liverender() {
    if(this.state == _INIT_) {return;}
    lctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let af of affineset) {
      const Tp0 = af.onVec(this.points[0]);
      const Tp1 = af.onVec(this.points[1]);
      const Tp2 = af.onVec(this.points[2]);
      if(this.options.star.val){
        drawStar(lctx, Tp0, Tp1, Tp2, this.options.edges.val);
      } else {
        drawPolygon(lctx, Tp0, Tp1, this.options.edges.val);
      }
    }
    lctx.save();
    lctx.lineWidth   = 1.0;
    lctx.strokeStyle = "rgba(255,0,0,1.0)";
    lctx.fillStyle   = "rgba(255,0,0,0.2)";
    lctx.beginPath();
    lctx.arc(this.points[0][0], this.points[0][1], this.hitRadius, 0, 2*Math.PI);
    lctx.stroke();
    lctx.fill();
    lctx.beginPath();
    lctx.arc(this.points[1][0], this.points[1][1], this.hitRadius, 0, 2*Math.PI);
    lctx.stroke();
    lctx.fill();
    lctx.restore();
    if(this.options.star.val){
      lctx.beginPath();
      lctx.arc(this.points[2][0], this.points[2][1], this.hitRadius, 0, 2*Math.PI);
      lctx.stroke();
      lctx.fill();
      lctx.restore();
    }
  }

  commit() {
    if(this.state == _INIT_){return;}
    let ctxStyle = _.assign({}, _.pick(lctx, ...Object.keys(gS.ctxStyle)));
    commitOp(new PolygonOp(ctxStyle, deepClone(this.points), simplifyOptions(this.options)));
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
    this.points = [[-100,-100],[-100,-100],[-100,-100]];
    this.state = _INIT_;
  }

  cancel() {
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
    this.state = _INIT_;
    this.points = [[-100,-100],[-100,-100],[-100,-100]];
  }

  enter(op){
    if(op){
        _.assign(gS.ctxStyle, _.clone(op.ctxStyle));
        _.assign(lctx, op.ctxStyle);
        this.ctxStyle = _.clone(op.ctxStyle); //not really necessary...
        _.assign(gS.symmState, op.symmState);
        updateSymmetry(op.symmState);
        this.points = op.points;
        this.state = _OFF_;
        this.liverender();
    } else{
      this.points = [[-100,-100],[-100,-100],[-100,-100]];
      this.state = _INIT_;
    }
  }

  exit(){
      this.points = [[-100,-100],[-100,-100],[-100,-100]];
      this.state = _INIT_;
  }

  mouseDown(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];

    //console.log(this.state, this.points);
    if(this.state ==_INIT_){
      this.state = _ON_;
      this.points = [pt, pt, pt];
    } else if(l2dist(pt, this.points[0]) < this.hitRadius) {
      this.state = _MOVECENTER_;
    } else if(l2dist(pt, this.points[1]) < this.hitRadius) {
      this.state = _MOVEVERTEX_;
    } else if(l2dist(pt, this.points[2]) < this.hitRadius) {
      this.state = _MOVESTAR_;
    } else {
      if(this.state==_OFF_) {
        this.commit();
      }
      this.state = _ON_;
      this.points = [pt, pt, pt];
    }
  }

  mouseMove(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];

    if (this.state == _ON_) {
        this.points[1] = pt;
        // set initial star point at theta/2 (in-between exterior points) at half radial distance
        let rotr = RotationAbout(-2*Math.PI/this.options.edges.val/2, this.points[0][0],this.points[0][1]);
        let starPt = add2(scalar2(sub2(rotr.onVec(this.points[1]), this.points[0]),0.5), this.points[0]);
        this.points[2] = starPt;
        this.liverender();
    }
    else if (this.state == _MOVECENTER_) {
      let delta   = sub2(pt, this.points[0]);
      let newend  = add2(this.points[1],delta);
      let newstar = add2(this.points[2],delta);
      this.points = [pt, newend, newstar];
      this.liverender();
    }
    else if (this.state == _MOVEVERTEX_) {
      let theta = angleBetween(this.points[0], this.points[1], pt);
      let rotM  = RotationAbout(-theta, this.points[0][0], this.points[0][1]);
      this.points[1] = pt;
      this.points[2] = rotM.onVec(this.points[2]);
      this.liverender();
    }
    else if (this.state == _MOVESTAR_) {
      this.points[2] = pt;
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
