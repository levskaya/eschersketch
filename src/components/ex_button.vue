<template>
  <div class="button" :class="isSelected" @click="bclick">
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
  name: 'ex-button',
  props: ['name', 'selected'],
  methods: {
    bclick: function(){
      //console.log('blick');
      this.$emit("bclick", this.name);
    }
  },
  computed: {
    isSelected: function() {
      //console.log(this.selected);
      return {selected: this.name==this.selected}; },
    isSlot: function() {if(this.$slots.default){return true;};}
  },
}
</script>

<style scoped>
.selected {
    background: rgba(250,150,150,0.6);
}
</style>
