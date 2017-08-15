<template>
  <div id="colorUI" :style="panelStyle">
    <span class="UIheader">color</span><br>

    <!-- buttons to select which color to pick -->
    <div class="button" :class="{selected: isStroke}" @mousedown="pickStroke">
      <span class="icon-stroke"></span>

    </div>
    <div class="button" :class="{selected: !isStroke}" @mousedown="pickFill">
      <span class="icon-fill"></span>
    </div>
    <div class="button" @mousedown="nukeStroke">
      <span class="icon-no-stroke">
        <span class="path1"></span><span class="path2"></span>
      </span>
    </div>
    <div class="button" @mousedown="nukeFill">
      <span class="icon-no-fill">
        <span class="path1"></span><span class="path2"></span>
      </span>
    </div>

    <!-- color pickers -->
    <div id="strokecolor" :style="{display: isStroke ? 'block' : 'none' }">
      <color-picker target="stroke"
                    :r="strokeColor.r"
                    :g="strokeColor.g"
                    :b="strokeColor.b"
                    :a="strokeColor.a"
                    :fullUI = "params.showColorInputs"/>
    </div>
    <div id="fillcolor" :style="{display: isStroke ? 'none' : 'block' }">
      <color-picker target="fill"
                    :r="fillColor.r"
                    :g="fillColor.g"
                    :b="fillColor.b"
                    :a="fillColor.a"
                    :fullUI = "params.showColorInputs"/>
    </div>
  </div>
</template>
<script>
import {gS} from '../main.js';
import colorPicker from './colorPicker';

export default {
  components: {colorPicker},
  props: ['params', 'strokeColor', 'fillColor'],
  data: function() {return {isStroke: true}; },
  computed: {
    panelStyle: function() {
      return {display: this.params.showColor ? "block" : "none"};
    }
  },
  methods: {
    pickStroke: function({type, target}){ this.isStroke = true;  },
    pickFill:   function({type, target}){ this.isStroke = false; },
    nukeStroke: function(x){ gS.$emit('colorUpdate', {target: "stroke", r:0, g:0, b:0, a:0.0}); },
    nukeFill:   function(x){ gS.$emit('colorUpdate', {target: "fill",   r:0, g:0, b:0, a:0.0}); }
  },
}
</script>
<style scoped>
</style>
