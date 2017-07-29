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


// Draw Circles
//------------------------------------------------------------------------------
export class CircleOp {
  constructor(center, radius) {
    this.center = center;
    this.radius = radius;
  }

  render(ctx){
    for (let af of affineset) {
      const Tc1 = af.onVec(this.center);
      const Tr = this.radius; //XXX: not true for scaling trafos! fix!
      ctx.beginPath();
      ctx.arc(Tc1[0], Tc1[1], Tr, 0, 2*Math.PI);
      ctx.stroke();
      ctx.fill();
    }
  }

  serialize(){
    return ["circle", this.center, this.radius];
  }

  deserialize(data){
    return new CircleOp(data[1], data[2]);
  }
}

export class CircleTool {
  constructor() {
    this.center = [];
    this.radius = 0;
    this.on = false;
  }

  liverender() {
    lctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let af of affineset) {
      const Tc1 = af.onVec(this.center);
      const Tr = this.radius; //XXX: not true for scaling trafos! fix!
      lctx.beginPath();
      lctx.arc(Tc1[0], Tc1[1], Tr, 0, 2*Math.PI);
      lctx.stroke();
      lctx.fill();
    }
  }

  commit() {
    commitOp( new CircleOp(this.center, this.radius) );
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
  }

  mouseDown(e) {
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    this.center = [e.clientX - rect.left,
                   e.clientY - rect.top];
    this.on = true;
  }

  mouseMove(e) {
    if (this.on) {
      var rect = canvas.getBoundingClientRect();
      var pt = [e.clientX - rect.left,
                e.clientY - rect.top];
      this.radius = l2dist(this.center, pt);
      this.liverender();
    }
  }

  mouseUp(e) {
    this.on = false;
    this.commit();
    this.center = {};
    this.radius = 0;
  }
}
