<template>
<div id="hintPanel" :style="panelStyle">
      <span class="hintText">{{params.hintText}}</span>
</div>
</template>

<script>
import {gS} from '../main.js';

export default {
  props: ['params', 'options'],
  computed:{
    panelStyle: function() {
      return (!this.options.showHints || this.params.hintText==="") ? {display: "none"} : {};
    }
  },
}
</script>

<style>
#hintPanel {
  foo_position: absolute;
  position: fixed;
  left: 0;
  right: 0;
  top:5px;
  z-index:10;
  padding:0 2px 0 2px;
  margin: auto;
  width: 50%;
  background-color:rgba(245,245,245,0.95);
  _border-radius: 5px;
  display: flex;
  flex-flow: row wrap;
  align-items: baseline;
  justify-content: flex-start;
  overflow: visible;
}

@media (max-width: 768px) {
  #hintPanel {
    top: 95%;
    width:100%;
  }
}
.hintText {
  /*font-size:20px;*/
}
</style>
