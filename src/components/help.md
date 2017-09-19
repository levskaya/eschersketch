<slot name="header"></slot>

## What is this?

An imperfect tool for drawing and exploring symmetrical patterns and designs.  It can export pictures, pattern tiles for fabric and wallpaper design, and SVG for further editing.  You can also publish your drawings and share them on Facebook and Twitter.

## Undo / Redo

Icon   | Tool | Description
-------|------|-------------------
<span class="icon-undo"/>| undo | steps back a drawing step, re-entering interactive editing for previous draw tool
<span class="icon-redo"/>| redo | reapplies a previously undone tool - note that the redo stack is not automatically emptied
<span class="icon-bin"/>| reset | __erases everything__ - requires two clicks within 1sec to activate
<span class="icon-cog"/>| settings | expert mode options and configuration parameters for eschersketch
<span class="icon-question-circle"></span>| this help | leads you to the truth

 ## Drawing Tools

 Icon   | Tool | Description
 -------|------|-------------------
 <span class="icon-pencil"/>  | __pencil__ tool | freehand drawing tool, stroke-only, variable smoothing factor
 <span class="icon-line"/> | __line__ tool | draws single line segments between two _adjustable_ points
 <span class="icon-hexagon"/>| __polygon__ tool | draws a straight-sided __regular__ polygon _or_ star, _adjustable_ points
 <span class="icon-radio-unchecked"/> | __circle__ tool | draws circles, ellipses, and arcs,  from three _adjustable_ points
 <span class="icon-polyline"/> | __polyline__ tool | draws a straight-sided freehand polygon, _adjustable_ points
 <span class="icon-pen"/>| __path__ tool | draws bezier curves and straight lines, both vertices and control points are _adjustable_

For the adjustable tools, a few more buttons/commands are present for saving, cancelling, and undoing points:
Icon   | Tool | Description
-------|------|-------------------
<span class="icon-cross"/>  | __cancel__ | undoes the current drawn object and resets
<span class="icon-checkmark"/> | __save__ | saves what's drawn with the current tool
<span class="icon-minus"/> | __undo point__ | removes the last point when using the path or polyline tool
<span class="icon-stroke"/> | __close path__ | for polyline and path tool, closes path
<span class="icon-radio-unchecked"/> | __smooth close__ | for path tool, closes path smoothly at beginning/end

Additional options controlling the tool are displayed upon selection.

 ## Color

 Icon   | Tool | Description
 -------|------|-------------------
 <span class="icon-fill"/>| set fill color | color palette chooses fill color
 <span class="icon-stroke"/>| set stroke color | color palette chooses stroke color
 <span class="icon-no-stroke"> <span class="path1"></span><span class="path2"></span></span>| no stroke | sets stroke color to fully transparent
 <span class="icon-no-fill"> <span class="path1"></span><span class="path2"></span></span>| no fill | sets fill color to fully transparent

Color can be set by clicking within the saturation panel, the hue slider, and the transparency slider.

## Line Styling

Line width can be set, as well as the line-cap -- the shape at the end of the line, noticeable for thicker lines, and the line-join, which dictates how two line segments are connected together - round, beveled, or in a pointy "miter".

Icon   | Description
-------|-------------------------
<span class="icon-linecap-butt"/><span class="icon-linecap-round"/><span class="icon-linecap-square"/> | set line cap to butt, round, or square style
<span class="icon-linejoin-round"/><span class="icon-linejoin-bevel"/><span class="icon-linejoin-miter"/> | set line joins to round, beveled, or mitered
<span class="icon-draworder-normal"/> <span style="visibility:hidden"></span> <span class="icon-draworder-fillstroke"/> <span style="visibility:hidden"></span> <span class="icon-draworder-strokefill"/> | draw stroke and fill simultaneously, or draw fills _then_ strokes, or vice versa

For the miter join, a "miter limit" is set, which cuts off how far the pointy bits can go for lines joining at very narrow angles.

## Symmetries

The heart of this program.  You can choose to draw with no symmetry.  You can draw with a "rosette" or [Point Group][1] that makes little flower- or mandala- like patterns about a single point.  The parameters __Nrot__ and __Nref__ control the number of rotations and reflections.

You can draw with one of the 17 classic [Wallpaper Groups][2] that are the only _perfectly regular_ way to build a repeating pattern in 2 dimensions.

Follow that Wikipedia link to see examples and explanations of these 17 basic patterns, or just play around with them here.  These patterns are  traditionally grouped according to the amount of rotational symmetry they have:

__Rotation Free Patterns__ : p1, pm, cm, pg
__180&deg; Containing Patterns__ : pmg, pgg, pmm, p2, cmm
__Square Symmetric Patterns__ : p4, p4g, p4m
__Hexagonally Symmetric Patterns__ : p3, p6, p31m, p3m1, p6m

## Grid Adjustment

The __grid adjustment__ tool allows to you move the "center" of the point-symmetry or wallpaper symmetry as well as scale the grid-spacing used in wallpaper symmetries.  You can also manually set the __X__, __Y__ center position or the grid spacing __Δ__.  Most commonly, one wants a grid-spacing exactly __½__ or __2x__ the current one - buttons are provided to do just that.

## Exporting and Saving Files

* __PNG__ Save the visible frame as a PNG file for use directly.

* __PNG Tile__ This is very useful: a symmetric wallpaper pattern can be described by a small tile, and used in tools such as Photoshop's "pattern fill", used to generate textures for 3d-graphics, or uploaded to sites such as [Spoonflower][spoon] to be turned into custom wrapping-paper, fabric textiles, or wallpaper!  When exported as a tile, eschersketch upsamples the pixel density by a factor of 4x, so as to provide enough DPI for decent prints.

* __SVG__ Saves all drawn objects into an SVG file for use in a proper vector graphics tool for creating nice designs.  __Warning:__ given the huge numbers of replicates in a complicated scene with a fine grid, this could grind to a halt or fail altogether if there's too much being exported on too fine a grid size.  This is fairly primitive, exporting everything into a big group, so you may want to export different features separately to build up clean layers in Illustrator, etc.

## Sharing Links to your Drawing

* __Make Shareable Links__ will save a copy of your drawing online that you can link to in one of three ways:


## Further Reading

I highly recommend the compilation [Designa][designa] from Wooden Books, especially it's chapter by Daud Sutton on Islamic Design.

## Source

The source code for Eschersketch is available on [github][gh].

## Contact

Questions and comments can be directed to [info@eschersket.ch][mail] or twitter [@eschersketch][twit].

<slot name="footer"></slot>

[1]: https://en.wikipedia.org/wiki/Point_group
[2]: https://en.wikipedia.org/wiki/Wallpaper_group
[3]: https://en.wikipedia.org/wiki/Aperiodic_tiling
[spoon]: https://www.spoonflower.com/designs/new
[designa]: https://www.amazon.com/Designa-Wooden-Books/dp/1620406594
[gh]: https://github.com/levskaya/eschersketch
[mail]: mailto:info@eschersket.ch
[twit]: https://twitter.com/eschersketch
