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
import {l2dist} from './math_utils';

import {drawHitCircle} from './canvas_utils';

// Draw Single Line Segments
//------------------------------------------------------------------------------
export class LineOp {
  constructor(ctxStyle, start, end) {
    this.tool = "line";
    this.start = start;
    this.end = end;
    this.ctxStyle = ctxStyle;
    this.symmState = _.clone(gS.symmState);
  }

  render(ctx){
    _.assign(ctx, this.ctxStyle);
    updateSymmetry(this.symmState);
    //gS.$emit('symmUpdate', this.symmState);
    for (let af of affineset) {
      const Tp1 = af.on(this.start.x, this.start.y);
      const Tp2 = af.on(this.end.x, this.end.y);
      ctx.beginPath();
      ctx.moveTo(Tp1[0], Tp1[1]);
      ctx.lineTo(Tp2[0], Tp2[1]);
      ctx.stroke();
    }
  }
}

//State Labels
const _INIT_ = 0;
const _OFF_  = 1;
const _ON_   = 2;
const _MOVESTART_ = 3;
const _MOVEEND_ = 4;

export class LineTool {
  constructor() {
    this.start = {};
    this.end = {};
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
      const Tp1 = af.on(this.start.x, this.start.y);
      const Tp2 = af.on(this.end.x, this.end.y);
      lctx.beginPath();
      lctx.moveTo(Tp1[0], Tp1[1]);
      lctx.lineTo(Tp2[0], Tp2[1]);
      lctx.stroke();
    }
    drawHitCircle(lctx, this.start.x-0.5, this.start.y-0.5, this.hitRadius-1);
    drawHitCircle(lctx, this.end.x-0.5, this.end.y-0.5, this.hitRadius-1);
  }

  commit() {
    if(this.state == _INIT_){return;}
    let ctxStyle = _.assign({}, _.pick(lctx, ...Object.keys(gS.ctxStyle)));
    commitOp(new LineOp(ctxStyle, this.start, this.end));
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

  enter(op){
    if(op){
        _.assign(gS.ctxStyle, _.clone(op.ctxStyle));
        _.assign(lctx, op.ctxStyle);
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
      this.start = { x: pt[0], y: pt[1] };
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

}
