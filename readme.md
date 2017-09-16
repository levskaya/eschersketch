Eschersketch
===========

This is a program built to experiment with pattern design in the classical [wallpaper groups][1] and rosette
[point groups][2].  It allows the user to draw and layout repeating patterns in real-time.

This version has been completely overhauled from an earlier simplistic prototype.  It works reasonably well
with mobile and desktop browsers.  Undo/Redo and a basic set of vector graphic primitives are now supported.

It features PNG and SVG export.  It also exports high-res PNG "tiles" that are suitable for use with tools
like Photoshop pattern fill, graphics textures, or upload to services such as [Spoonflower][spoon] and
[Contrado][contrado] to be used in printed patterns.

### Local Install / Build Setup

Built with ES6, webpack, babel, [Vue][vue] 2.0. Project Structure derives from the vuejs es6 webpack template.
([repo][tmplrepo], [docs][tmpldocs])  Running locally requires npm and should be as easy as running the following:

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev
```

### Code Comments

Currently Vue handles all DOM-related UI elements, it does not however handle the canvas drawing and state
management, as that's not really what it's built to do.  I may consider making canvas management a bit more
Vue-ish to exploit its reactivity tools, but will likely separately organize, simplify and generalize drawing
state management.

Almost all actions are routed through a simple global state store and event bus, it has not yet been ported into
Vuex but this would not be difficult.

### External Libs

- The color panel code is derived from [Vue-Color][vc]. It's been tweaked to fix a touch-event handling bug and to
  modify style defaults.
- Canvas touch-handling is handled by [Hammer.js][hammer]
- Uses eligrey's [FileSaver.js][fs] and [canvas-toBlob.js][ctb] polyfills to support saving files.
- Uses a modified [canvas2svg][c2s] to export to SVG.
- Also using vue-markdown-loader for handling inline written content.

### Bugs

Some older-but-recent versions of iOS on ipads insist on scrolling the main canvas instead of drawing despite all JS
and CSS settings to the contrary - I've only seen this on one device that was readily fixed by an OS upgrade, so I
have no idea if this is a reproducible bug.

[1]: http://en.wikipedia.org/wiki/Wallpaper_group
[2]: https://en.wikipedia.org/wiki/Point_group
[spoon]: https://www.spoonflower.com/designs/new
[contrado]: https://www.contrado.com/
[vue]:https://vuejs.org/
[vc]: https://github.com/xiaokaike/vue-color
[tmplrepo]:https://github.com/vuejs-templates/webpack
[tmpldocs]:https://vuejs-templates.github.io/webpack/
[hammer]: https://hammerjs.github.io/
[fs]:https://github.com/eligrey/FileSaver.js
[ctb]:https://github.com/eligrey/canvas-toBlob.js
[c2s]: https://github.com/gliffy/canvas2svg
