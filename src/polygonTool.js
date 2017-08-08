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
import {add2, sub2, scalar2, normalize, l2norm, l2dist, reflectPoint} from './math_utils';

import {RotationAbout} from './symmetryGenerator';
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

// Draw Simple Circles, no ellipse / arc-segments yet!
//------------------------------------------------------------------------------
export class PolygonOp {
  constructor(ctxStyle, start, end, options) {
    this.tool = "polygon";
    this.start = start;
    this.end = end;
    this.options = options;
    this.ctxStyle = ctxStyle;
    this.symmState = _.clone(gS.symmState);
  }

  render(ctx){
    _.assign(ctx, this.ctxStyle);
    updateSymmetry(this.symmState);
    for (let af of affineset) {
      const Tp1 = af.on(this.start.x, this.start.y);
      const Tp2 = af.on(this.end.x, this.end.y);
      drawPolygon(ctx, Tp1, Tp2, this.options.edges);
    }
  }
}

//State Labels
const _INIT_ = 0;
const _OFF_  = 1;
const _ON_   = 2;
const _MOVESTART_ = 3;
const _MOVEEND_ = 4;

const simplifyOptions = function(options){
  let simpleOptions = {};
  for(let key of Object.keys(options)){
    simpleOptions[key] = options[key].val;
  }
  return simpleOptions;
}

export class PolygonTool {
  constructor() {
    this.start = {};
    this.end = {};
    this.state = _INIT_;
    this.hitRadius = 4;
    this.options = {
        edges: {val: 6,     type: "number", min:3},
        //star:  {val: false, type: "boolean"}
    };
    this.actions = [
      {name: "cancel", desc: "cancel",    icon: "icon-cross",     key: "Escape"},
      {name: "commit", desc: "start new (automatic on new click)", icon: "icon-checkmark", key: "Enter"},
    ];
  }

  liverender() {
    lctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let af of affineset) {
      const Tp1 = af.on(this.start.x, this.start.y);
      const Tp2 = af.on(this.end.x, this.end.y);
      drawPolygon(lctx, Tp1, Tp2, this.options.edges.val);
    }
    lctx.save();
    lctx.fillStyle = "rgba(255,0,0,0.2)";
    lctx.lineWidth = 1.0;
    lctx.strokeStyle = "rgba(255,0,0,1.0)";
    lctx.beginPath();
    lctx.arc(this.start.x-1, this.start.y-1, this.hitRadius, 0, 2*Math.PI);
    lctx.stroke();
    lctx.fill();
    lctx.beginPath();
    lctx.arc(this.end.x-1, this.end.y-1, this.hitRadius, 0, 2*Math.PI);
    lctx.stroke();
    lctx.fill();
    lctx.restore();
  }

  commit() {
    if(this.state == _INIT_){return;}
    let ctxStyle = _.assign({}, _.pick(lctx, ...Object.keys(gS.ctxStyle)));
    commitOp(new PolygonOp(ctxStyle, this.start, this.end, simplifyOptions(this.options)));
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
    this.start = {};
    this.end = {};
    this.state = _INIT_;
  }

  cancel() {
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
    this.state = _INIT_;
    this.start = {};
    this.end = {};
  }

  mouseDown(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];
    if(l2dist(pt,[this.start.x,this.start.y])<this.hitRadius) {
      this.state = _MOVESTART_;
    } else if(l2dist(pt,[this.end.x,this.end.y])<this.hitRadius) {
      this.state = _MOVEEND_;
    } else {
      if(this.state==_OFF_) {
        this.commit();
      }
      this.state = _ON_;
      this.start = { x: pt[0], y: pt[1] };
    }
  }

  mouseMove(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];
    if (this.state == _ON_) {
        this.end = { x: pt[0], y: pt[1] };
        this.liverender();
    }
    else if (this.state == _MOVESTART_) {
      let delt = [pt[0]-this.start.x, pt[1]-this.start.y];
      let newend = add2([this.end.x,this.end.y],delt);
      this.start = { x: pt[0], y: pt[1] };
      this.end = { x: newend[0], y: newend[1] };
      this.liverender();
    }
    else if (this.state == _MOVEEND_) {
      this.end = { x: pt[0], y: pt[1] };
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

  enter(op){
    if(op){
        _.assign(gS.ctxStyle, _.clone(op.ctxStyle));
        _.assign(lctx, op.ctxStyle);
        this.ctxStyle = _.clone(op.ctxStyle); //not really necessary...
        _.assign(gS.symmState, op.symmState);
        updateSymmetry(op.symmState);
        this.start = op.start;
        this.end = op.end;
        this.state = _OFF_;
        this.liverender();
    } else{
      this.start = {};
      this.end = {};
      this.state = _INIT_;
    }
  }

  exit(){
      this.start = {};
      this.end = {};
      this.state = _INIT_;
  }
}
