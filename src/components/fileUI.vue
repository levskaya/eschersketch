<template>
<div id="fileUI" :style="panelStyle">
  <span class="UIheader">export</span><br>

  <es-numfield param="filename" label="filename"
  :val="fname" size="20" @numchange="changeFilename" key="fileui-fname"/><br>

  <div id="saveSVG" class="button" @mousedown="saveSVG">
    <span class="icon-folder-download"></span> SVG
  </div>

  <div id="savePNG" class="button" @mousedown="savePNG">
    <span class="icon-folder-download"></span> PNG
  </div>

  <div id="savePNGtile" class="button" @mousedown="savePNGTile">
    <span class="icon-folder-download"></span> PNG Tile
  </div>

  <br>
  <span style="font-variant: small-caps;">
    save&load <span style="color:red">experimental</span>
  </span>
  <br>

  <div id="save-json" class="button" @mousedown="saveJSON">
    <span class="icon-folder-download"></span> JSON
  </div>

  <label class="fileContainer">
    <span class="icon-folder-upload"></span> JSON
    <input id="the-file-input" type="file" @change="loadJSON">
  </label>

</div>
</template>

<script>
import es_numfield from './es_numfield';
import es_button from './es_button';
import {gS, saveSVG, saveSVGTile, savePNG, savePNGTile, saveJSON, loadJSON} from '../main.js';
import {_} from 'underscore';

//document.getElementById("saveSVGtile").onmousedown = function(e) { saveSVGTile(); };

export default {
  props: ['params'],
  components: {
    'es-button': es_button,
    'es-numfield': es_numfield
  },
  computed: {
    panelStyle: function() {
      return {display: this.params.showFile ? "block" : "none"};
    },
    fname: function() {return this.params.filename;}
  },
  methods:{  //XXX: dirty, need to move all of these to top-level "$emit" calls
    savePNG: function() { savePNG(); },
    savePNGTile: function() { savePNGTile(); },
    saveSVG: function() { saveSVG(); },
    saveJSON: function() { saveJSON(); },
    loadJSON: function({type, target}){
      loadJSON(target.files[0]);
    },

    changeFilename: function(name, val) {
      if(val.trim()===""){
        gS.$emit('paramsUpdate', name, "eschersketch"); //XXX: doesn't update its own ui all the time...
      } else {
        gS.$emit('paramsUpdate', name, val.trim());
      }
    }
  }
}
</script>
<style scoped>

.fileContainer {
    overflow: hidden;
    position: relative;
}
.fileContainer [type=file] {
    cursor: inherit;
    display: block;
    font-size: 999px;
    filter: alpha(opacity=0);
    min-height: 100%;
    min-width: 100%;
    opacity: 0;
    position: absolute;
    right: 0;
    text-align: right;
    top: 0;
}
/* Example stylistic flourishes */
.fileContainer {
  border:1px solid #ddd;
  background: #eeeeee;
  text-indent:0px;
  text-align: center;
  border-radius: 2px;
  margin: 2px;
  padding: 3px;
  display: inline-block;
  cursor: pointer;
  color: #666;
  float: left;
}

.fileContainer [type=file] {
    cursor: pointer;
}
</style>
