<template>
  <div id="configUI" :style="panelStyle">
    <br><span style="font-variant: small-caps;">Options</span><br><br>

    <b>draw options</b><br>
    <es-numfield param="maxLineWidth" :val="options.maxLineWidth" size="2" @numchange="update">Max line width</es-numfield><br>

    <b>grid options</b><br>
    <es-checkbox param="dynamicGridSize" :val="options.dynamicGridSize" @checked="update">Dynamically Resize Grid?</es-checkbox><br>
    <es-numfield param="maxGridNx" :val="options.maxGridNx" size="2" @numchange="update">Max Dynamic Grid Nx</es-numfield> <i>careful</i> <br>
    <es-numfield param="maxGridNy" :val="options.maxGridNy" size="2" @numchange="update">Max Dynamic Grid Ny</es-numfield> <i>careful</i> <br>

    <b>export options</b><br>
    <es-numfield param="pngTileUpsample" :val="options.pngTileUpsample" size="1" @numchange="update">PNG Tile Upsample Factor</es-numfield><br>
    <!--<es-numfield param="pngUpSample" :val="options.pngUpsample" size="1" @numchange="update">PNG Upsample Factor</es-numfield><br>-->
    <es-numfield param="svgGridNx" :val="options.svgGridNx" size="2" @numchange="update">SVG Export Grid Nx</es-numfield> <i>careful</i> <br>
    <es-numfield param="svgGridNy" :val="options.svgGridNy" size="2" @numchange="update">SVG Export Grid Ny</es-numfield> <i>careful</i> <br>
    <br>
  </div>
</template>

<script>
import esNumfield from './es_numfield';
import esCheckbox from './es_checkbox';
import esButton from './es_button';
import {gS} from '../main.js';
import {_} from 'underscore';

export default {
  props: ['options','params'],
  components: { esButton, esNumfield, esCheckbox },
  computed: {
    //curtool: function(){ return this.params.curTool; },
    panelStyle: function() {
      return {display: this.params.showConfig ? "block" : "none"};
    }
  },
  methods: {
    update: function(name, val){
      gS.$emit('optionsUpdate', name, val);
    }
  }
}
</script>

<style>
#configUI {
  display: flex;
  align-content: start;
  flex-flow: row wrap;
  align-items: baseline; /*center;*/
  justify-content: flex-start;
}
</style>
