<h2 style="text-align:center;font-variant:small-caps;">
escher
<img src="static/svg/es_logo.svg" class="helplogo" height="50px">
sketch <span style="font-size:50%">v0.3</span></h2>


## what is this?

A symmetry drawing program


## Undo / Redo

Icon   | Tool | Description
-------|------|-------------------
<span class="icon-undo"/>| undo | steps back a drawing step, re-entering interactive editing for previous draw tool
<span class="icon-redo"/>| redo | reapplies a previously undone tool - note that the redo stack is not automatically emptied
<span class="icon-bin"/>| reset | __erases everything__ - requires two clicks within 1sec to activate
<span class="icon-cog"/>| settings | more esoteric configuration parameters for eschersketch
 __¿?__ | this help | leads you to the truth

 ## Drawing Tools

 Icon   | Tool | Description
 -------|------|-------------------
 <span class="icon-pencil"/>  | __pencil__ tool | freehand drawing tool, stroke-only
 <span class="icon-line"/> | __line__ tool | draws single line segments between two points - _adjustable_
 <span class="icon-radio-unchecked"/> | __circle__ tool | draws a single circle, 1st point at center, 2nd at edge
 <span class="icon-hexagon"/> | __polygon__ tool | draws a straight-sided polygon, _adjustable_ points
 <span class="icon-pen"/>| __path__ tool | draws bezier curves and straight lines, both vertices and control points are _adjustable_

 ## Color

 Icon   | Tool | Description
 -------|------|-------------------
 <span class="icon-fill"/>| set fill color | color palette chooses fill color
 <span class="icon-stroke"/>| set stroke color | color palette chooses stroke color
 <span class="icon-no-stroke"> <span class="path1"></span><span class="path2"></span></span>| no stroke | sets stroke color to fully transparent
 <span class="icon-no-fill"> <span class="path1"></span><span class="path2"></span></span>| no fill | sets fill color to fully transparent

Color can be set by clicking within the saturation panel, the hue slider, and the transparency slider - alternatively, specific colors can be entered in Hex, RGBA, or HSLA color spaces.

## Line Styling

Line width can be set, as well as the line-cap -- the shape at the end of the line, noticeable for thicker lines, and the line-join, which dictates how two line segments are connected together - round, beveled, or in a pointy "miter".  For the miter join, a "miter limit" is set, which cuts off how far the pointy bits can go for lines joining at very narrow angles.

## Symmetries

The heart of this program.  You can choose to go with no symmetry like a howling animal from the dens of unthinking chaos.  You can get your feet wet with a "rosette" or [Point Group][1] that makes little flower- or mandala- like patterns about a single point.  Also on the menu today are the 17 classic [Wallpaper Groups][2] that are the only _perfectly regular_ way to build a repeating pattern in 2 dimensions.  These
can be characterized by what _kinds_ of symmetries they have

You've heard of rotations and reflections.  The only symmetry you may not have heard of is a "glide reflection" - where you move along an a line a given distance and _then_ reflect across it.

Rotation Free Patterns | &nbsp;
----------------|--------------
__p1__  | strict translation symmetry - no rotations or reflections map the pattern to itself
__pm__  | no rotational symmetry - it has reflection axes, all of which are parallel to one-another
__cm__  | reflection axes are parallel to each other, and an independent glide axis lies in-between each of these axes, think offset rows
__pg__  | herringbone pattern as the classic example

<br>

180&deg; Containing Patterns | &nbsp;
-------------------------------|--------
__pmg__ | two 180&deg; rotations, and reflections in only one direction - glide reflections perpendicular to reflection axis
__pgg__ | two glide reflection axes perpendicular to each other, and two 180&deg; rotation centers not sitting on either axis
__pmm__ | reflections in two perpendicular directions, and four 180&deg; rotation centres at the intersections of the reflection axes
__p2__  | the group p2 contains four rotation centres of 180&deg; rotational symmetry, but no reflections or glide reflections.
__cmm__ | the symmetry of brick walls

<br>

Square Symmetric Patterns | &nbsp;
-------------------------------|--------
__p4__  | two 90&deg; rotation centres, and one 180&deg; rotation no reflections or glide reflections.
__p4g__ | symmetry of fly screens
__p4m__ | checkerboard symmetry

<br>

Hexagonally Symmetric Patterns | &nbsp;
-------------------------------|--------
__p3__  | beautiful 120&deg; symmetry
__p6__  | really beautiful 60&deg; symmetry
__p31m__ | even more astounding, seriously go check out [wikipedia][2] to see pictures, or play with it yourself here.
__p3m1__ | dammmnnn, son!
__p6m__  | woah... ultimate, mystical pinnacle of perfect 2d symmetry, commonly seen in persian art, this is the default one set at the beginning

There are other ways of "almost" symmetrically tiling the plane in ["aperiodic" tilings][3], these were first discovered by pattern-makers in the islamic world centuries ago, but were re-discovered in the west by mathematicians only this century.  They're very cool, but eschersketch can't yet automatically make these patterns -- yet -- maybe one day!



[1]: https://en.wikipedia.org/wiki/Point_group
[2]: https://en.wikipedia.org/wiki/Wallpaper_group
[3]: https://en.wikipedia.org/wiki/Aperiodic_tiling

[designa]: https://www.amazon.com/Designa-Wooden-Books/dp/1620406594
