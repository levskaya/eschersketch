Eschersketch
===========

This is a project built to experiment with pattern design in the classical [wallpaper groups][1]. 
It allows one to prototype tiling designs in HTML5 Canvas.

Designers should be sure to check out the illustrator template package from [madpattern][3].

This is currently a bare bones alpha version that allows one to paint in any of the 17 wallpaper groups. 
It's been rewritten in ES6 Javascript and a few bugs with Safari were fixed.

The most generally useful part of the codebase is in geo.js, which contains relatively clear code 
for building the closed sets of affine transforms from smaller sets of group generators needed to 
impose symmetry.

### Future
- Draw smooth, interpolated lines
- Allow layout of straight lines, curves
- Add reflection/rotation rosettes to the UI
- undo/redo stack, or possibly use a scenegraph backend if there's one that's fast enough
- add spherical and hyperbolic representations?

[1]: http://en.wikipedia.org/wiki/Wallpaper_group
[3]: http://www.madpattern.com/
