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
        affineset, updateSymmetry, updateStyle, drawKeyToOrderMap,
        commitOp
       } from './main';
import { _ } from 'underscore';
import {add2, sub2, scalar2, normalize, l2norm, l2dist, reflectPoint} from './math_utils';

import {drawHitCircle, drawHitLine} from './canvas_utils';


export class PathOp {
  constructor(symmState, ctxStyle, points) {
    this.ctxStyle = ctxStyle;
    this.points = points;
    this.tool = "path";
    this.symmState = symmState;
  }

  render(ctx) {
    _.assign(ctx, this.ctxStyle);
    updateSymmetry(this.symmState);
    const drawOrder = drawKeyToOrderMap[this.ctxStyle.drawOrder]; // optional separation of stroke / fill layers
    for(let drawSet of drawOrder){
      for (let af of affineset) {
        ctx.beginPath();
        let Tpt = af.onVec(this.points[0]);
        ctx.moveTo(Tpt[0], Tpt[1]);
        let ptidx = 0;
        while(ptidx < this.points.length-1){
          let Tpt0  = af.onVec(this.points[ptidx+0]),
              Tcpt0 = af.onVec(this.points[ptidx+1]),
              Tcpt1 = af.onVec(this.points[ptidx+2]),
              Tpt1  = af.onVec(this.points[ptidx+3]);
          if(l2dist(Tpt0, Tcpt0) < EPS && l2dist(Tpt1, Tcpt1)){
            ctx.lineTo(Tpt1[0], Tpt1[1]);
          }
          else {
            ctx.bezierCurveTo(Tcpt0[0], Tcpt0[1], Tcpt1[0], Tcpt1[1], Tpt1[0], Tpt1[1]);
          }
          ptidx += 3;
        }
        for(let drawFunc of drawSet){ //drawFunc = "stroke" or "fill"
          ctx[drawFunc]();
        }
      }
    }
  }
}

//State Labels
const _INIT_ = 0;
const _OFF_  = 1;
const _ON_   = 2;
const _MOVE_ = 3;

const EPS = 1.0e-6; // lineTo cutoff for proximity of control point to vertex

//TODO: hide control points for most vertices unless they're "parent" vertex
//      is selected
export class PathTool {
  constructor() {
    //this.ops = [];
    this.points = [];
    this.state = _INIT_;
    this.ctrlPoint = [];
    this.pointsSelected = [];
    this.hitRadius = 4;
    this.actions = [
      {name: "cancel", desc: "cancel path", icon: "icon-cross", key: "Escape"},
      {name: "commit", desc: "start new path", icon: "icon-checkmark", key: "Enter"},
      {name: "back",   desc: "undo last point", icon: "icon-minus", key: "Backspace"},
      {name: "closepath",   desc: "close path", icon: "icon-stroke", key: "KeyC"},
      {name: "smoothclose",   desc: "smooth close path", icon: "icon-radio-unchecked", key: "KeyS"}
    ];
  }

  liverender() {
    lctx.clearRect(0, 0, canvas.width, canvas.height);
    if(this.points.length==0){return;}
    const drawOrder = drawKeyToOrderMap[gS.ctxStyle.drawOrder]; // optional separation of stroke / fill layers
    for(let drawSet of drawOrder){
      for (let af of affineset) {
        lctx.beginPath();
        let Tpt = af.onVec(this.points[0]);
        lctx.moveTo(Tpt[0], Tpt[1]);
        let ptidx = 0;
        if(this.points.length >=4){
          while(ptidx < this.points.length-1){
            let Tpt0  = af.onVec(this.points[ptidx+0]),
                Tcpt0 = af.onVec(this.points[ptidx+1]),
                Tcpt1 = af.onVec(this.points[ptidx+2]),
                Tpt1  = af.onVec(this.points[ptidx+3]);
            // line specialization
            if(l2dist(Tpt0, Tcpt0) < EPS && l2dist(Tpt1, Tcpt1)){
              lctx.lineTo(Tpt1[0], Tpt1[1]);
            }
            else {
              lctx.bezierCurveTo(Tcpt0[0], Tcpt0[1], Tcpt1[0], Tcpt1[1], Tpt1[0], Tpt1[1]);
            }
            ptidx += 3;
          }
          for(let drawFunc of drawSet){
            lctx[drawFunc]();
          }
        }
      }
    }
    if(this.points.length==1){ //initial point
      let pt0 = this.points[0];
      drawHitCircle(lctx, pt0[0], pt0[1], this.hitRadius);
    }
    else { //general case
      let ptidx = 0;
      while(ptidx < this.points.length-1){
        let pt0 = this.points[ptidx+0],
            cpt0 = this.points[ptidx+1],
            cpt1 = this.points[ptidx+2],
            pt1  = this.points[ptidx+3];

        if(l2dist(pt0,cpt0)>EPS){
          drawHitCircle(lctx, cpt0[0], cpt0[1], this.hitRadius-2);
          drawHitLine(lctx, pt0[0],pt0[1], cpt0[0],cpt0[1]);
        }
        if(l2dist(pt1,cpt1)>EPS){
          drawHitCircle(lctx, cpt1[0], cpt1[1], this.hitRadius-2);
          drawHitLine(lctx, pt1[0],pt1[1], cpt1[0],cpt1[1]);
        }
        drawHitCircle(lctx, pt0[0], pt0[1], this.hitRadius);
        drawHitCircle(lctx, pt1[0], pt1[1], this.hitRadius);

        ptidx += 3;
      }
    }

    let lastpt = this.points[this.points.length-1];
    if(this.ctrlPoint.length > 0){ //temp control point render
      drawHitCircle(lctx, this.ctrlPoint[0], this.ctrlPoint[1], this.hitRadius-2);
      drawHitLine(lctx,lastpt[0],lastpt[1],this.ctrlPoint[0],this.ctrlPoint[1]);
    }
  }

  enter(op) {
    if(op) {
        updateStyle(op.ctxStyle);
        updateSymmetry(op.symmState);
        this.points = op.points;
        this.pointsSelected = [];
        this.ctrlPoint = [];
        this.state = _OFF_;
        this.liverender();
    }
    else {
      this.points = [];
      this.pointsSelected = [];
      this.ctrlPoint = [];
      this.state = _INIT_;
    }
  }

  exit() {
    this.points = [];
    this.pointsSelected = [];
    this.ctrlPoint = [];
    this.state = _INIT_;
  }

  commit() {
    if(this.state==_INIT_){return;} //empty data cases
    if(this.points.length<4){return;}
    let ctxStyle = _.clone(gS.ctxStyle);
    let symmState = _.clone(gS.symmState);
    commitOp(new PathOp(symmState, ctxStyle, this.points));
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
    this.points = [];
    this.pointsSelected = [];
    this.ctrlPoint = [];
    this.state = _INIT_;
  }

  cancel() {
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
    this.state = _INIT_;
    this.points = [];
    this.ctrlPoint = [];
  }

  closepath() {
    if(this.points.length < 4 || l2dist(this.points[0],this.points[this.points.length-1])<EPS){
      return;
    }
    if(this.ctrlPoint.length === 0) {
      this.state = _OFF_;
      this.points.push(this.points[this.points.length-1]);
      this.points.push(this.points[0]);
      this.points.push(this.points[0]);
    } else {
      this.state = _OFF_;
      this.points.push(this.ctrlPoint);
      this.points.push(this.points[0]);
      this.points.push(this.points[0]);
      this.ctrlPoint = []; //clear tmp control pt
    }
    this.liverender();
  }

  smoothclose(){
    if(this.points.length < 4 || l2dist(this.points[0],this.points[this.points.length-1])<EPS){
      return;
    }
    if(this.ctrlPoint.length === 0) {
      this.state = _OFF_;
      this.points.push(this.points[this.points.length-1]);
      let reflpt = reflectPoint(this.points[0], this.points[1]);
      this.points.push(reflpt);
      //this.points.push(this.points[0]);
      this.points.push(this.points[0]);
    } else {
      this.state = _OFF_;
      this.points.push(this.ctrlPoint);
      let reflpt = reflectPoint(this.points[0], this.points[1]);
      this.points.push(reflpt);
      this.points.push(this.points[0]);
      this.ctrlPoint = []; //clear tmp control pt
    }
    this.liverender();
  }

  mouseDown(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];

    if(this.state == _INIT_) { // NEW PATH
      this.state = _ON_;
      this.points = [ pt ]; //XXX: ???
      this.liverender();
    }
    else if(this.state == _OFF_) { // EXTANT PATH
      //-----------------------------------------------------------------------------
      // Adjustment of existing points
      let onPoint=false;

      if(this.points.length==1){
        let pt0 = this.points[0];
        if(l2dist(pt, pt0) < this.hitRadius) {
          this.state = _MOVE_;
          this.pointsSelected = [[0,'v']];
          if(this.ctrlPoint.length > 0) {
            this.pointsSelected.push([0,'t']);
          }
          onPoint = true;
        }
      }
      let ptidx=0;
      while(ptidx < this.points.length-1){
        let pt0  = this.points[ptidx+0],
            cpt0 = this.points[ptidx+1],
            cpt1 = this.points[ptidx+2],
            pt1  = this.points[ptidx+3];

        if(l2dist(pt, pt0) < this.hitRadius) {
          this.state = _MOVE_;
          this.pointsSelected = [[ptidx+0,'v'], [ptidx+1,'c']];
          if(ptidx-1 > 0) {
            this.pointsSelected.push([ptidx-1,'c']);
          }
          onPoint = true;
          break;
        }
        else if(l2dist(pt, pt1) < this.hitRadius) {
          this.state = _MOVE_;
          this.pointsSelected = [[ptidx+3,'v'], [ptidx+2,'c']];
          if(ptidx+4 < this.points.length) {
            this.pointsSelected.push([ptidx+4,'c']);
          }
          if(ptidx+4 >= this.points.length && this.ctrlPoint.length > 0) {
            this.pointsSelected.push([0,'t']);
          }
          onPoint = true;
          break;
        }

        // curve control-points
        if(l2dist(pt, cpt0)<this.hitRadius) {
          this.state = _MOVE_;
          this.pointsSelected = [[ptidx+1,'c']];
          onPoint = true;
          if(ptidx-1 > 0) {
            this.pointsSelected.push([ptidx-1,'c']);
          }
          break;
        }
        if(l2dist(pt, cpt1)<this.hitRadius) {
          this.state = _MOVE_;
          this.pointsSelected = [[ptidx+2,'c']];
          onPoint = true;
          if(ptidx+4 < this.points.length){
            this.pointsSelected.push([ptidx+4,'c']);
          }
          if(ptidx+4 >= this.points.length && this.ctrlPoint.length > 0) {
            this.pointsSelected.push([0,'t']);
          }
          break;
        }

        ptidx += 3;
      }

      // check hit on temporary, dangling endpoint
      if(this.ctrlPoint.length > 0){
        if(l2dist(pt, this.ctrlPoint) < this.hitRadius){
          this.state = _MOVE_;
          this.pointsSelected = [[0,'t']]
          if(this.points.length>1){
            this.pointsSelected.push([this.points.length-2,'c']);
          }
          onPoint = true;
        }
      }

      //-----------------------------------------------------------------------------
      // Adding New Points
      if(!onPoint){
        if(this.ctrlPoint.length === 0) {
          this.state = _ON_;
          this.points.push(this.points[this.points.length-1]);
          this.points.push(pt);
          this.points.push(pt);
          this.liverender();
        } else {
          this.state = _ON_;
          this.points.push(this.ctrlPoint);
          this.points.push(pt);
          this.points.push(pt);
          this.ctrlPoint = []; //clear tmp control pt
          this.liverender();
        }
      }
    }
  }

  mouseMove(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];

    if (this.state == _ON_) {
      if(this.points.length - 1 <= 0){
        this.ctrlPoint = pt;
        this.liverender();
      }
      else {
        let thispt = this.points[this.points.length-1];//line endpoint
        let prevpt = this.points[this.points.length-4];//line startpoint
        let reflpt = reflectPoint(thispt, pt);
        this.points[this.points.length-2] = reflpt;
        this.ctrlPoint = pt;
        this.liverender();
      }
    }
    else if(this.state == _MOVE_) {
      let firstHit = this.pointsSelected[0];
      // vertex move -------------------------------------------------
      if(firstHit[1]=='v') {
        let ptidx = firstHit[0];
        let oldpt = this.points[ptidx];
        let delta = sub2(pt,oldpt);
        this.points[ptidx] = pt;

        for(let hit of this.pointsSelected.slice(1)){
          let ptidx = hit[0];
          let pttype = hit[1];
          if(pttype == "c") {
            this.points[ptidx] = add2(this.points[ptidx], delta);
          }
          else if(pttype == "t") {
            this.ctrlPoint = add2(this.ctrlPoint, delta);
          }
        }
        this.liverender();
      }
      // control point move -------------------------------------------
      // must maintain continuity
      else if(firstHit[1]=='c') {
        let ptidx = firstHit[0];
        this.points[ptidx] = pt;
        if(this.pointsSelected.length===2){
          let secondHit = this.pointsSelected[1];
          if(secondHit[1]=='c') {
            let ptidx2 = secondHit[0];
            let oppositept = this.points[ptidx2];
            let centerpt = this.points[(ptidx2>ptidx ? ptidx+1 : ptidx2+1)];
            let reflectVec = normalize(reflectPoint([0,0], sub2(pt, centerpt)));
            let alpha = l2norm(sub2(oppositept, centerpt));
            let newpt = add2(scalar2(reflectVec,alpha), centerpt);
            this.points[ptidx2] = newpt;
          }
          else if(secondHit[1]=='t') {
            let oppositept = this.ctrlPoint;
            let centerpt = this.points[this.points.length-1];
            let reflectVec = normalize(reflectPoint([0,0],sub2(pt, centerpt)));
            let alpha = l2norm(sub2(oppositept, centerpt));
            let newpt = add2(scalar2(reflectVec,alpha), centerpt);
            this.ctrlPoint = newpt;
          }
        }
        this.liverender();
      }
      // control point move on dangling point --------------------------------
      else if(firstHit[1]=='t') {
        this.ctrlPoint = pt;
        if(this.pointsSelected.length===2){
          let secondHit = this.pointsSelected[1];
          let ptidx2 = secondHit[0];
          let oppositept = this.points[ptidx2];
          let centerpt = this.points[ptidx2+1];
          let reflectVec = normalize(reflectPoint([0,0],sub2(pt, centerpt)));
          let alpha = l2norm(sub2(oppositept, centerpt));
          let newpt = add2(scalar2(reflectVec,alpha), centerpt);
          this.points[ptidx2] = newpt;
        }
        this.liverender();
      }
    }
  }

  mouseUp(e) {
    if(this.state===_INIT_){return;} //edgecase of accidental mouseup before drawing
    this.state = _OFF_;
    this.pointsSelected = [];
    this.liverender();
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
         let [cpt0,cpt1,pt1] = this.points.splice(-3);
         this.ctrlPoint = cpt0;
         this.liverender();
    } else if (this.state == _OFF_) {
      this.points = [];
      this.state = _INIT_;
      this.liverender();
    }
  }

}
