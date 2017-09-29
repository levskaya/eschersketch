<template>
<div id="fileUI" :style="panelStyle">
  <span class="UIheader">export</span><br>

  <template v-if="options.showFileName">
    <es-numfield param="filename" label="filename"
      :val="fname" size="20" @numchange="changeFilename" key="fileui-fname"/>
    <br>
  </template>

  <es-button name="saveSVG" @bclick="saveSVG" hint="export drawing as SVG">
    <span class="icon-folder-download"></span> SVG
  </es-button>

  <es-button name="savePNG" @bclick="savePNG" hint="export drawing as PNG">
    <span class="icon-folder-download"></span> Picture
  </es-button>

  <es-button name="savePNGTile" @bclick="savePNGTile" hint="export symmetric tile as PNG">
    <span class="icon-folder-download"></span> Tile
  </es-button>

  <template v-if="options.showJSONexport">
    <br>
    <span style="font-variant: small-caps;">
      save&load <span style="color:red">experimental</span>
    </span>
    <br>

    <es-button name="saveJSON" @bclick="saveJSON" hint="save drawing as JSON file">
      <span class="icon-folder-download"></span> JSON
    </es-button>

    <label class="fileContainer" @mouseover="setHint" hint="reload previously saved JSON file">
      <span class="icon-folder-upload"></span> JSON
      <input id="the-file-input" type="file" @change="loadJSON">
    </label>
  </template>

  <template v-if="params.showNetwork && !params.disableNetwork">
    <br>
    <es-button name="saveOnline" @bclick="uploadSketch" hint="upload drawing to cloud and make social share links">
      <span class="icon-cloud-upload"></span> Share!
    </es-button>

    <template v-if="params.showShareLinks">
      <div id="copy-button" class="button" v-if="params.copyText.length>0">
        <span class="icon-link"/>
      </div>
      <div id="fb-button" class="button">
        <a :href="fbLink"><span class="icon-facebook-square"/></a>
      </div>
      <div id="twitter-button" class="button">
        <a :href="twitterLink"><span class="icon-twitter-square"/></a>
      </div>
      <div id="pinterest-button" class="button">
        <a :href="pinLink"><span class="icon-pinterest"/></a>
      </div>
    </template>

  </template>

</div>
</template>

<script>
import esNumfield from './es_numfield';
import esButton from './es_button';
import {gS, saveSVG, savePNG, savePNGTile, saveJSON, loadJSON} from '../main';
import {networkConfig} from '../config';
import {saveSketch} from '../network';
import {_} from 'underscore';
import Clipboard from 'clipboard';

var clipboard = new Clipboard('#copy-button', {
    text: function() { return gS.params.copyText; }
});

export default {
  props: ['params', 'options'],
  components: {esButton, esNumfield},
  computed: {
    panelStyle: function() {
      return {display: this.params.showFile ? "block" : "none"};
    },
    fname: function() {return this.params.filename;},
    fbLink: function() {
      let myuri = encodeURI(gS.params.copyText);
      let fbHref = networkConfig.fbHref.replace(/_MYURI_/g, myuri);
      return fbHref;
    },
    twitterLink: function() {
      let myuri = encodeURI(gS.params.copyText);
      let twitterHref = networkConfig.twitterHref.replace(/_MYURI_/g, myuri);
      return twitterHref;
    },
    pinLink: function() {
      let myuri = encodeURI(gS.params.copyText);
      let jpguri = myuri.replace("/s/","/social/")+".jpg";
      let pinHref = networkConfig.pinHref.replace(/_MYURI_/g, myuri).replace(/_JPGURI_/g, jpguri);
      return pinHref;
    },
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
      saveSketch();
    },
    setHint: function(e) {
      if(e.target.attributes.hint){
        gS.$emit('setHint', e.target.attributes.hint.value);
      }
    },
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
