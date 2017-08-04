<template>
  <div>
    <input type="range" :value="lineWidth"
           :min="min" :max="max" :step="step" :name="name" @change="changethick">
    <span>{{roundedLineWidth}}</span>
    <br>
    cap
    <select name="lineCap" id="lineCap" @change="changeItem($event)">
      <!--<option selected disabled>line cap</option>-->
      <option value="butt"   :selected="lineCap=='butt'">butt</option>
      <option value="round"  :selected="lineCap=='round'">round</option>
      <option value="square" :selected="lineCap=='square'">square</option>
    </select>
    join
    <select name="lineJoin" id="lineJoin" @change="changeItem($event)">
      <option value="round" :selected="lineJoin=='round'">round</option>
      <option value="bevel" :selected="lineJoin=='bevel'">bevel</option>
      <option value="miter" :selected="lineJoin=='miter'">miter</option>
    </select>

    <template v-if="lineJoin=='miter'">
      <es-numfield param="miterLimit" label="limit" :val="miterLimit" size="3"
                  @numchange="changeMiter"></es-numfield>
    </template>

  </div>
</template>

<script>
import {gS, gCONSTS} from '../main.js';
import es_numfield from './es_numfield';

export default {
  props: ['lineWidth', 'miterLimit', 'lineCap', 'lineJoin'],
  components: {
        'es-numfield': es_numfield
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
      return Math.round(this.lineWidth*100)/100;
    }
  },
  methods: {
    changethick: function({type, target}){
      //console.log(target.value);
      gS.$emit('styleUpdate', {lineWidth: target.value});
    },
    changeItem(e) {
      //console.log(e.target.name, e.target.value);
      gS.$emit('styleUpdate', {[e.target.name]: e.target.value});
    },
    changeMiter: function(name, val){
      //console.log(name, val);
      gS.$emit('styleUpdate', {miterLimit: val});
    }
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
  margin: 10px 0;
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
