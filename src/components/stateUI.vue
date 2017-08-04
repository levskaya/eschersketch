<template>
  <div>
    <template v-if="showUI">
      <div id="logo" class="Aligner systemfont" style="margin-left:-10px;">
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
          <div class="button" :class="{selected: !showUI}" style="margin-left:100%"
               title="minimize UI" @click="toggleUI">
            <span class="icon-shrink2"></span>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
        <span><img src="static/svg/es_logo.svg" height="30px" style="margin-bottom:-8px; padding:0px"/></span>
    </template>
    <div class="button" @click="help" title="help"><b>¿?</b></div>
    <div class="button" @click="config" title="settings"><span class="icon-cog"></span></div>

    <div class="button"  @click="undo" title="undo"><span class="icon-undo"></span></div>
    <div class="button"  @click="redo" title="redo"><span class="icon-redo"></span></div>
    <div class="button" :class="{armed: armed}" @click="reset" title="reset">
      <template v-if="armed"><span class="icon-bin"></span>?</template>
      <template v-else><span class="icon-bin"></span></template>
    </div>
    <template v-if="!showUI">
      <div class="button" @click="toggleUI" key="stateui-enlarge-button" title="full UI">
        <span class="icon-enlarge2"></span>
      </div>
    </template>
</div>
</template>

<script>
import {gS} from '../main.js';

export default {
  props: ['showUI'],
  data: function(){ return {toggled: false, armed: false}; },
  components: {},
  computed:{
    toggleClass: function() {
      if(this.toggled) {
        return "alarm"
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
    help: function(){ gS.$emit('help'); },
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
