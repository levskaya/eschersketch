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

Built with modern ES modules, [Vite][vite], [esbuild][esbuild], and [Vue][vue]. Running locally requires Node.js and npm:

``` bash
# install dependencies
npm install

# start local dev server with instant HMR
npm run dev

# build optimized production bundle
npm run build

# preview production build locally
npm run preview
```

### Code Comments

Currently Vue handles all DOM-related UI elements, it does not however handle the canvas drawing and state
management, as that's not really what it's built to do.  I may consider making canvas management a bit more
Vue-ish to exploit its reactivity tools, but will likely separately organize, simplify and generalize drawing
state management.

Almost all actions are routed through a simple global state store and event bus, it has not yet been ported into
Vuex but this would not be difficult.

### External Libs/Tools

- The color panel code is derived from [Vue-Color][vc]. It's been tweaked to fix a touch-event handling bug and to
  modify style defaults.
- Canvas touch-handling is handled by [Hammer.js][hammer]
- Uses eligrey's [FileSaver.js][fs] and [canvas-toBlob.js][ctb] polyfills to support saving files.
- Uses a modified [canvas2svg][c2s] to export to SVG.
- Also using vue-markdown-loader for handling inline written content.
- [icomoon][icomoon] was used to help with icon generation.


[1]: http://en.wikipedia.org/wiki/Wallpaper_group
[2]: https://en.wikipedia.org/wiki/Point_group
[spoon]: https://www.spoonflower.com/designs/new
[contrado]: https://www.contrado.com/
[vue]: https://vuejs.org/
[vite]: https://vite.dev/
[esbuild]: https://esbuild.github.io/
[vc]: https://github.com/xiaokaike/vue-color
[hammer]: https://hammerjs.github.io/
[c2s]: https://github.com/gliffy/canvas2svg
[icomoon]: https://icomoon.io/
