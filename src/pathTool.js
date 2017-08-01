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
        livecanvas, lctx, canvas, ctx,
        affineset,
        commitOp
       } from './main';
import { _ } from 'underscore';
import {add2, sub2, scalar2, normalize, l2norm, l2dist, reflectPoint} from './math_utils';


export class PathOp {
  constructor(ctxStyle, ops) {
    this.ctxStyle = ctxStyle;
    // array of ["M",x,y] or ["L",x,y] or ["C",xc1,yc1,xc2,yc2,x,y] drawing ops
    this.ops = ops;
    this.tool = "bezier";
  }

  render(ctx) {
    //if(this.ops.length==0){return;} //empty data case
    _.assign(ctx, this.ctxStyle);
    for (let af of affineset) {
      ctx.beginPath();
      for(let op of this.ops){
        if(op[0] == "M") {
          let Tpt = af.on(op[1], op[2]);
          ctx.moveTo(Tpt[0], Tpt[1]);
        }
        else if(op[0] == "L") {
          let Tpt = af.on(op[1], op[2]);
          ctx.lineTo(Tpt[0], Tpt[1]);
        }
        else if(op[0] == "C"){
          let Tpt0 = af.on(op[1], op[2]);
          let Tpt1 = af.on(op[3], op[4]);
          let Tpt2 = af.on(op[5], op[6]);
          ctx.bezierCurveTo(Tpt0[0], Tpt0[1], Tpt1[0], Tpt1[1], Tpt2[0], Tpt2[1]);
        }
      }
      ctx.stroke();
      ctx.fill();
    }
  }

  serialize() {
    return ["bezier", this.ops];
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

//TODO: hide control points for most vertices unless they're "parent" vertex
//      is selected

// XXX: Below is a crazy mess... need to refactor storage format of path into
// something more amenable for traversal and editing.
export class PathTool {
  constructor() {
    this.ops = [];
    this.state = _INIT_;
    this.cpoint = [];
    this.opselected = [];
    this.hitRadius = 4;
  }

  liverender() {
    lctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let af of affineset) {
      lctx.beginPath();
      for(let op of this.ops){
        if(op[0] === "M") {
          let Tpt = af.on(op[1], op[2]);
          lctx.moveTo(Tpt[0], Tpt[1]);
        }
        else if(op[0] === "L") {
          let Tpt = af.on(op[1], op[2]);
          lctx.lineTo(Tpt[0], Tpt[1]);
        }
        else if(op[0] === "C"){
          let Tpt0 = af.on(op[1], op[2]);
          let Tpt1 = af.on(op[3], op[4]);
          let Tpt2 = af.on(op[5], op[6]);
          lctx.bezierCurveTo(Tpt0[0], Tpt0[1], Tpt1[0], Tpt1[1], Tpt2[0], Tpt2[1]);
        }
      }
      lctx.stroke();
      lctx.fill();
    }

    let lastpt = [];
    // draw handles
    lctx.save();
    lctx.lineWidth = 1.0;
    lctx.fillStyle   = "rgba(255,0,0,0.2)";
    lctx.strokeStyle = "rgba(255,0,0,1.0)";
    for(let op of this.ops) {
      if(op[0] == "M") {
        lctx.beginPath();
        lctx.arc(op[1], op[2], this.hitRadius, 0, 2*Math.PI);
        lctx.stroke();
        lctx.fill();
        lastpt = [op[1], op[2]];
      }
      else if(op[0] == "L") {
        lctx.beginPath();
        lctx.arc(op[1], op[2], this.hitRadius, 0, 2*Math.PI);
        lctx.stroke();
        lctx.fill();
        lastpt = [op[1], op[2]];
      }
      else if(op[0] == "C") {
        //endpoint
        lctx.beginPath();
        lctx.arc(op[5], op[6], this.hitRadius, 0, 2*Math.PI);
        lctx.stroke();
        lctx.fill();
        //control points
        lctx.save();
        lctx.fillStyle = "rgba(255,0,0,1.0)";
        lctx.beginPath();
        lctx.arc(op[1], op[2], this.hitRadius-2, 0, 2*Math.PI);
        lctx.stroke();
        lctx.fill();
        lctx.beginPath();
        lctx.arc(op[3], op[4], this.hitRadius-2, 0, 2*Math.PI);
        lctx.stroke();
        lctx.fill();
        // handle lines for control points
        lctx.beginPath();
        lctx.moveTo(lastpt[0],lastpt[1]);
        lctx.lineTo(op[1],op[2]);
        lctx.stroke();
        lctx.beginPath();
        lctx.moveTo(op[3],op[4]);
        lctx.lineTo(op[5],op[6]);
        lctx.stroke();
        lctx.restore();
        lastpt = [op[5], op[6]];
      }
    }
    if(this.cpoint.length > 0){ //temp control point render
      lctx.save();
      lctx.fillStyle = "rgba(255,0,0,1.0)";
      lctx.beginPath();
      lctx.arc(this.cpoint[0], this.cpoint[1], this.hitRadius-2, 0, 2*Math.PI);
      lctx.stroke();
      lctx.fill();
      // handle line
      lctx.beginPath();
      lctx.moveTo(lastpt[0],lastpt[1]);
      lctx.lineTo(this.cpoint[0],this.cpoint[1]);
      lctx.stroke();
      lctx.restore();
    }
    lctx.restore();
  }

  mouseDown(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];

    if(this.state == _INIT_) { // NEW PATH
      this.state = _ON_;
      this.ops = [ ["M", pt[0], pt[1]] ];
      this.liverender();
    }
    else if(this.state == _OFF_) { // EXTANT PATH
      //-----------------------------------------------------------------------------
      // Adjustment of existing points
      let onPoint=false;
      for(let idx=0; idx<this.ops.length; idx++) {
        let op = this.ops[idx];
        if(op[0]=="M" || op[0] == "L") {
          if(l2dist(pt, [op[1],op[2]])<this.hitRadius) {
            this.state = _MOVE_;
            this.opselected = [[idx,0,'v']];
            onPoint = true;

            // does this endpoint overlap with a following control point?
            if(idx+1 < this.ops.length && this.ops[idx+1][0]=="C") {
              let nextop = this.ops[idx+1];
              this.opselected.push([idx+1,0,'c']);
            }
            if(idx+1 >= this.ops.length && this.cpoint.length > 0) {
              this.opselected.push([0,0,'t']);
            }
            break;
          }
        }
        else if(op[0]=="C") {
          // curve endpoint
          if(l2dist(pt, [op[5], op[6]])<this.hitRadius) {
            this.state = _MOVE_;
            this.opselected = [[idx,2,'v']];
            onPoint = true;

            // select associated endpoints
            this.opselected.push([idx,1,'c']);
            if(idx+1 < this.ops.length && this.ops[idx+1][0]=="C"){
              this.opselected.push([idx+1,0,'c']);
            }
            if(idx+1 >= this.ops.length && this.cpoint.length > 0) {
              this.opselected.push([0,0,'t']);
            }
            break;
          }

          // curve control-points - overlap ruled out by above cases
          if(l2dist(pt, [op[1], op[2]])<this.hitRadius) {
            this.state = _MOVE_;
            this.opselected = [[idx,0,'c']];
            onPoint = true;
            if(this.ops[idx-1][0]=="C"){
              this.opselected.push([idx-1,1,'c']);
            }
            break;
          }
          if(l2dist(pt, [op[3], op[4]])<this.hitRadius) {
            this.state = _MOVE_;
            this.opselected = [[idx,1,'c']];
            onPoint = true;
            if(idx+1 < this.ops.length && this.ops[idx+1][0]=="C"){
              this.opselected.push([idx+1,0,'c']);
            }
            if(idx+1 >= this.ops.length && this.cpoint.length > 0) {
              this.opselected.push([0,0,'t']);
            }
            break;
          }
        }
      }
      // check hit on temporary, dangling endpoint
      if(this.cpoint.length > 0){
        if(l2dist(pt, this.cpoint) < this.hitRadius){
          this.state = _MOVE_;
          this.opselected = [[0,0,'t']];
          onPoint = true;
          if(this.ops[this.ops.length-1][0]=="C"){
            this.opselected.push([this.ops.length-1,1,'c']);
          }
        }
      }
      //-----------------------------------------------------------------------------
      // Adding New Points
      if(!onPoint){
        if(this.cpoint.length === 0) {
          this.state = _ON_;
          this.ops.push( ["L", pt[0], pt[1]] );
          this.liverender();
        } else {
          this.state = _ON_;
          this.ops.push( ["C",
                             this.cpoint[0], this.cpoint[1],
                             pt[0], pt[1],
                             pt[0], pt[1] ] );
          this.cpoint = []; //clear tmp control pt
          this.liverender();
        }
      }
    }
  }

  getOpEndPoint(op){
    if(op[0]=="M"){return [op[1],op[2]];}
    else if(op[0]=="L"){return [op[1],op[2]];}
    else if(op[0]=="C"){return [op[5],op[6]];}
  }

  //could simplify this by not using L ops at all, just twiddling C ops
  //then at end of commit() convert C ops representing lines to L ops... i think?
  mouseMove(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];

    if (this.state == _ON_) {
      if(this.ops[this.ops.length-1][0]=="M"){
        this.cpoint = [pt[0], pt[1]]; //tmp pt
        this.liverender();
      }
      //complicated, upconvert line operation to curve operation
      else if(this.ops[this.ops.length-1][0]=="L"){
        let thisop = this.ops[this.ops.length-1];
        let prevop = this.ops[this.ops.length-2];
        let thispt = this.getOpEndPoint(thisop); //line endpoint
        let prevpt = this.getOpEndPoint(prevop); //line startpoint
        let reflpt = reflectPoint(thispt, pt);
        this.ops[this.ops.length-1]=["C",
                                     prevpt[0], prevpt[1],
                                     reflpt[0], reflpt[1],
                                     thispt[0], thispt[1]];
        this.cpoint = [pt[0], pt[1]]; //tmp pt
        this.liverender();
      }
      else if(this.ops[this.ops.length-1][0]=="C"){
        let thisop = this.ops[this.ops.length-1];
        let thispt = this.getOpEndPoint(thisop); //line endpoint
        let reflpt = reflectPoint(thispt, pt);
        this.ops[this.ops.length-1]=["C",
                                     thisop[1], thisop[2],
                                     reflpt[0], reflpt[1],
                                     thispt[0], thispt[1]];
        this.cpoint = [pt[0], pt[1]]; //tmp pt
        this.liverender();
      }
    }
    else if(this.state == _MOVE_) {
      let firstHit = this.opselected[0];
      // vertex move -------------------------------------------------
      if(firstHit[2]=='v') {
        let idx = firstHit[0];
        let ptidx = firstHit[1];
        let oldpt = [this.ops[idx][2*ptidx + 1],
                     this.ops[idx][2*ptidx + 2]];
        let delta = [pt[0]-oldpt[0], pt[1]-oldpt[1]];
        this.ops[idx][2*ptidx + 1] = pt[0];
        this.ops[idx][2*ptidx + 2] = pt[1];

        for(let hit of this.opselected.slice(1)){
          let idx = hit[0];
          let ptidx = hit[1];
          let pttype = hit[2];
          if(pttype == "c") {
            this.ops[idx][2*ptidx + 1] += delta[0];
            this.ops[idx][2*ptidx + 2] += delta[1];
          }
          else if(pttype == "t") {
            this.cpoint[0] += delta[0];
            this.cpoint[1] += delta[1];
          }
        }
        this.liverender();
      }
      // control point move -------------------------------------------
      // must maintain continuity
      else if(firstHit[2]=='c') {
        let idx = firstHit[0];
        let ptidx = firstHit[1];
        this.ops[idx][2*ptidx + 1] = pt[0];
        this.ops[idx][2*ptidx + 2] = pt[1];
        if(this.opselected.length===2){
          let secondHit = this.opselected[1];
          if(secondHit[2]=='c') {
            let idx2 = secondHit[0];
            let ptidx2 = secondHit[1];
            let oppositept = [this.ops[idx2][2*ptidx2 + 1],
                              this.ops[idx2][2*ptidx2 + 2]];
            let centerpt = [this.ops[Math.min(idx,idx2)][5],
                            this.ops[Math.min(idx,idx2)][6]];
            let reflectVec = normalize(reflectPoint([0,0],sub2(pt, centerpt)));
            let alpha = l2norm(sub2(oppositept, centerpt));
            let newpt = add2(scalar2(reflectVec,alpha), centerpt);
            this.ops[idx2][2*ptidx2 + 1] = newpt[0];
            this.ops[idx2][2*ptidx2 + 2] = newpt[1];
          }
          else if(secondHit[2]=='t') {
            let oppositept = this.cpoint;
            let centerpt = [this.ops[this.ops.length-1][5],
                            this.ops[this.ops.length-1][6]];
            let reflectVec = normalize(reflectPoint([0,0],sub2(pt, centerpt)));
            let alpha = l2norm(sub2(oppositept, centerpt));
            let newpt = add2(scalar2(reflectVec,alpha), centerpt);
            this.cpoint[0] = newpt[0];
            this.cpoint[1] = newpt[1];
          }
        }
        this.liverender();
      }
      // control point move on dangling point --------------------------------
      else if(firstHit[2]=='t') {
        this.cpoint = pt;
        if(this.opselected.length===2){
          let secondHit = this.opselected[1];
          let idx2 = secondHit[0];
          let ptidx2 = secondHit[1];
          let oppositept = [this.ops[idx2][2*ptidx2 + 1],
                            this.ops[idx2][2*ptidx2 + 2]];
          let centerpt = [this.ops[idx2][5], this.ops[idx2][6]];
          let reflectVec = normalize(reflectPoint([0,0],sub2(pt, centerpt)));
          let alpha = l2norm(sub2(oppositept, centerpt));
          let newpt = add2(scalar2(reflectVec,alpha), centerpt);
          this.ops[idx2][2*ptidx2 + 1] = newpt[0];
          this.ops[idx2][2*ptidx2 + 2] = newpt[1];
        }
        this.liverender();
      }
    }
  }

  mouseUp(e) {
    this.state = _OFF_;
    this.opselected = [];
    this.liverender();
  }

  //mouseLeave(e) {
  //  this.exit();
  //}

  keyDown(e) {
    if(e.code == "Enter"){
      this.state = _OFF_;
      this.commit();
      this.exit();
    } else if(e.code=="Escape"){
      this.cancel();
    } else if(e.code=="KeyD"){
      if(this.ops.length > 1 &&
         this.state == _OFF_) {
        var op = this.ops.pop();
        if(op[0]=='C'){
          this.cpoint=[op[1],op[2]];
        } else {
          this.cpoint=[];
        }
        this.liverender();
      }
    }
  }

  commit() {
    if(this.state==_INIT_){return;} //empty data case
    let ctxStyle = _.assign({}, _.pick(lctx, ...gConstants.CTXPROPS));
    commitOp(new PathOp(ctxStyle, this.ops));
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
  }

  cancel() {
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
    this.state = _INIT_;
    this.ops = [];
  }

  enter(op) {
    if(op){
        _.assign(gS.ctxStyle, _.clone(op.ctxStyle));
        _.assign(lctx, op.ctxStyle);
        this.ctxStyle = _.clone(op.ctxStyle); //not really necessary...
        this.ops = op.ops;
        this.opselected = [];
        this.cpoint = [];
        this.state = _OFF_;
        this.liverender();
    } else{
      this.ops = [];
      this.opselected = [];
      this.cpoint = [];
      this.state = _INIT_;
    }
  }
  exit(){
    //if(this.state==_OFF_) { // remove conditional?
      //this.commit();
      this.ops = [];
      this.opselected = [];
      this.cpoint = [];
      this.state = _INIT_;
    //}
  }
}
