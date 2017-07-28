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


// Polygon Drawing
//------------------------------------------------------------------------------
export class PolyOp {
  constructor(points) {
    this.points = points;
  }

  render(ctx) {
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

const _INIT = 0;
const _OFF  = 1;
const _ON   = 2;
const _MOVE = 3;

export class PolyTool {
  constructor() {
    this.points = [];
    this.state = _INIT;
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
    commitOp( new PolyOp(this.points) );
    //gS.cmdstack.push( new PolyOp(this.points) );
    //rerender(ctx);
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
  }

  cancel() {
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
    this.state = _INIT;
    this.points = [];
  }

  mouseDown(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];

    if(this.state == _OFF) {
      let onPoint=false;
      for(let idx=0; idx<this.points.length; idx++) {
        if(l2dist(pt,this.points[idx])<this.hitRadius) {
          this.state = _MOVE;
          this.selected = idx;
          onPoint = true;
          break;
        }
      }
      if(!onPoint){
        this.state = _ON;
        this.selected = this.points.length;
        this.points.push( [pt[0], pt[1]] );
        this.liverender();
      }
    }
    else if(this.state == _INIT) {
      this.state = _ON;
      this.points = [ [pt[0], pt[1]] ];
      this.selected = 0; //?
      this.liverender();
    }
    else if(this.state == _ON) {
      this.selected += 1;//this.state + 1;
      this.points.push( [pt[0], pt[1]] );
      this.liverender();
    }
  }

  mouseMove(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];

    if (this.state == _ON) {
      this.points[this.points.length-1] = [pt[0], pt[1]];
      this.liverender();
    }
    if (this.state == _MOVE) {
      this.points[this.selected] = [pt[0], pt[1]];
      this.liverender();
    }

  }

  mouseUp(e) {
    this.state = _OFF;
  }

  mouseLeave(e) {
    this.exit();
  }

  keyDown(e) {
    if(e.code == "Enter"){
      this.state = _OFF;
      this.commit();
      this.points = [];
      this.selected = 0;
    } else if(e.code=="Escape"){
      this.cancel();
    } else if(e.code=="KeyD"){
      if(this.points.length > 1 &&
         this.state == _OFF) {
        this.points.pop();
        this.selected -= 1;
        this.liverender();
      }
    }
  }

  exit(){
    if(this.state==_OFF) {
      if(this.points.length >2){
        this.commit();
      }
      this.points = [];
      this.selected = 0;
      this.state = _INIT;
    }
  }
}
