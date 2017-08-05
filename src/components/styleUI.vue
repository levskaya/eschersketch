<template>
  <div id="styleUI" :style="panelStyle">

    <span style="font-variant: small-caps;">line</span><br>
    width <input type="range" :value="ctxStyle.lineWidth"
           :min="min" :max="max" :step="step" :name="name" @change="changethick">
    <span>{{roundedLineWidth}}</span> <br>

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
import {gS, gCONSTS} from '../main.js';
import es_numfield from './es_numfield';
import es_button from './es_button';

export default {
  //props: ['lineWidth', 'miterLimit', 'lineCap', 'lineJoin'],
  props: ['ctxStyle', 'params'],
  //data: function() {  return {linecap: "butt" }; },
  components: {
        'es-numfield': es_numfield,
        'es-button': es_button,
  },
  created: function(){
    this.max = gCONSTS.MAX_LINEWIDTH;
    this.min = gCONSTS.MIN_LINEWIDTH;
    this.step = gCONSTS.DELTA_LINEWIDTH;
    this.name = "styleUI";
  },
  computed: {
    //deal with weird roundtrip floating point offset by rounding down
    roundedLineWidth: function(){
      return Math.round(this.ctxStyle.lineWidth*100)/100;
    },
    panelStyle: function() {
      return {display: this.params.showLine ? "block" : "none"};
    }
  },
  methods: {
    changethick: function({type, target}){
      gS.$emit('styleUpdate', {lineWidth: target.value});
    },
    changeCap:  function(capName){ gS.$emit('styleUpdate', {"lineCap": capName}); },
    changeJoin: function(joinName){ gS.$emit('styleUpdate', {"lineJoin": joinName}); },
    changeMiter: function(name, val){ gS.$emit('styleUpdate', {miterLimit: val}); }
  }
}
</script>

<style scoped>

input {
    vertical-align:text-top;
}

/* ------------- input range slider ------------- */
/* http://www.cssportal.com/style-input-range/    */
input[type=range] {
  height: 19px;
  -webkit-appearance: none;
  margin: 0px 0;
  width: 150px;
  background-color: rgba(0,0,0,0.0);
}
input[type=range]:focus {
  outline: none;
}
input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 5px;
  cursor: pointer;
  animate: 0.2s;
  box-shadow: 0px 0px 0px #000000;
  background: #E3BCA6;
  border-radius: 1px;
  border: 0px solid #000000;
}
input[type=range]::-webkit-slider-thumb {
  box-shadow: 0px 0px 0px #000000;
  border: 1px solid #9E4436;
  height: 12px;
  width: 18px;
  border-radius: 25px;
  background: #FF6666;
  cursor: pointer;
  -webkit-appearance: none;
  margin-top: -4px;
}
input[type=range]:focus::-webkit-slider-runnable-track {
  background: #E3BCA6;
}
input[type=range]::-moz-range-track {
  width: 100%;
  height: 5px;
  cursor: pointer;
  animate: 0.2s;
  box-shadow: 0px 0px 0px #000000;
  background: #E3BCA6;
  border-radius: 1px;
  border: 0px solid #000000;
}
input[type=range]::-moz-range-thumb {
  box-shadow: 0px 0px 0px #000000;
  border: 1px solid #9E4436;
  height: 12px;
  width: 18px;
  border-radius: 25px;
  background: #FF6666;
  cursor: pointer;
}
input[type=range]::-ms-track {
  width: 100%;
  height: 5px;
  cursor: pointer;
  animate: 0.2s;
  background: transparent;
  border-color: transparent;
  color: transparent;
}
input[type=range]::-ms-fill-lower {
  background: #E3BCA6;
  border: 0px solid #000000;
  border-radius: 2px;
  box-shadow: 0px 0px 0px #000000;
}
input[type=range]::-ms-fill-upper {
  background: #E3BCA6;
  border: 0px solid #000000;
  border-radius: 2px;
  box-shadow: 0px 0px 0px #000000;
}
input[type=range]::-ms-thumb {
  margin-top: 1px;
  box-shadow: 0px 0px 0px #000000;
  border: 1px solid #9E4436;
  height: 12px;
  width: 18px;
  border-radius: 25px;
  background: #FF6666;
  cursor: pointer;
}
input[type=range]:focus::-ms-fill-lower {
  background: #E3BCA6;
}
input[type=range]:focus::-ms-fill-upper {
  background: #E3BCA6;
}

/* --- select styling ----------- */
select{
    display:inline-block;
    vertical-align:middle;
    background: transparent;
}
</style>
