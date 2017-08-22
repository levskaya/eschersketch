<template>
  <div id="styleUI" :style="panelStyle">
    <span class="UIheader">line</span><br>

    <es-slider param="linewidth" label="width"
               :val="ctxStyle.lineWidth"
               :min="options.minLineWidth"
               :max="options.maxLineWidth"
               :step="options.deltaLineWidth"
               @numchange="changethick"></es-slider>

    <es-button name="butt" :selected="ctxStyle.lineCap" @bclick="changeCap">
      <span class="icon-linecap-butt"/>
    </es-button>
    <es-button name="round" :selected="ctxStyle.lineCap" @bclick="changeCap">
      <span class="icon-linecap-round"/>
    </es-button>
    <es-button name="square" :selected="ctxStyle.lineCap" @bclick="changeCap">
      <span class="icon-linecap-square"/>
    </es-button>

    <es-button name="round" :selected="ctxStyle.lineJoin" @bclick="changeJoin">
      <span class="icon-linejoin-round"/>
    </es-button>
    <es-button name="bevel" :selected="ctxStyle.lineJoin" @bclick="changeJoin">
      <span class="icon-linejoin-bevel"/>
    </es-button>
    <es-button name="miter" :selected="ctxStyle.lineJoin" @bclick="changeJoin">
      <span class="icon-linejoin-miter"/>
    </es-button>

    <template v-if="ctxStyle.lineJoin=='miter'">
      <es-numfield param="miterLimit" label="limit" :val="ctxStyle.miterLimit" size="3"
                  @numchange="changeMiter"></es-numfield>
    </template>
  </div>
</template>

<script>
import {gS} from '../main.js';
import esNumfield from './es_numfield';
import esButton from './es_button';
import esSlider from './es_slider';

export default {
  props: ['ctxStyle', 'params', 'options'],
  components: {esNumfield, esButton, esSlider},
  created: function(){
    this.name = "styleUI";
  },
  computed: {
    //deal with weird roundtrip floating point offset by rounding down
    //roundedLineWidth: function(){
    //  return Math.round(this.ctxStyle.lineWidth*100)/100;
    //},
    panelStyle: function() {
      return {display: this.params.showLine ? "block" : "none"};
    }
  },
  methods: {
    changethick: function(name, value){gS.$emit('styleUpdate', {lineWidth: value});   },
    changeCap:   function(capName){    gS.$emit('styleUpdate', {lineCap: capName});   },
    changeJoin:  function(joinName){   gS.$emit('styleUpdate', {lineJoin: joinName}); },
    changeMiter: function(name, val){  gS.$emit('styleUpdate', {miterLimit: val});    }
  }
}
</script>

<style scoped>
input {
    vertical-align:text-top;
}
/* --- select styling ----------- */
select{
    display:inline-block;
    vertical-align:middle;
    background: transparent;
}
</style>
