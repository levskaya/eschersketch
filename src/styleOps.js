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


// ColorOp sets stroke color of ctx
//------------------------------------------------------------------------------
export class ColorOp {
  constructor(target,r,g,b,a) {
    this.target = target; // "fill" or "stroke"
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  render(ctx){
    if(this.target == "stroke") {
      ctx.strokeStyle = "rgba("+this.r+","+this.g+","+this.b+","+this.a+")";
      // HACK: ghetto, fix application to all contexts...
      lctx.strokeStyle = "rgba("+this.r+","+this.g+","+this.b+","+this.a+")";
      // HACK: directly mutate global that's watched by vue...
      gS.strokecolor.r = this.r;
      gS.strokecolor.g = this.g;
      gS.strokecolor.b = this.b;
      gS.strokecolor.a = this.a;
    }
    else if(this.target == "fill") {
      ctx.fillStyle = "rgba("+this.r+","+this.g+","+this.b+","+this.a+")";
      // HACK: ghetto, fix application to all contexts...
      lctx.fillStyle = "rgba("+this.r+","+this.g+","+this.b+","+this.a+")";
      // HACK: directly mutate global that's watched by vue...
      gS.fillcolor.r = this.r;
      gS.fillcolor.g = this.g;
      gS.fillcolor.b = this.b;
      gS.fillcolor.a = this.a;
    }
  }

  serialize(){
    return ["color", this.target, this.r, this.g, this.b, this.a];
  }

  deserialize(data){
    return new ColorOp(data[1], data[2], data[3], data[4], data[5]);
  }
}

export class StyleOp {
  /*
    lineCap	Sets or returns the style of the end caps for a line
    lineJoin	Sets or returns the type of corner created, when two lines meet
    lineWidth	Sets or returns the current line width
    miterLimit  Sets or returns the maximum miter length
  */
  constructor(styleProps) {
    this.styleProps = Object.assign({}, gS.ctxStyle, styleProps);
  }

  render(ctx){
    for(var prop of Object.keys(this.styleProps)){
      ctx[prop] = this.styleProps[prop];
      // HACK: ghetto, fix application to all contexts...
      lctx[prop] = this.styleProps[prop];
      // HACK: directly mutate global that's watched by vue...
      gS.ctxStyle[prop] = this.styleProps[prop];
    }
  }

  serialize(){
    return ["style", this.styleProps];
  }

  deserialize(data){
    return new StyleOp(data[1]);
  }
}
