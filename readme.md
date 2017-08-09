Eschersketch
===========

This is a program built to experiment with pattern design in the classical [wallpaper groups][1] and rosette [point
groups][2].  It allows the user to draw and layout repeating patterns in real-time.

This version has been completely overhauled.  It works reasonably well with mobile and desktop browsers.  Undo/Redo and
basic vector graphic primitives are now supported.

It features SVG export as well as PNG.  It also exports high-res PNG "tiles" that are suitable for use with tools like
Photoshop pattern fill, graphics textures, or upload to services such as [Spoonflower][spoon] to be used in printed
patterns.

## Local Install / Build Setup

Built with ES6, webpack, babel, [Vue][vue] 2.0. Project Structure derives from the vuejs es6 webpack template.
([repo][tmplrepo], [docs][tmpldocs])

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev
```

Currently Vue handles all DOM-related UI elements, it does not however handle the canvas drawing and state management,
as that's not really what it's built to do.  I may consider making canvas management a bit more Vue-ish to exploit its
reactivity tools, but it's not clear.

### External Libs

- The color panel code is derived from [Vue-Color][vc], though it's been tweaked a bit to fix a touch-event handling bug and to modify style defaults.
- Canvas touch-handling is handled by [Hammer.js][hammer]
- Uses eligrey's [FileSaver.js][fs] and [canvas-toBlob.js][ctb] polyfills to support saving files.


[1]: http://en.wikipedia.org/wiki/Wallpaper_group
[2]: https://en.wikipedia.org/wiki/Point_group
[spoon]: https://www.spoonflower.com/designs/new
[vue]:https://vuejs.org/
[vc]: https://github.com/xiaokaike/vue-color
[tmplrepo]:https://github.com/vuejs-templates/webpack
[tmpldocs]:https://vuejs-templates.github.io/webpack/
[hammer]: https://hammerjs.github.io/
[fs]:https://github.com/eligrey/FileSaver.js
[ctb]:https://github.com/eligrey/canvas-toBlob.js
