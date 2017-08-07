<template>
  <div id="navPanel" :style="panelStyle">
    <template v-if="drawTools[params.curTool].actions">
    <!--<div style="font-variant: small-caps;width:100%;">tool commands</div>-->

      <!--<div class="toolname"><b>{{curtool}}</b></div>-->

      <template v-for="action in drawTools[params.curTool].actions">
        <!--<div class="action-name">{{action.desc}}</div>-->

        <div class="icon-w-keyhint">
          <es-button :name="action.name" selected="" :hint="action.desc" @bclick="takeAction">
            <span :class="action.icon" :title="action.key"/>
          </es-button>
        <div class="keyhint" v-html="$options.filters.printableKeyCode(action.key)"></div>
        </div>

      </template>

    </template>
  </div>
</template>

<script>
import esButton from './es_button';
import {gS, drawTools} from '../main.js';


export default {
  props: ['params'],
  data: function (){ return {
      drawTools: drawTools
    }
  },
  components: {esButton},
  computed:{
    curtool: function(){ return this.params.curTool; },
    panelStyle: function() {
      return (this.params.showNav ? {} : {display: "none"}); //don't override CSS on show
    }
  },
  methods: {
    //changeTool: function(toolName){ gS.$emit('toolUpdate', toolName);  },
    //log: function(e){console.log(e,e.target.attributes);},
    takeAction: function(name){ drawTools[this.params.curTool][name](); } //HACK
  },
  filters: {
    printableKeyCode: function(keycode) {
      // KeyD --> D
      if(keycode.substring(0,3)=="Key")  { return keycode.substring(3); }
      else if(keycode==="Backspace")     { return "&#9003;"; }
      else if(keycode==="Enter")         { return "&#9166;"; }
      else if(keycode==="Escape")        { return "Esc"; }
      else if(keycode==="ArrowUp")       { return "&#8593"; }
      else if(keycode==="ArrowDown")     { return "&#8595"; }
      else if(keycode==="ArrowLeft")     { return "&#8592"; }
      else if(keycode==="ArrowRight")    { return "&#8594"; }
      else { return keycode; }
    }
  }
}
</script>

<style>

#navPanel {
  /* This styling is for making this a floating panel at the top of the drawing canvas */
  /*
  position: absolute;
  left: 0;
  right: 0;
  top:5px;
  z-index:6;
  padding:0 2px 0 2px;
  margin: auto;
  width: 50%;
  background-color:rgba(245,245,245,0.95);
  border-radius: 5px;
  */

  display: flex;
  flex-flow: row wrap;
  align-items: baseline;
  justify-content: flex-start;
  overflow: visible;
}
/*
@media (max-width: 768px) {
  #navPanel {
    width:100%;
  }
}
*/

.toolname {
  padding-right: 2%;
}

.action-name {
  font-size:50%
}

.icon-w-keyhint {
  display:flex;
  _flex: 0 1 80px;
  padding-right: 2%;
  flex-flow: column nowrap;
  align-items:center;
  justify-content: center;
}
.icon-w-keyhint > .keyhint {
  font-size:60%
}
/* hide key hints on presumable mobile devices...*/
@media (max-width: 768px) {
  .icon-w-keyhint > .keyhint {
    display: none;
  }
}


</style>
