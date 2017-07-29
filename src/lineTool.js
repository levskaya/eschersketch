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


// Draw Single Line Segments
//------------------------------------------------------------------------------
export class LineOp {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  render(ctx){
    for (let af of affineset) {
      const Tp1 = af.on(this.start.x, this.start.y);
      const Tp2 = af.on(this.end.x, this.end.y);
      ctx.beginPath();
      ctx.moveTo(Tp1[0], Tp1[1]);
      ctx.lineTo(Tp2[0], Tp2[1]);
      ctx.stroke();
    }
  }

  serialize(){
    return ["line", this.start, this.end];
  }

  deserialize(data){
    return new LineOp(data[1], data[2]);
  }
}

export class LineTool {
  constructor() {
    this.start = {};
    this.end = {};
    this.state = "init";
    this.hitRadius = 4
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
    commitOp(new LineOp(this.start, this.end));
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
  }

  cancel() {
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
    this.state = "init";
    this.start = {};
    this.end = {};
  }

  mouseDown(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];
    if(l2dist(pt,[this.start.x,this.start.y])<this.hitRadius) {
      this.state = "moveStart";
    } else if(l2dist(pt,[this.end.x,this.end.y])<this.hitRadius) {
      this.state = "moveEnd";
    } else {
      if(this.state=="off") {
        this.commit();
      }
      this.state = "newLine";
      this.start = { x: pt[0], y: pt[1] };
    }
  }

  mouseMove(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];
    if (this.state == "newLine") {
      if (this.drawInterval <= 0) {
        this.end = { x: pt[0], y: pt[1] };
        this.liverender();
        this.drawInterval = 1;
      }
      this.drawInterval--;
    }
    else if (this.state == "moveStart") {
      this.start = { x: pt[0], y: pt[1] };
      this.liverender();
    }
    else if (this.state == "moveEnd") {
      this.end = { x: pt[0], y: pt[1] };
      this.liverender();
    }
  }

  mouseUp(e) {
    this.state = "off";
  }

  mouseLeave(e) {
    this.exit();
  }

  keyDown(e) {
    if(e.code == "Enter"){
      this.state = "off";
      this.commit();
      this.start = {};
      this.end = {};
    } else if(e.code=="Escape"){
      this.cancel();
    }
  }

  exit(){
    if(this.state=="off") {
      this.commit();
      this.start = {};
      this.end = {};
      this.state = "init";
    }
  }
}
