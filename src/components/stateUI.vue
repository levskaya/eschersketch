<template>
  <div>
    <div class="button"  @click="undo">undo</div>
    <div class="button"  @click="redo">redo</div>
    <div class="button" :class="{armed: armed}" @click="reset">
      <template v-if="armed">reset?</template>
      <template v-else>reset</template>
    </div>
    <div class="button" :class="{selected: showUI}" @click="toggleUI">
      <template v-if="showUI">HIDE UI</template>
      <template v-else>SHOW UI</template>
    </div>
    <div class="button selected" @click="help"><b>?</b></div>
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
      }
    },
    toggleUI: function(){ gS.$emit('toggleUI'); },
    help: function(){ gS.$emit('help'); },
    }
}
</script>

<style scoped>

</style>
