<template>
  <div>
    <!-- buttons to select which color to pick -->
    <div class="button" :class="{selected: isStroke}" @mousedown="pickStroke">
      stroke
    </div>
    <div class="button" :class="{selected: !isStroke}" @mousedown="pickFill">
      fill
    </div>
    <!-- color pickers -->
    <div id="strokecolor" :style="{display: isStroke ? 'block' : 'none' }">
      <color-picker target="stroke"
                    :r="strokeColor.r"
                    :g="strokeColor.g"
                    :b="strokeColor.b"
                    :a="strokeColor.a"/>
    </div>
    <div id="fillcolor" :style="{display: isStroke ? 'none' : 'block' }">
      <color-picker target="fill"
                    :r="fillColor.r"
                    :g="fillColor.g"
                    :b="fillColor.b"
                    :a="fillColor.a"/>
    </div>
  </div>
</template>
<script>
import {gS} from '../main.js';
import colorPicker from './colorPicker';
export default {
  props: ['strokeColor', 'fillColor'],
  data: function() {return {isStroke: true}; },
  components: {colorPicker},
  methods: {
    pickStroke: function({type, target}){ this.isStroke = true;  },
    pickFill:   function({type, target}){ this.isStroke = false; }
  },
}
</script>
<style scoped>
/*.button {
    border:1px solid #ddd;
    text-indent:0px;
    background: #eeeeee;
    text-align: center;
    font-variant: small-caps;
    border-radius: 2px;
    margin: 2px;
    padding: 3px;
    display: inline-block;
    cursor:pointer;
    color:#666;
}
.selected {
    background: rgba(250,150,150,0.6);
}*/
/* these don't work on dynamically updated classes it seems!
   have to modify style directly via :style bindings
.hideme { display: none;}
.showme { display: block;}
*/
</style>
