<slot name="header"></slot>

## Quick Demo
<p style="text-align:center">
  <iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/iKF9nnKlxdI?rel=0" frameborder="0" allowfullscreen></iframe>
</p>

## What is this?

An imperfect tool for drawing and exploring symmetrical patterns and designs.  It can export pictures, pattern tiles for fabric and wallpaper design, and SVG for further editing.  You can also publish your drawings and share them on Facebook and Twitter, or even have them printed onto custom wrapping paper or fabrics via [Zazzle][zazzle].

#### Commands


Icon   | Tool | Description
-------|------|-------------------
<span class="icon-shrink2"></span> | __minimize__ | puts the UI into a minimal mode
<span class="icon-enlarge2"></span> | __maximize__ | restores UI to full mode
<span class="icon-undo"/>| __undo__ | steps back a drawing step to edit previous graphical element
<span class="icon-redo"/>| __redo__ | reapplies a previously undone tool
<span class="icon-bin"/>| __reset__ | _erases everything_ requires a double-click to activate
<span class="icon-cog"/>| __settings__ | expert options and configuration
<span class="icon-question-circle"></span>| __help__ | is trying it's best to be of use

#### Drawing Tools

Icon   | Tool | Description
-------|------|-------------------
<span class="icon-pencil"/>  | __pencil__  | freehand drawing tool, stroke-only, variable smoothing factor
<span class="icon-line"/> | __line__  | draws single line segments between two points
<span class="icon-hexagon"/>| __polygon__  | draws a straight-sided _regular_ polygon _or_ star
<span class="icon-radio-unchecked"/> | __circle__  | draws circles, ellipses, and arcs from three points
<span class="icon-polyline"/> | __polyline__  | draws a straight-sided freehand polygon
<span class="icon-pen"/>| __path__  | draws bezier curves and straight lines

Commands for saving, cancelling, and undoing points:

Icon   | Tool | Description
-------|------|-------------------
<span class="icon-cross"/>  | __cancel__ | undoes the current drawn object and resets
<span class="icon-checkmark"/> | __save__ | saves what's drawn with the current tool
<span class="icon-minus"/> | __undo point__ | removes the last point when using the path or polyline tool
<span class="icon-stroke"/> | __close path__ | for polyline and path tool, closes path
<span class="icon-radio-unchecked"/> | __smooth close__ | for path tool, closes path smoothly at beginning/end


#### Color and Styling

Icon   | Tool | Description
-------|------|-------------------
<span class="icon-fill"/>| set fill color | color palette chooses fill color
<span class="icon-stroke"/>| set stroke color | color palette chooses stroke color
<span class="icon-no-stroke"> <span class="path1"></span><span class="path2"></span></span>| no stroke | sets stroke color to fully transparent
<span class="icon-no-fill"> <span class="path1"></span><span class="path2"></span></span>| no fill | sets fill color to fully transparent

Color can be set by clicking within the saturation panel, the hue slider, and the transparency slider.

Icon   | Description
-------|-------------------------
<span class="icon-linecap-butt"/><span class="icon-linecap-round"/><span class="icon-linecap-square"/> | set line cap to butt, round, or square style
<span class="icon-linejoin-round"/><span class="icon-linejoin-bevel"/><span class="icon-linejoin-miter"/> | set line joins to round, beveled, or mitered
<span class="icon-draworder-normal"/> <span class="icon-draworder-fillstroke"/> <span class="icon-draworder-strokefill"/> | draw stroke and fill simultaneously, or draw fills _then_ strokes, or vice versa

#### Symmetries

The heart of this program.  You can choose to draw with no symmetry.  You can draw with a "rosette" or [Point Group][1] that makes little flower- or mandala- like patterns about a single point.  The parameters __Nrot__ and __Nref__ control the number of rotations and reflections.

You can draw with one of the 17 classic [Wallpaper Groups][2] that are the only _perfectly regular_ way to build a repeating pattern in 2 dimensions.

Follow that Wikipedia link to see examples and explanations of these 17 basic patterns, or just play around with them here.  These patterns are  traditionally grouped according to the amount of rotational symmetry they have:

__Rotation Free Patterns__ : p1, pm, cm, pg
__180&deg; Containing Patterns__ : pmg, pgg, pmm, p2, cmm
__Square Symmetric Patterns__ : p4, p4g, p4m
__Hexagonally Symmetric Patterns__ : p3, p6, p31m, p3m1, p6m

#### Grid Adjustment

The __grid adjustment__ tool allows to you move the "center" of the point-symmetry or wallpaper symmetry as well as scale the grid-spacing used in wallpaper symmetries.  Most commonly, one wants a grid-spacing exactly __½__ or __2x__ the current one - buttons are provided to do just that.

## Sharing Links to your Drawing

  Icon |  Description
-------|-------------------------
<span class="icon-cloud-upload"></span> | will save a copy of your drawing online that you can link to in one of four ways:
<span class="icon-link"></span> | copy a direct link to clipboard
<span class="icon-facebook-square"></span> <span class="icon-twitter-square"></span> <span class="icon-pinterest"></span> | post to facebook, twitter, or pinterest

## Ordering Printed Materials with Your Pattern

Clicking __Order Prints!__ will upload the current tile of a wallpaper pattern, you can then click on __Go To Zazzle__ to open a new tab to order wrapping paper, fabrics, and other textiles from [Zazzle][zazzle] with your pattern.  Currently this only works for walllpaper (i.e. tiled) patterns.  For more custom printing jobs, you can always download an SVG or PNG for use with your printing service of choice!

## Exporting and Saving Files

__Picture__ Save the visible frame as a PNG image file.

__Tile__ This is very useful: a symmetric wallpaper pattern can be described by a small tile, and used in tools such as Photoshop's "pattern fill", used to generate textures for 3d-graphics, or uploaded to sites such as [Spoonflower][spoon] or [Contrado][contrado] to be turned into custom wrapping-paper, fabric textiles, or wallpaper!  When exported as a tile, Eschersketch upsamples the pixel density by a factor of 4x, so as to provide enough DPI for decent prints.

__SVG__ Saves all drawn objects into an SVG file for use in a proper vector graphics tool.  __Warning:__ given the huge numbers of replicates in a complicated scene with a fine grid, this could grind to a halt if there's too much being exported on too fine a grid size.  Each drawing operation's replicated graphical elements are exported in their own group.

## Et Cetera

For further reading I highly recommend:
 - Check out Mahdi Bahrami's game [Engare][engare] based on motion and geometry, inspired by the Persian design tradition.
 - The compilation [Designa][designa] from Wooden Books, especially it's book by Daud Sutton on Islamic Design.
 - David Wade's [Pattern in Islamic Art][patislart]
 - Craig Kaplan's [thesis][cskthesis] and [lecture][csktalk] on the math behind some Islamic geometric patterns.
 - A [video][zillijvid] of the Moroccan Zillij tilework and other symmetric craftwork done for the Met by traditional artisans.
 - A [video][kumikovid1] showing the Japanese tradition of Kumiko Zaiku - intricate symmetric latticework.

The source code for Eschersketch is available on [github][gh].

Questions and comments can be directed to [info@eschersket.ch][mail] or twitter [@eschersketch][twit].

<slot name="footer"></slot>

[1]: https://en.wikipedia.org/wiki/Point_group
[2]: https://en.wikipedia.org/wiki/Wallpaper_group
[3]: https://en.wikipedia.org/wiki/Aperiodic_tiling
[spoon]: https://www.spoonflower.com/designs/new
[contrado]: https://www.contrado.com/
[zazzle]: https://www.zazzle.com/
[engare]: http://www.engare.design/
[designa]: https://www.amazon.com/Designa-Wooden-Books/dp/1620406594
[gh]: https://github.com/levskaya/eschersketch
[mail]: mailto:info@eschersket.ch
[twit]: https://twitter.com/eschersketch
[cskthesis]: http://www.cgl.uwaterloo.ca/csk/phd/
[csktalk]: https://www.youtube.com/watch?v=FBn6VgoF3fE
[patislart]: https://patterninislamicart.com/
[zillijvid]: https://www.youtube.com/watch?v=Og6cTlwBTrk
[kumikovid1]: https://www.youtube.com/watch?v=9REJTj9egKU
