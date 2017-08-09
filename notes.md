# Eschersketch Notes

islamic art:
http://www.issam-el-said.co.uk/16253.html
Geometric Concepts in Islamic Arts by Issam El-Said
https://qunud.wordpress.com/tag/daud-sutton/

## MVP
- decently stable save format...
- dev Notes?

later...
- tile svg export (clipping)
- pressure sensitive pen tool
- arc tool?
- frieze groups
- color-rot wallpaper groups?

## Bugs
- polygon tool always closes path - should allow nonclosure
- path tool end-joining - continuous possible?
- modified lines around 437 of canvas2svg.js - the IE fix section that fixes
  xmnls uses a regex that hits recursion depth on our huge SVG files...
  so commented out that to fix

# AWS
https://aws.amazon.com/sdk-for-browser/

## Vue draggable list
https://jsfiddle.net/dede89/sqssmhtz/
https://github.com/SortableJS/Vue.Draggable


## Mobile Detection
http://detectmobilebrowsers.com/about
https://modernizr.com/

## Design

icons:
    https://useiconic.com/open
    https://material.io/icons
    https://thenounproject.com

sliders (input range) styling:
    http://brennaobrien.com/blog/2014/05/style-input-type-range-in-every-browser.html

## Tools
- bezier brush
  https://gitlab.com/erehm/PiecewiseG1BezierFit
  http://jimherold.com/2012/04/20/least-squares-bezier-fit/
- freehand lines, pressure-sensitive (width or color intensity)
- ellipse
- free polygon
- rectangle any orientation (fat line)
- bezier
- magic-wand - tricky but doable, good for coloring-in serendipitous regions
  ALREADY MADE:
  https://jsfiddle.net/Tamersoul/dr7Dw/
  https://github.com/Tamersoul/magic-wand-js
  exposition:
  http://losingfight.com/blog/2007/08/28/how-to-implement-a-magic-wand-tool/
  OK this doesn't really work easy... pixel ops don't really work in a precise
  vector environment...
- sprite transfer?
  https://devbutze.blogspot.com/2014/02/html5-canvas-offscreen-rendering.html

## Symmetries
- add rosette-group symms
- add frieze symms ?
- other nonlinear scaling symms
- spherical? hyperbolic?

## Canvas Layering

https://www.ibm.com/developerworks/library/wa-canvashtml5layering/

## Command Stack

command-stack:
 - init
 - symm: p4m
 - stroke: yadda yadda
 - fill: yadda yadda
 - color: r,g,b
 - line: x0,y0,x1,y1
 - line: x0,y0,x1,y1
 - line: x0,y0,x1,y1
 - symm: p3
 - pushtrafo: dx,dy,theta,scalex,scaley // [af00, af01, af10, af11, afdx, afdy]
 - line: x0,y0,x1,y1
 - poptrafo //??? push/pop or absolute ???
 - circle: x0,y0,r
 - stroke: yadda yadda
 - fill: yadda yadda
 - color: r,g,b
 - poly: [x0,y0,x1,y1,...xN,yN] //autocloses

example command stack of very pretty pattern:
["color",100,100,100,1]
["sym","p6m",800,400,100,0]
["style",{"lineCap":"butt","lineJoin":"round","miterLimit":10,"lineWidth":1}]
<-- these are constant at init
["line",{"x":579,"y":268},{"x":753,"y":234}]
["color",232,109,109,0.65]
["line",{"x":574,"y":273},{"x":594,"y":374}]


this would work, but live-update of lines, poly, etc. would be slow as shit if we redraw,
so need a transparent live-layer canvas for live redraws of the new element eg.

cached render of command-stack + cached trafo, symmetry:
 - line x0,y0, live(X1), live(Y1)

upon final gets added to command-stack and drawn on cached image

undo/redo force redraws for now

additional optimization for lots of symmetry redraws: draw a smaller set of nearby tiled symms for live redraw, and draw the whole set only upon commit


## Interesting Canvas/ctx Functions:
- isPointInPath()
- createPattern()
- globalCompositeOperation
