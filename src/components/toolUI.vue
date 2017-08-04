<template>
  <div>
    <es-button name="pencil" :selected="curtool" @bclick="changeTool">
      <span class="icon-pencil"></span>
    </es-button>
    <es-button name="line"   :selected="curtool" @bclick="changeTool">
      <span class="icon-line"></span>
    </es-button>
    <es-button name="circle" :selected="curtool" @bclick="changeTool">
      <span class="icon-radio-unchecked"></span>
    </es-button>
    <es-button name="poly"   :selected="curtool" @bclick="changeTool">
      <span class="icon-hexagon"></span>
    </es-button>
    <es-button name="bezier" :selected="curtool" @bclick="changeTool">
      <span class="icon-pen"></span>
    </es-button>

    <es-button name="grid"   :selected="curtool" @bclick="changeTool">
      grid adjust
    </es-button>

  </div>
</template>

<script>
import es_button from './es_button';
import {gS} from '../main.js';

export default {
  props: ['params'],
  components: {'es-button': es_button},
  computed:{
    curtool: function(){ return this.params.curTool; }
  },
  methods: {
    changeTool: function(toolName){
      //console.log(toolName);
      gS.$emit('toolUpdate', toolName);
    }
  },
}
</script>
<style scoped>
</style>
