<template>
  <div>
    <input type="range" :value="lineWidth"
           :min="min" :max="max" :step="step" :name="name" @change="changethick">
    <span>{{lineWidth}}</span>
  </div>
</template>
<script>
//import es_numfield from './es_numfield';
//import {_} from 'underscore';
import {gS} from '../main.js';

const MIN_LINEWIDTH = 0.1;
const MAX_LINEWIDTH = 10;
const DELTA_LINEWIDTH = 0.1;

export default {
  props: ['lineWidth'],
  created: function(){
    this.max = MAX_LINEWIDTH;
    this.min = MIN_LINEWIDTH;
    this.step = DELTA_LINEWIDTH;
    this.name = "thicknessUI";
  },
  methods: {
    changethick: function({type, target}){
      //gS.cmdstack.push(new StyleOp({lineWidth: target.value}));
      //rerender(ctx);
      gS.$emit('styleUpdate', {lineWidth: target.value});
    }
  }
  }
</script>
<style scoped>
input {
    vertical-align:text-top;
}
</style>
