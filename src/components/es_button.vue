<template>
  <div class="button" :class="isSelected" @mousedown="bclick" @mouseover="setHint">
    <template v-if="this.$slots.default">
      <slot></slot>
    </template>
    <template v-else>
      {{name}}
    </template>
  </div>
</template>

<script>
export default {
  name: 'es-button',
  props: ['name', 'selected', 'hint'],
  methods: {
    bclick: function(){
      //console.log('blick');
      this.$emit("bclick", this.name);
    },
    logme: function(e) {
      console.log(e.type, this.name);
    },
    setHint: function(e) {
      if(this.hint){
        gS.$emit('setHint', this.hint);
        //setTimeout(() => gS.$emit('setHint', ''), 2000);
      }
    },
    clearHint: function(e) {
      if(this.hint){
        //gS.$emit('setHint', '');
      }
    },
  },
  computed: {
    isSelected: function() {
      //console.log(this.selected);
      return {selected: this.name==this.selected}; },
  },
}
</script>

<style scoped>
.selected {
    background: rgba(250,150,150,0.6);
}
</style>
