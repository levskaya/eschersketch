<template>
  <div class="pickerwrap">
    <chrome-picker :value="colors" @input="onUpdate"></chrome-picker>
  </div>
</template>
<script>
//import { Chrome } from 'vue-color';
import { Chrome } from '../../static/vue-color-es.min.js';
import { _ } from 'underscore';
import {gS} from '../main.js';

// the vue-color picker only updates on hex changes...
// so have to convert rgb to hex
var rgb2hex = function(r,g,b) {
  var pad = function(n, width=2, z=0) {
    return (String(z).repeat(width) + String(n)).slice(String(n).length);
  };
  var hexr = pad(parseInt(r,10).toString(16).slice(-2));
  var hexg = pad(parseInt(g,10).toString(16).slice(-2));
  var hexb = pad(parseInt(b,10).toString(16).slice(-2));
  return '#'+hexr+hexg+hexb;
};

export default {
  props: ['target','r','g','b','a'],
  computed: {
    colors: function(){
      let newColor = {
        hex: rgb2hex(this.r,this.g,this.b),
        a: this.a
      };
      //console.log("colorPicker ",this.target, newColor);
      return newColor;
      }
    },
  components: { 'chrome-picker': Chrome },
  methods: {
    onUpdate:
      function(x){
      gS.$emit('colorUpdate', {target:this.target,
                               r:x.rgba.r, g:x.rgba.g, b:x.rgba.b, a:x.rgba.a});
    }
  },
}
</script>
<style>
</style>
