## Vue

vue.js updating canvas via _directives_:
https://jsfiddle.net/mani04/r4mbh6nu/1/

simpler color picker, not quite as nice:
https://codepen.io/getflourish/pen/NbxByK

## design

icons:
    https://useiconic.com/open
    https://material.io/icons
    https://thenounproject.com

sliders (input range) styling:
    http://brennaobrien.com/blog/2014/05/style-input-type-range-in-every-browser.html

## tools

- freehand lines, pressure-sensitive (width or color intensity)
- circle/ellipse
- free polygon
- rectangle any orientation (fat line)
- bezier
- magic-wand - tricky but doable, good for coloring-in serendipitous regions:
  http://losingfight.com/blog/2007/08/28/how-to-implement-a-magic-wand-tool/
- sprite transfer
  https://devbutze.blogspot.com/2014/02/html5-canvas-offscreen-rendering.html

## canvas layering

https://www.ibm.com/developerworks/library/wa-canvashtml5layering/

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
 - symm: p3
 - pushtrafo: dx,dy,theta,scalex,scaley // [af00, af01, af10, af11, afdx, afdy]
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

SVG - easy enough to do an OKish export from the command stack


example command stack of very pretty pattern:
["color",100,100,100,1]
["sym","p6m",800,400,100,0]
["style",{"lineCap":"butt","lineJoin":"round","miterLimit":10,"lineWidth":1}]
<-- these are constant at init
["line",{"x":579,"y":268},{"x":753,"y":234}]
["color",232,109,109,0.65]
["line",{"x":574,"y":273},{"x":594,"y":374}]
