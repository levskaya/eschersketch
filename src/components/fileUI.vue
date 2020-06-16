<template>
<div id="fileUI" :style="panelStyle">
  <span class="UIheader">print.share.export</span><br>

  <template v-if="options.showFileName">
    <es-numfield param="filename" label="filename"
      :val="fname" size="20" @numchange="changeFilename" key="fileui-fname"/>
    <br>
  </template>

  <template v-if="params.showNetwork && !params.disableNetwork">

    <es-button name="saveOnline" @bclick="uploadSketch" hint="upload drawing to cloud and make social share links">
      <span class="icon-cloud-upload"></span> Share!
    </es-button>

    <template v-if="params.showShareLinks">
      <div id="copy-button" class="button" v-if="params.copyText.length>0">
        <span class="icon-link"/>
      </div>
      <es-button name="gotoFB" @bclick="gotoFB" hint="share on facebook">
        <span class="icon-facebook-square"/>
      </es-button>
      <es-button name="gotoTwitter" @bclick="gotoTwitter" hint="share on twitter">
        <span class="icon-twitter-square"/>
      </es-button>
      <es-button name="gotoPB" @bclick="gotoPB" hint="share on pinterest">
        <span class="icon-pinterest"/>
      </es-button>
    </template>
    <br>

    <es-button name="printOnline" @bclick="printTile" hint="upload tile pattern for printing wrapping paper, fabric, etc">
      <template v-if="params.showPrintLinks">Upload New Print</template>
      <template v-else>Order Wrapping Paper!</template>
    </es-button>

    <template v-if="params.printLink == 'UPLOADING'"> UPLOADING </template>

    <template v-if="params.showPrintLinks">
      <es-button name="printZazzle" @bclick="gotoZazzle" hint="go to Zazzle to print wrapping paper, fabric, etc">
        <b>Go to Zazzle</b>
      </es-button>
    </template>
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

</div>
</template>

<script>
import esNumfield from './es_numfield';
import esButton from './es_button';
import {gS, forceCommit, saveSVG, savePNG, savePNGTile, saveJSON, loadJSON} from '../main';
import {networkConfig} from '../config';
import {saveSketch, saveTileforPrint} from '../network';
import _ from 'underscore';
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
  },
  methods:{  //XXX: dirty, need to move all of these to top-level "$emit" calls
    savePNG: function() { forceCommit();  savePNG(); },
    savePNGTile: function() { forceCommit();  savePNGTile(); },
    saveSVG: function() { forceCommit();  saveSVG(); },
    saveJSON: function() { forceCommit();  saveJSON(); },
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
      forceCommit();
      saveSketch();
    },
    printTile: function(){
      forceCommit();
      saveTileforPrint();
    },
    gotoFB: function() {
      let myuri = encodeURI(gS.params.copyText);
      let fbHref = networkConfig.fbHref.replace(/_MYURI_/g, myuri);
      window.open(fbHref, "_blank");
    },
    gotoTwitter: function() {
      let myuri = encodeURI(gS.params.copyText);
      let twitterHref = networkConfig.twitterHref.replace(/_MYURI_/g, myuri);
      window.open(twitterHref, "_blank");
    },
    gotoPB: function() {
      let myuri = encodeURI(gS.params.copyText);
      let jpguri = myuri.replace("/s/","/social/")+".jpg";
      let pinHref = networkConfig.pinHref.replace(/_MYURI_/g, myuri).replace(/_JPGURI_/g, jpguri);
      window.open(pinHref, "_blank");
    },
    gotoZazzle: function(){
      console.log("opening link ", gS.params.printLink);
      window.open(gS.params.printLink, "_blank");
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
