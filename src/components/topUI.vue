<template>

<span>
  <!-- GUI Element Container -->
  <div id="sketch-UI" :class="{'max-UI': params.fullUI, 'min-UI': !params.fullUI}">

    <!-- Top Level State Control -->
    <state-ui :params="params"/>

    <!-- Configuration UI -->
    <config-ui :options="options" :params="params"/>

    <!-- Tool Selection -->
    <tool-ui :params="params"/>
    <nav-panel :params="params"/>

    <!-- Color UI -->
    <color-ui :params="params" :stroke-color="strokeColor" :fill-color="fillColor"/>

    <!-- Line Style UI -->
    <style-ui :ctx-style="ctxStyle" :params="params" :options="options"/>

    <!-- Symmetry and Grid Selection -->
    <symmetry-ui :symm-state="symmState" :params="params" :options="options"/>

    <!-- Loading and Saving -->
    <file-ui :params="params"/>

    <!-- Footnote -->
    <div :style="{display: params.fullUI ? 'block' : 'none'}">
      <br>
      <div style="font-size:10px;color:#888888;text-align:left;">Anselm Levskaya &copy; 2017</div>
    </div>

  </div><!-- /sketch-UI -->

  <help-panel :params="params"/>
  <hint-panel :params="params"/>
</span>

</template>

<script>
import {gS} from '../main.js';
import {parseColor} from '../canvas_utils';

import stateUi from './stateUI';
import hintPanel from './hintPanel';
import configUi from './configUI';
import helpPanel from './helpPanel';
import toolUi from './toolUI';
import navPanel from './navPanel';
import symmetryUi from './symmetryUI';
import styleUi from './styleUI';
import colorUi from './colorUI';
import fileUi from './fileUI';

export default {
  props: ['params', 'options', 'symmState', 'ctxStyle'],
  components: {stateUi, navPanel, hintPanel, configUi, helpPanel, toolUi, symmetryUi, styleUi, colorUi, fileUi},
  computed: {
    strokeColor:
        function(){
          let tmp = [].concat(parseColor(gS.ctxStyle.strokeStyle));
          return {r:tmp[0], g:tmp[1], b:tmp[2], a:tmp[3]};
        },
    fillColor:
        function(){
          let tmp = [].concat(parseColor(gS.ctxStyle.fillStyle));
          return {r:tmp[0], g:tmp[1], b:tmp[2], a:tmp[3]};
        }
  }
}
</script>
<style scoped>
</style>
