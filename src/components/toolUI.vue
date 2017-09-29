<template>
  <div id="toolUI" :style="panelStyle">
    <span class="UIheader">drawing</span><br>

    <es-button name="pencil" :selected="curtool" @bclick="changeTool" hint="pencil tool">
      <span class="icon-pencil"></span>
    </es-button>
    <es-button name="line"   :selected="curtool" @bclick="changeTool" hint="line tool">
      <span class="icon-line"></span>
    </es-button>
    <es-button name="polygon" :selected="curtool" @bclick="changeTool" hint="regular polygon tool">
      <span class="icon-hexagon"></span>
    </es-button>
    <es-button name="circle" :selected="curtool" @bclick="changeTool" hint="ellipse tool">
      <span class="icon-radio-unchecked"></span>
    </es-button>
    <es-button name="poly"   :selected="curtool" @bclick="changeTool" hint="polyline tool">
      <span class="icon-polyline"></span>
    </es-button>
    <es-button name="path" :selected="curtool" @bclick="changeTool" hint="bezier path tool">
      <span class="icon-pen"></span>
    </es-button>
    <!--
    <es-button name="grid"   :selected="curtool" @bclick="changeTool">
      grid adjust
    </es-button>
    -->
    <br>
    <template v-for="option in Object.keys(toolOptions)">
      <template v-if="toolOptions[option].type=='boolean'">
        <es-checkbox :param="option"
                     :val="toolOptions[option].val"
                     @checked="toolOptionUpdate"></es-checkbox>
      </template>
      <template v-else-if="toolOptions[option].type=='slider'">
        <es-slider :param="option" :key="option"
                   :val="toolOptions[option].val"
                   :min="toolOptions[option].min"
                   :max="toolOptions[option].max"
                   :step="toolOptions[option].step"
                   @numchange="toolOptionUpdate"></es-slider>
      </template>
      <template v-else>
        <es-numfield :param="option"
                     :val="toolOptions[option].val"
                     @numchange="toolOptionUpdate"
                     size="2"></es-numfield>
      </template>
    </template>

  </div>
</template>

<script>
import esCheckbox from './es_checkbox';
import esNumfield from './es_numfield';
import esSlider from './es_slider';
import esButton from './es_button';
import {gS, drawTools} from '../main.js';

export default {
  props: ['params'],
  components: {esButton, esNumfield, esSlider, esCheckbox},
  computed:{
    curtool: function(){ return this.params.curTool; },
    panelStyle: function() {
      return {display: this.params.showTool ? "block" : "none"};
    },
    toolOptions: function() {
      if(drawTools[gS.params.curTool].hasOwnProperty("options")){
        return drawTools[gS.params.curTool].options;
      }
      else {
        return {};
      }
    }
  },
  methods: {
    changeTool: function(toolName){
      gS.$emit('toolUpdate', toolName);
    },
    toolOptionUpdate: function(name, value){
      gS.$emit('toolOptionUpdate', name, value);
    }
  },
}
</script>
<style scoped>
</style>
