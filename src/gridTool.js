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
        commitOp,
        drawTools,
       } from './main';

import { _ } from 'underscore';
import {add2, sub2, scalar2, normalize, l2norm, l2dist, reflectPoint} from './math_utils';
import {generateLattice, planarSymmetries} from './symmetryGenerator';


//State Labels
const _INIT_ = 0; //not used
const _OFF_  = 1;
const _SCALE_= 2;
const _MOVE_ = 3;

// Grid Adjustment Tool
//------------------------------------------------------------------------------
export class GridTool {
  constructor() {
    Object.assign(this, gS.symmState); //x,y,d,t
    this.p0 = [0,0];
    this.p1 = [0,0];
    this.hitRadius = 10;
    this.state = _OFF_;
  }

  enter(){
    _.assign(this, gS.symmState); //x,y,d,t
    this.liverender();
  }

  exit(){
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
  }

  commit(){
    //console.log("symmState ",gS.symmState.sym, {x: this.x, y: this.y, d: this.d, t: this.t})
    _.assign(gS.symmState, {x: this.x, y: this.y, d: this.d, t: this.t});
    //updateSymmetry({x: this.x, y: this.y, d: this.d, t: this.t});
    updateSymmetry(gS.symmState);
  }

  cancel(){ //not used, just here for consistency
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
  }

  mouseDown(e) {
    e.preventDefault();
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];
    if(l2dist(pt,this.p0)<this.hitRadius){
      this.state = _MOVE_;
    }
    if(l2dist(pt,this.p1)<this.hitRadius && Object.keys(planarSymmetries).includes(gS.symmState.sym)){
      this.state = _SCALE_;
    }
  }

  mouseMove(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];
    // dynamic mouse-pointer logic
    if(l2dist(pt, this.p0)<this.hitRadius && this.state == _OFF_){
      livecanvas.style.cursor="all-scroll";
    } else if(l2dist(pt, this.p1)<this.hitRadius && this.state == _OFF_){
      livecanvas.style.cursor="ew-resize";
    } else if(this.state == _OFF_){
      livecanvas.style.cursor="crosshair";
    } else {
      livecanvas.style.cursor="none";
    }

    if (this.state == _MOVE_) {
      this.x = pt[0];
      this.y = pt[1];
      this.liverender();
    }
    if (this.state == _SCALE_) {
      let dist = l2dist(pt, this.p0);
      //grid vector not unit vectors! so we correct:
      let alpha = l2dist(this.p1, this.p0)/this.d;
      this.d = dist/alpha;
      this.liverender();
    }
  }

  mouseUp(e) {
    if(this.state != _OFF_){
      this.commit();
      this.state = _OFF_;
      this.liverender();
    }
  }

  liverender() {
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);

    let p0 = [this.x, this.y];
    this.p0 = p0; //save for canvas hit-detection

    if(Object.keys(planarSymmetries).includes(gS.symmState.sym)){
      //const v0 = RotationTransform(this.t).onVec(planarSymmetries[gS.symmState.sym].vec0);
      //const v1 = RotationTransform(this.t).onVec(planarSymmetries[gS.symmState.sym].vec1);
      const v0 = planarSymmetries[gS.symmState.sym].vec0;
      const v1 = planarSymmetries[gS.symmState.sym].vec1;
      var p1 = [(this.d * v0[0]) + this.x, (this.d * v0[1]) + this.y];
      var p2 = [(this.d * v1[0]) + this.x, (this.d * v1[1]) + this.y];
      //this.p0 = p0; //save for canvas hit-detection
      this.p1 = p1;   //save for canvas hit-detection

      var newlattice = generateLattice(planarSymmetries[gS.symmState.sym],
                                    gS.symmState.Nx, gS.symmState.Ny,
                                    this.d, this.t,
                                    this.x, this.y);
      // Draw Lattice
      lctx.save();
      lctx.lineWidth = 1.0;
      lctx.strokeStyle = "rgba(0,0,0,1.0)";
      for (let af of newlattice) {
        let Tp0 = af.on(p0[0],p0[1]);
        let Tp1 = af.on(p1[0],p1[1]);
        let Tp2 = af.on(p2[0],p2[1]);
        lctx.beginPath();
        lctx.moveTo(Tp0[0],Tp0[1]);
        lctx.lineTo(Tp1[0],Tp1[1]);
        lctx.lineTo(Tp1[0]+Tp2[0]-Tp0[0],Tp1[1]+Tp2[1]-Tp0[1]);
        lctx.lineTo(Tp2[0],Tp2[1]);
        lctx.closePath();
        lctx.stroke();
      }
      lctx.restore();
    }

    const circR = this.hitRadius;
    lctx.save();
    lctx.fillStyle = "rgba(0,0,0,0.1)";
    lctx.lineWidth = 4.0;
    if(this.state == _MOVE_){ lctx.strokeStyle = "rgba(0,255,0,0.5)";}
    else {lctx.strokeStyle = "rgba(0,0,0,0.5)";}
    lctx.beginPath();
    lctx.arc(p0[0], p0[1], circR, 0, 2*Math.PI);
    lctx.stroke();
    lctx.fill();

    if(Object.keys(planarSymmetries).includes(gS.symmState.sym)){
      if(this.state == _SCALE_){ lctx.strokeStyle = "rgba(0,255,0,0.5)";}
      else {lctx.strokeStyle = "rgba(0,0,0,0.5)";}
      lctx.beginPath();
      lctx.arc(p1[0], p1[1], circR, 0, 2*Math.PI);
      lctx.stroke();
      lctx.fill();
      lctx.restore();
    }
  }
}
