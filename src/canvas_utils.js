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

// HTML5 canvas .ellipse() polyfill for IE
if (CanvasRenderingContext2D.prototype.ellipse == undefined) {
  CanvasRenderingContext2D.prototype.ellipse = function(x, y, radiusX, radiusY, rotation, startAngle, endAngle, antiClockwise) {
    this.save();
    this.translate(x, y);
    this.rotate(rotation);
    this.scale(radiusX, radiusY);
    this.arc(0, 0, 1, startAngle, endAngle, antiClockwise);
    this.restore();
  };
}


// Parse colors of the form #rgb, #rrggbb, rgba(r,g,b,a)
//------------------------------------------------------------------------------
export const parseColor = function(clrstr){
  if(/^#/.test(clrstr)){
    clrstr = clrstr.slice(1);
    var digit = clrstr.split("");
    if(digit.length === 3){
      digit = [ digit[0],digit[0],digit[1],digit[1],digit[2],digit[2] ]
    }
    var r = parseInt( [digit[0],digit[1] ].join(""), 16 );
    var g = parseInt( [digit[2],digit[3] ].join(""), 16 );
    var b = parseInt( [digit[4],digit[5] ].join(""), 16 );
    return [r,g,b,1.0];
  } else{
    let tmp = clrstr.substring(5, clrstr.length-1).replace(/ /g, '').split(',');
    return [parseInt(tmp[0]),parseInt(tmp[1]),parseInt(tmp[2]),parseFloat(tmp[3])];
  }
};


// Canvas DPI Tweaks
//------------------------------------------------------------------------------

// Fixes DPI issues with Retina displays on Chrome
// http://www.html5rocks.com/en/tutorials/canvas/hidpi/
export const pixelFix = function(canvas) {
  // get the canvas and context
  const context = canvas.getContext('2d');

  // finally query the various pixel ratios
  const devicePixelRatio = window.devicePixelRatio || 1;
  const backingStoreRatio = context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio || 1;

  const ratio = devicePixelRatio / backingStoreRatio;

  // upscale the canvas if the two ratios don't match
  if (devicePixelRatio !== backingStoreRatio) {

    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    canvas.width = oldWidth * ratio;
    canvas.height = oldHeight * ratio;
    canvas.style.width = oldWidth + 'px';
    canvas.style.height = oldHeight + 'px';

    // now scale the context to counter the fact that we've
    // manually scaled our canvas element
    context.scale(ratio, ratio);
  }

  return ratio;
};


// Scales the number of "backing pixels" for a given on-screen pixel
// to a higher value - useful for high-DPI exports
export const setCanvasPixelDensity = function(canvas, ratio) {
  // get the canvas and context
  const context = canvas.getContext('2d');

  const oldWidth = canvas.width;
  const oldHeight = canvas.height;
  canvas.width = oldWidth * ratio;
  canvas.height = oldHeight * ratio;
  canvas.style.width = oldWidth + 'px';
  canvas.style.height = oldHeight + 'px';

  // now scale the context to counter
  // the fact that we've manually scaled
  // our canvas element
  context.scale(ratio, ratio);
};


export const drawCircle = function(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2*Math.PI);
  ctx.stroke();
  ctx.fill();
}

export const drawHitCircle = function(ctx, x, y, r) {
  ctx.save();
  ctx.lineWidth = 2.0;
  ctx.fillStyle =   "rgba(255,0,0,0.2)";
  ctx.strokeStyle = "rgba(0,0,0,1.0)";
  ctx.beginPath();
  ctx.arc(x, y, r-1, 0, 2*Math.PI);
  ctx.stroke();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,1.0)";
  ctx.beginPath();
  ctx.arc(x, y, r+1, 0, 2*Math.PI);
  ctx.stroke();
  ctx.fill();
  ctx.restore();
}

export const drawHitLine = function(ctx, x0, y0, x1, y1) {
  ctx.save();
  ctx.lineWidth = 2.0;
  ctx.strokeStyle = "rgba(255,0,0,1.0)";
  ctx.beginPath();
  ctx.moveTo(x0,y0);
  ctx.lineTo(x1,y1);
  ctx.stroke();
  ctx.restore();
}

/*
const drawEllipseByCenter = function(ctx, cx, cy, w, h) {
  drawEllipse(ctx, cx - w/2.0, cy - h/2.0, w, h);
}
const drawEllipse = function(ctx, x, y, w, h) {
  var kappa = .5522848,
      ox = (w / 2) * kappa, // control point offset horizontal
      oy = (h / 2) * kappa, // control point offset vertical
      xe = x + w,           // x-end
      ye = y + h,           // y-end
      xm = x + w / 2,       // x-middle
      ym = y + h / 2;       // y-middle

  ctx.beginPath();
  ctx.moveTo(x, ym);
  ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
  ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
  ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
  ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
  //ctx.closePath(); // not used correctly, see comments (use to close off open path)
  ctx.stroke();
}
*/
