<slot name="header"></slot>

## What is this?


A drawing program that forces what you draw to obey certain __symmetries__, or regular patterns.  It allows for export
into a bitmap PNG Tile for use with fabric design and wallpaper as well as SVG for graphic design.

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
 <span class="icon-line"/> | __line__ tool | draws single line segments between two _adjustable_ points
 <span class="icon-radio-unchecked"/> | __circle__ tool | draws a single centered circle, from two _adjustable_ points
 <span class="icon-hexagon"/> | __polyline__ tool | draws a straight-sided polygon, _adjustable_ points
 <span class="icon-pen"/>| __path__ tool | draws bezier curves and straight lines, both vertices and control points are _adjustable_

For the adjustable tools, a few more buttons/commands are present for saving, cancelling, and undoing points:
Icon   | Tool | Description
-------|------|-------------------
<span class="icon-cross"/>  | __cancel__ | undoes the current drawn object and resets
<span class="icon-checkmark"/> | __save__ | saves what's drawn with the current tool
<span class="icon-minus"/> | __undo point__ | removes the last point when using the path or polyline tool


 ## Color

 Icon   | Tool | Description
 -------|------|-------------------
 <span class="icon-fill"/>| set fill color | color palette chooses fill color
 <span class="icon-stroke"/>| set stroke color | color palette chooses stroke color
 <span class="icon-no-stroke"> <span class="path1"></span><span class="path2"></span></span>| no stroke | sets stroke color to fully transparent
 <span class="icon-no-fill"> <span class="path1"></span><span class="path2"></span></span>| no fill | sets fill color to fully transparent

Color can be set by clicking within the saturation panel, the hue slider, and the transparency slider - alternatively, specific colors can be entered in Hex, RGBA, or HSLA color spaces.

## Line Styling

Line width can be set, as well as the line-cap -- the shape at the end of the line, noticeable for thicker lines, and the line-join, which dictates how two line segments are connected together - round, beveled, or in a pointy "miter".

Icon   | Description
-------|-------------------------
<span class="icon-linecap-butt"/><span class="icon-linecap-round"/><span class="icon-linecap-square"/> | set line cap to butt, round, or square style
<span class="icon-linejoin-round"/><span class="icon-linejoin-bevel"/><span class="icon-linejoin-miter"/> | set line joins to round, beveled, or mitered

For the miter join, a "miter limit" is set, which cuts off how far the pointy bits can go for lines joining at very narrow angles.

## Symmetries

The heart of this program.  You can choose to go with no symmetry like a howling animal from the dens of unthinking chaos.  You can get your feet wet with a "rosette" or [Point Group][1] that makes little flower- or mandala- like patterns about a single point.  The adjustable __Nrot__ and __Nref__ parameters specify the number of rotations or reflections, respectively.

Also on the menu today are the 17 classic [Wallpaper Groups][2] that are the only _perfectly regular_ way to build a repeating pattern in 2 dimensions.

These can be characterized by what _kinds_ of symmetries they have.

You've heard of rotations and reflections.  The only symmetry you may not have heard of is a "glide reflection" - where you move along an a line a given distance and _then_ reflect across it.

__Rotation Free Patterns__
&nbsp;| &nbsp;
----------------|--------------
__p1__  | strict translational symmetry - no rotations, reflections, or glides.  There are 3 versions with different lattices: square, <i>diag</i>onal and <i>hex</i>agonal
__pm__  | no rotational symmetry - it has reflection axes, all of which are parallel to one-another
__cm__  | reflection axes are parallel to each other, and an independent glide axis lies in-between each of these axes, think offset rows
__pg__  | herringbone pattern as the classic example


__180&deg; Containing Patterns__
&nbsp;| &nbsp;
-------------------------------|--------
__pmg__ | two 180&deg; rotations, and reflections in only one direction - glide reflections perpendicular to reflection axis
__pgg__ | two glide reflection axes perpendicular to each other, and two 180&deg; rotation centers not sitting on either axis
__pmm__ | reflections in two perpendicular directions, and four 180&deg; rotation centres at the intersections of the reflection axes
__p2__  | the group p2 contains four rotation centres of 180&deg; rotational symmetry, but no reflections or glide reflections.
__cmm__ | the symmetry of brick walls

__Square Symmetric Patterns__
&nbsp;| &nbsp;
-------------------------------|--------
__p4__  | two 90&deg; rotation centres, and one 180&deg; rotation no reflections or glide reflections.
__p4g__ | symmetry of fly screens
__p4m__ | checkerboard symmetry

__Hexagonally Symmetric Patterns__
&nbsp;| &nbsp;
-------------------------------|--------
__p3__  | beautiful 120&deg; symmetry
__p6__  | really beautiful 60&deg; symmetry
__p31m__ | even more astounding, seriously go check out [wikipedia][2] to see pictures, or play with it yourself here.
__p3m1__ | dammmnnn, son!
__p6m__  | woah... ultimate, mystical pinnacle of perfect 2d symmetry, commonly seen in persian art, this is the default one set at the beginning

There are other ways of "almost" symmetrically tiling the plane in ["aperiodic" tilings][3], these were first discovered by pattern-makers in the islamic world centuries ago, but were re-discovered in the west by mathematicians only this century.  They're very cool, but eschersketch can't yet automatically make these patterns -- yet -- maybe one day!

## Grid Adjustment

The __grid adjustment__ tool allows to you move the "center" of the point-symmetry or wallpaper symmetry as well as scale the grid-spacing used in wallpaper symmetries.  You can also manually set the __X__, __Y__ center position or the grid spacing __Δ__.  Most commonly, one wants a grid-spacing exactly __½__ or __2x__ the current one - buttons are provided to do just that.

## Exporting and Saving Files

* __PNG__ Save the visible frame as a PNG file for use directly.  Pretty simple.

* __PNG Tile__ This is very useful: a symmetric wallpaper pattern can be described by a small tile, and used in tools such as Photoshop's "pattern fill", used to generate textures for 3d-graphics, or even more interesting, uploaded to sites such as [Spoonflower][spoon] to be turned into custom wrapping-paper, fabric textiles, or the eponymous Wallpaper!  When exported as a tile, eschersketch upsamples the pixel density by a factor of 4x (or 2x more than a retina screen), so as to provide enough DPI for decent prints.

* __SVG__ Saves all drawn objects into an SVG file for use in a proper vector graphics tool for creating nice designs.  __Warning:__ given the huge numbers of replicates in a complicated scene with a fine grid, this could grind to a halt or fail altogether if there's too much being exported on too fine a grid size.  This is fairly primitive, exporting everything into a big group, so you may want to export different features separately to build up clean layers in Illustrator, etc.

<span style="color:#f00"><b>Experimental / Unstable</b></span>

* __SAVE JSON__  This exports eschersketch's raw scene description to a JSON file.

* __LOAD JSON__ This loads a file saved by the above and reconstructs the exact image produced previously.

Because these serialize straight from Eschersketch's internal representation, these formats are __not__ stable, and could change dramatically while as Eschersketch is developed in the online version.  Save in SVG for a more durable format, unless you want to download and run the Eschersketch codebase itself.

<slot name="footer"></slot>

[1]: https://en.wikipedia.org/wiki/Point_group
[2]: https://en.wikipedia.org/wiki/Wallpaper_group
[3]: https://en.wikipedia.org/wiki/Aperiodic_tiling
[spoonup]: https://www.spoonflower.com/designs/new
[designa]: https://www.amazon.com/Designa-Wooden-Books/dp/1620406594
