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
        livecanvas, lctx, canvas, ctx, affineset,
        commitOp
       } from './main';

import {l2dist} from './math_utils';
import { _ } from 'underscore';


// Polygon Drawing
//------------------------------------------------------------------------------
export class PolyOp {
  constructor(ctxStyle, points) {
    this.ctxStyle = _.clone(ctxStyle);
    this.points = points;
    this.tool = "poly";
  }

  render(ctx) {
    //if(this.points.length==0){return;} //empty data case
    _.assign(ctx, this.ctxStyle);
    for (let af of affineset) {
      ctx.beginPath();
      let Tpt = af.on(this.points[0][0], this.points[0][1]);
      ctx.moveTo(Tpt[0], Tpt[1]);
      for(let pt of this.points.slice(1)) {
        Tpt = af.on(pt[0], pt[1]);
        ctx.lineTo(Tpt[0], Tpt[1]);
      }
      ctx.closePath(); //necessary?
      ctx.stroke();
      ctx.fill();
    }
  }

  serialize() {
    return ["polygon", this.points];
  }

  deserialize(data) {
    return new PolyOp(data[1]);
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
  }

  liverender() {
    lctx.clearRect(0, 0, canvas.width, canvas.height);
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
    lctx.save();
    lctx.lineWidth = 1.0;
    lctx.fillStyle   = "rgba(255,0,0,0.2)";
    lctx.strokeStyle = "rgba(255,0,0,1.0)";
    for(let pt of this.points) {
      lctx.beginPath();
      lctx.arc(pt[0]-1, pt[1]-1, this.hitRadius, 0, 2*Math.PI);
      lctx.stroke();
      lctx.fill();
    }
    lctx.restore();
  }

  commit() {
    //console.log("poly state at commit ", this.state);
    if(this.state==_INIT_){return;} //empty data case
    let ctxStyle = _.assign({}, _.pick(lctx, ...gConstants.CTXPROPS));
    commitOp( new PolyOp(ctxStyle, this.points) );
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
    this.state = _INIT_;
    this.points = [];
  }

  cancel() {
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
    this.state = _INIT_;
    this.points = [];
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
      this.selected = 0; //?
      this.liverender();
    }
    else if(this.state == _ON_) {
      this.selected += 1;//this.state + 1;
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

  //mouseLeave(e) {
    //this.exit();
  //}

  keyDown(e) {
    if(e.code == "Enter"){
      this.state = _OFF_;
      this.commit();
      this.points = [];
      this.selected = 0;
      this.state = _INIT_;
    } else if(e.code=="Escape"){
      this.cancel();
    } else if(e.code=="KeyD"){
      if(this.points.length > 1 &&
         this.state == _OFF_) {
        this.points.pop();
        this.selected -= 1;
        this.liverender();
      }
    }
  }

  enter(op){
    if(op){
        _.assign(gS.ctxStyle, _.clone(op.ctxStyle));
        _.assign(lctx, op.ctxStyle);
        this.ctxStyle = _.clone(op.ctxStyle); //not really necessary...
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
    //if(this.state==_OFF_) {
    //  if(this.points.length >2){
        //this.commit();
    //  }
      this.points = [];
      this.selected = 0;
      this.state = _INIT_;
    //}
  }
}
