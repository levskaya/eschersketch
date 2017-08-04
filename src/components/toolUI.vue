<template>
  <div>
    <ex-button name="pencil" :selected="curtool" @bclick="changeTool">
      <span class="icon-pencil"></span>
    </ex-button>
    <ex-button name="line"   :selected="curtool" @bclick="changeTool">
      <span class="icon-line"></span>
    </ex-button>
    <ex-button name="circle" :selected="curtool" @bclick="changeTool">
      <span class="icon-radio-unchecked"></span>
    </ex-button>
    <ex-button name="poly"   :selected="curtool" @bclick="changeTool">
      <span class="icon-hexagon"></span>
    </ex-button>
    <ex-button name="bezier" :selected="curtool" @bclick="changeTool">
      <span class="icon-pen"></span>
    </ex-button>

    <ex-button name="grid"   :selected="curtool" @bclick="changeTool">
      grid adjust
    </ex-button>

  </div>
</template>

<script>
import ex_button from './ex_button';
import {gS} from '../main.js';

export default {
  props: ['params'],
  components: {'ex-button': ex_button},
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
