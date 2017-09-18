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

import {l2dist, EPS} from './math_utils';
import { _ } from 'underscore';

import {drawHitCircle} from './canvas_utils';

// Polygon Drawing
//------------------------------------------------------------------------------
export class PolyOp {
  constructor(symmState, ctxStyle, points) {
    this.points = points;
    this.tool = "poly";
    this.ctxStyle = ctxStyle;
    this.symmState = symmState;
  }

  render(ctx) {
    _.assign(ctx, this.ctxStyle);
    updateSymmetry(this.symmState);
    for (let af of affineset) {
      ctx.beginPath();
      let Tpt = af.on(this.points[0][0], this.points[0][1]);
      ctx.moveTo(Tpt[0], Tpt[1]);
      for(let pt of this.points.slice(1)) {
        Tpt = af.on(pt[0], pt[1]);
        ctx.lineTo(Tpt[0], Tpt[1]);
      }
      if(l2dist(this.points[0],this.points[this.points.length-1])<EPS) {
        ctx.closePath(); //necessary?
      }
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

export class PolyTool {
  constructor() {
    this.points = [];
    this.state = _INIT_;
    this.selected = -1;
    this.hitRadius = 4;
    this.actions = [
      {name: "cancel", desc: "cancel", icon: "icon-cross", key: "Escape"},
      {name: "commit", desc: "start new", icon: "icon-checkmark", key: "Enter"},
      {name: "back",   desc: "undo last point", icon: "icon-minus", key: "Backspace"},
      {name: "closepath",   desc: "close path", icon: "icon-stroke", key: "KeyC"}
    ];
  }

  liverender() {
    lctx.clearRect(0, 0, canvas.width, canvas.height);
    if(this.state==_INIT_){return;} //empty data case
    for (let af of affineset) {
      lctx.beginPath();
      let Tpt = af.on(this.points[0][0], this.points[0][1]);
      lctx.moveTo(Tpt[0], Tpt[1]);
      for(let pt of this.points.slice(1)) {
        Tpt = af.on(pt[0], pt[1]);
        lctx.lineTo(Tpt[0], Tpt[1]);
      }
      lctx.stroke();
      if(this.points.length > 2) {
        lctx.fill();
      }
    }
    // draw handles
    for(let pt of this.points) {
      drawHitCircle(lctx, pt[0]-1, pt[1]-1, this.hitRadius);
    }
  }

  enter(op){
    if(op){
        updateStyle(op.ctxStyle);
        updateSymmetry(op.symmState);
        this.points = op.points;
        this.state = _OFF_;
        this.selected = 0;
        this.liverender();
    } else{
      this.points = [];
      this.state = _INIT_;
      this.selected = 0;
    }

  }

  exit(){
      this.points = [];
      this.selected = 0;
      this.state = _INIT_;
  }

  commit() {
    if(this.state==_INIT_){return;} //empty data case
    let ctxStyle = _.clone(gS.ctxStyle);
    let symmState = _.clone(gS.symmState);
    commitOp( new PolyOp(symmState, ctxStyle, this.points) );
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
    this.state = _INIT_;
    this.points = [];
    this.selected = 0;
  }

  cancel() {
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
    this.state = _INIT_;
    this.points = [];
    this.selected = 0;
  }

  closepath() {
    //add explicit closed flag?
    if(this.points.length > 2 && l2dist(this.points[0],this.points[this.points.length-1])>EPS) {
      this.points.push( this.points[0] );
      this.liverender();
    }
  }

  mouseDown(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];

    if(this.state == _OFF_) {
      let onPoint=false;
      for(let idx=0; idx<this.points.length; idx++) {
        if(l2dist(pt,this.points[idx])<this.hitRadius) {
          this.state = _MOVE_;
          this.selected = idx;
          onPoint = true;
          break;
        }
      }
      if(!onPoint){
        this.state = _ON_;
        this.selected = this.points.length;
        this.points.push( [pt[0], pt[1]] );
        this.liverender();
      }
    }
    else if(this.state == _INIT_) {
      this.state = _ON_;
      this.points = [ [pt[0], pt[1]] ];
      this.selected = 0;
      this.liverender();
    }
    else if(this.state == _ON_) {
      this.selected += 1;
      this.points.push( [pt[0], pt[1]] );
      this.liverender();
    }
  }

  mouseMove(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];

    if (this.state == _ON_) {
      this.points[this.points.length-1] = [pt[0], pt[1]];
      this.liverender();
    }
    if (this.state == _MOVE_) {
      this.points[this.selected] = [pt[0], pt[1]];
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

  back() {
    if(this.points.length > 1 &&
       this.state == _OFF_) {
      this.points.pop();
      this.selected -= 1;
      this.liverender();
    } else if (this.state == _OFF_) {
      this.points.pop();
      this.selected -= 1;
      this.state = _INIT_;
      this.liverender();
    }
  }

}
