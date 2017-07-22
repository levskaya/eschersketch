## Vue

vue.js updating canvas via _directives_:
https://jsfiddle.net/mani04/r4mbh6nu/1/

## tools

- freehand lines, pressure-sensitive (width or color intensity)
- circle/ellipse
- free polygon
- rectangle any orientation (fat line)
- bezier

## command stack

command-stack:
 - init
 - symm: p4m
 - stroke: yadda yadda
 - fill: yadda yadda
 - color: r,g,b
 - line: x0,y0,x1,y1
 - line: x0,y0,x1,y1
 - line: x0,y0,x1,y1
 - line: x0,y0,x1,y1
 - line: x0,y0,x1,y1
 - line: x0,y0,x1,y1
 - symm: p3
 - pushtrafo: dx,dy,theta,scalex,scaley // [af00, af01, af10, af11, afdx, afdy]
 - line: x0,y0,x1,y1
 - line: x0,y0,x1,y1
 - line: x0,y0,x1,y1
 - poptrafo //??? push/pop or absolute ???
 - circle: x0,y0,r
 - stroke: yadda yadda
 - fill: yadda yadda
 - color: r,g,b
 - poly: [x0,y0,x1,y1,...xN,yN] //autocloses

this would work, but live-update of lines, poly, etc. would be slow as shit if we redraw,
so need a transparent live-layer canvas for live redraws of the new element eg.

cached render of command-stack + cached trafo, symmetry:
 - line x0,y0, live(X1), live(Y1)

upon final gets added to command-stack and drawn on cached image

undo/redo force redraws for now

additional optimization for lots of symmetry redraws: draw a smaller set of nearby tiled symms for live redraw, and draw the whole set only upon commit

# tile export

Export the lattice tile (not smallest repeating unit, lattice
tiles are easy to tile in a cartesian manner for designers)
Have a way of redrawing at higher res?

SVG?
