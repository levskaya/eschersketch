# Eschersketch Development Notes

Built with ES6, webpack, babel, [Vue][vue] 2.0.
Project Structure derives from the vuejs es6 webpack template. ([repo][tmplrepo], [docs][tmpldocs])

Currently Vue handles all DOM-related UI elements, it does not however
handle the canvas drawing and state management, as that's not really
what it's built to do.  I may consider making canvas management a bit
more Vue-ish to exploit its reactivity tools, but it's not clear.

### External Libs

- The color panel code is derived from [Vue-Color][vc], though it's been tweaked a bit to fix a touch-event handling bug and to modify style defaults.
- Canvas touch-handling is handled by [Hammer.js][hammer]
- Uses eligrey's [FileSaver.js][fs] and [canvas-toBlob.js][ctb] polyfills to support saving files.

[vue]:https://vuejs.org/
[vc]: https://github.com/xiaokaike/vue-color
[tmplrepo]:https://github.com/vuejs-templates/webpack
[tmpldocs]:https://vuejs-templates.github.io/webpack/
[hammer]: https://hammerjs.github.io/
[fs]:https://github.com/eligrey/FileSaver.js
[ctb]:https://github.com/eligrey/canvas-toBlob.js
