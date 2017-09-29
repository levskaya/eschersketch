<template>
  <div id="styleUI" :style="panelStyle">
    <span class="UIheader">line</span><br>

    <es-slider param="linewidth" label="width"
               :val="ctxStyle.lineWidth"
               :min="options.minLineWidth"
               :max="options.maxLineWidth"
               :step="options.deltaLineWidth"
               @numchange="changeThick"></es-slider>

    <es-button name="normal" :selected="ctxStyle.drawOrder" @bclick="changeOrder" hint="mix strokes and fills">
     <span class="icon-draworder-normal"/>
    </es-button>
    <es-button name="fillstroke" :selected="ctxStyle.drawOrder" @bclick="changeOrder" hint="all fills then all strokes">
     <span class="icon-draworder-fillstroke"/>
    </es-button>
    <es-button name="strokefill" :selected="ctxStyle.drawOrder" @bclick="changeOrder" hint="all strokes then all fills">
     <span class="icon-draworder-strokefill"/>
   </es-button>&nbsp;

    <es-button name="butt" :selected="ctxStyle.lineCap" @bclick="changeCap" hint="butt line cap">
      <span class="icon-linecap-butt"/>
    </es-button>
    <es-button name="round" :selected="ctxStyle.lineCap" @bclick="changeCap" hint="round line cap">
      <span class="icon-linecap-round"/>
    </es-button>
    <es-button name="square" :selected="ctxStyle.lineCap" @bclick="changeCap" hint="square line cap">
      <span class="icon-linecap-square"/>
    </es-button>&nbsp;

    <es-button name="round" :selected="ctxStyle.lineJoin" @bclick="changeJoin" hint="line corners rounded">
      <span class="icon-linejoin-round"/>
    </es-button>
    <es-button name="bevel" :selected="ctxStyle.lineJoin" @bclick="changeJoin" hint="line corners beveled">
      <span class="icon-linejoin-bevel"/>
    </es-button>
    <es-button name="miter" :selected="ctxStyle.lineJoin" @bclick="changeJoin" hint="line corners mitered">
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
    changeThick: function(name, value){gS.$emit('styleUpdate', {lineWidth: value});   },
    changeCap:   function(capName){    gS.$emit('styleUpdate', {lineCap: capName});   },
    changeJoin:  function(joinName){   gS.$emit('styleUpdate', {lineJoin: joinName}); },
    changeMiter: function(name, val){  gS.$emit('styleUpdate', {miterLimit: val});    },
    changeOrder: function(orderName){  gS.$emit('styleUpdate', {drawOrder: orderName});     },
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
