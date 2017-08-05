<template>
  <div id="stateUI">
    <template v-if="params.fullUI">
      <div id="logo" class="Aligner">
        <div class="Aligner-item">
          <span class="eslogotext" style="font-variant:small-caps;margin-right:10px;">escher</span><br>
        </div>
        <div class="Aligner-item">
          <img src="static/svg/es_logo.svg" height="30px" style="margin-top:6px;"/>
        </div>
        <div class="Aligner-item">
          <span class="eslogotext" style="font-variant:small-caps;margin-left:10px;">sketch</span>
        </div>
        <div class="Aligner-item">
          <div class="button" :class="{selected: !params.fullUI}" style="margin-left:80%"
               title="minimize UI" @click="toggleUI">
            <span class="icon-shrink2"></span>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
        <span class="eslogo"><img src="static/svg/es_logo.svg" height="25px" style="margin-bottom:-8px; padding:0px"/></span>
    </template>

    <div class="button" @click="help" title="help" key="stateui-help-button"><b>¿?</b></div>

    <template v-if="params.fullUI">
      <div class="button"  @click="config" title="settings"><span class="icon-cog"></span></div>
    </template>

    <template v-if="!params.fullUI">
      <div class="button" :class="{selected: params.showTool}" @click="toggleTool" key="stateui-tool-button" title="show color">
        <span class="icon-quill"></span>
      </div>
      <div class="button" :class="{selected: params.showColor}" @click="toggleColor" key="stateui-color-button" title="show color">
        <span class="icon-palette"></span>
      </div>
      <div class="button" :class="{selected: params.showSymm}" @click="toggleSymm" key="stateui-symm-button" title="show symmetries">
        <span class="icon-symmetries"></span>
      </div>
      <div class="button" :class="{selected: params.showFile}" @click="toggleFile" key="stateui-file-button" title="save files">
        <span class="icon-folder-download"></span>
      </div>
    </template>

    <div class="button"  @click="undo" title="undo" key="stateui-undo"><span class="icon-undo"></span></div>
    <div class="button"  @click="redo" title="redo" key="stateui-redo"><span class="icon-redo"></span></div>

    <div class="button" :class="{armed: armed}" @click="reset" title="reset" key="stateui-reset">
      <template v-if="armed"><span class="icon-bin"></span>?</template>
      <template v-else><span class="icon-bin"></span></template>
    </div>


    <template v-if="!params.fullUI">
      <div class="button" @click="toggleUI" key="stateui-enlarge-button" title="full UI">
        <span class="icon-enlarge2"></span>
      </div>
    </template>

</div>
</template>

<script>
import {gS} from '../main.js';

export default {
  props: ['params'],
  data: function(){ return {toggled: false, armed: false}; },
  components: {},
  computed:{
    toggleClass: function() {
      if(this.toggled) {
        return "alarm"
      }
    },
    whichButton: function(name){
      if(name=="tool"){
        return {}
      }
    }
  },
  methods: {
    undo: function(){ gS.$emit('undo'); },
    redo: function(){ gS.$emit('redo'); },
    reset: function(){
      if(this.armed){
        gS.$emit('reset');
        this.armed=false;
      } else {
        this.armed=true;
        setTimeout(() => this.armed=false, 1000);
      }
    },
    toggleUI: function(){ gS.$emit('toggleUI'); },
    toggleTool: function(){
      gS.$emit('toggleParam', 'showTool');
      gS.$emit('toggleParam', 'showLine');
    },
    toggleColor: function(){
      gS.$emit('toggleParam', 'showColor');
    },
    toggleSymm: function(){
      gS.$emit('toggleParam', 'showSymm');
    },
    toggleFile: function(){
      gS.$emit('toggleParam', 'showFile');
    },
    help: function(){ console.log("call help"); gS.$emit('help'); },
    config: function(){ gS.$emit('config'); },
    }
}
</script>

<style scoped>

[tooltip]:before {
    position : absolute;
    background-color: #fff;
    content : attr(tooltip);
    opacity : 0;
}
[tooltip]:hover:before {
    opacity : 1;
}

.flex-container {
    height: 100%;
    padding: 0;
    margin: 0;
    display: -webkit-box;
    display: -moz-box;
    display: -ms-flexbox;
    display: -webkit-flex;
    display: flex;
    align-items: center;
    justify-content: center;
}
.row {
    width: auto;
    border: 1px solid blue;
}
.flex-item {
    background-color: tomato;
    padding: 5px;
    width: 20px;
    height: 20px;
    margin: 10px;
    line-height: 20px;
    color: white;
    font-weight: bold;
    font-size: 2em;
    text-align: center;
}

</style>
