<template>
  <div>
    <input type="range" :value="lineWidth"
           :min="min" :max="max" :step="step" :name="name" @change="changethick">
    <span>{{lineWidth}}</span>
  </div>
</template>
<script>
import {gS, gConstants} from '../main.js';

export default {
  props: ['lineWidth'],
  created: function(){
    this.max = gConstants.MAX_LINEWIDTH;
    this.min = gConstants.MIN_LINEWIDTH;
    this.step = gConstants.DELTA_LINEWIDTH;
    this.name = "styleUI";
  },
  methods: {
    changethick: function({type, target}){
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
