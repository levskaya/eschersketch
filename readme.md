Eschersketch
===========

This is a project built to experiment with pattern design in the classical [wallpaper groups][1]. It allows one to prototype tiling designs in HTML5 Canvas.

This is currently a bare bones alpha version that allows one to paint in any of the 17 wallpaper groups.

It is written in coffeescript.  The most generally useful part of the codebase is in geo.coffee, which contains relatively clear code for building the closed sets of affine transforms from smaller sets of group generators needed to impose symmetry.

Designers should be sure to check out the illustrator template package from [madpattern][3].

### Future
- figure out a client-side way to save images that doesn't crash safari (though this looks like a safari native code bug)
- Add reflection/rotation rosettes to the UI
- undo/redo stack
- possibly switch backend to [paper.js][2], should it prove performant enough
- add spherical and hyperbolic representations

[1]: http://en.wikipedia.org/wiki/Wallpaper_group
[2]: http://paperjs.org/
[3]: http://www.madpattern.com/
