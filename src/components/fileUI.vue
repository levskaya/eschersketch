<template>
<div id="fileUI" :style="panelStyle">
  <span class="UIheader">export</span><br>

  <template v-if="params.showFileName">
    <es-numfield param="filename" label="filename"
      :val="fname" size="20" @numchange="changeFilename" key="fileui-fname"/>
    <br>
  </template>

  <div id="saveSVG" class="button" @mousedown="saveSVG">
    <span class="icon-folder-download"></span> SVG
  </div>

  <div id="savePNG" class="button" @mousedown="savePNG">
    <span class="icon-folder-download"></span> Picture
  </div>

  <div id="savePNGtile" class="button" @mousedown="savePNGTile">
    <span class="icon-folder-download"></span> Tile
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

  <br>

  <template v-if="params.showNetwork">
    <div id="save-online" class="button" @mousedown="uploadSketch">
      <span class="icon-cloud-upload"></span> Make Shareable Links!
    </div>

  <template v-if="params.showShareLinks">
    <div id="copy-button" class="button" v-if="params.copyText.length>0">
      Copy the Link to Your Sketch
    </div>
    <div id="fb-button" class="button">
      <a :href="fbLink">Share your Sketch on Facebook</a>
    </div>
    <div id="twitter-button" class="button">
      <a :href="twitterLink">Share your Sketch on Twitter</a>
    </div>
  </template>

  </template>

</div>
</template>

<script>
import es_numfield from './es_numfield';
import es_button from './es_button';
import {gS, saveSVG, saveSVGTile, savePNG, savePNGTile, saveJSON, loadJSON} from '../main.js';
import {_} from 'underscore';
import {saveSketch} from '../network.js';
import Clipboard from 'clipboard';
var clipboard = new Clipboard('#copy-button', {
    text: function() {
        //console.log("copytext", gS.params.copyText);
        return gS.params.copyText;
    }
});

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
    fname: function() {return this.params.filename;},
    fbLink: function() {
      let myurl = encodeURI(gS.params.copyText);
      let fbHref = `https://www.facebook.com/dialog/share?app_id=1435026029878806&display=page&href=${myurl}&redirect_uri=${myurl}`
      return fbHref;
    },
    twitterLink: function() {
      let myurl = encodeURI(gS.params.copyText);
      let twitterHref = `https://twitter.com/intent/tweet?url=${myurl}&text=Eschersketch`
      return twitterHref;
    }
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
    },
    uploadSketch: function(){
      //console.log("trying to upload");
      saveSketch();

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
