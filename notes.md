# Eschersketch Notes

## MVP
- refactor to be hackable later...
- gridsize nx,ny limit to some max so as not to crash browser...
- rosette groups UI and identity (no trafo)
- tile png export
- tile svg export (clipping) if easy... later if hard
- touch events if not insane

later...
- arc tool?
- UI improvement
- frieze groups
- color-rot wallpaper groups?

## Bugs

- modified lines around 437 of canvas2svg.js - the IE fix section that fixes
  xmnls uses a regex that hits recursion depth on our huge SVG files...
  so commented out that fix

- colorpicker flakes if fillcolor, strokecolor RGBs are same on init... seems fine
  if they're set different.

## Vue

vue.js updating canvas via _directives_:
https://jsfiddle.net/mani04/r4mbh6nu/1/

simpler color picker, not quite as nice:
https://codepen.io/getflourish/pen/NbxByK

CAVEATS!!!
ARRAY CAVEATS:
    vm.items[indexOfItem] = newValue  won't update reactive array!
must use Vue.set:
    Vue.set(example1.items, indexOfItem, newValue)
No:
    vm.items.length = newLength
Yes:
    example1.items.splice(newLength)

OBJECT CAVEATS:
var vm = new Vue({
  data: {
    a: 1
  }
})
// `vm.a` is now reactive
vm.b = 2
// `vm.b` is NOT reactive

instead use
Vue.set(vm.someObject, 'b', 2)
or
this.$set(this.someObject, 'b', 2)

careful with objects
// instead of `Object.assign(this.someObject, { a: 1, b: 2 })`
this.someObject = Object.assign({}, this.someObject, { a: 1, b: 2 })

nice keyboard event modifiers, etc.:
https://vuejs.org/v2/guide/events.html


## Design

icons:
    https://useiconic.com/open
    https://material.io/icons
    https://thenounproject.com

sliders (input range) styling:
    http://brennaobrien.com/blog/2014/05/style-input-type-range-in-every-browser.html

## Tools
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

## Export

Export the lattice tile (not smallest repeating unit, lattice
tiles are easy to tile in a cartesian manner for designers)
Have a way of redrawing at higher res?

SVG
- current canvas2svg can take a while and makes huge, repetitive files... should strongly limit
  Nx,Ny repeats of grid, or create custom serializer that creates a "def" object around a single
  untransformed set of graphical objects and then renders symmetries with <use> elements with
  matrix SVG trafos



