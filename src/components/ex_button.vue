<template>
  <div class="button" :class="isSelected" @click="bclick">
    {{ name }}
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
      return {selected: this.name==this.selected}; }
  }
}
</script>

<style scoped>
.selected {
    background: rgba(250,150,150,0.6);
}
</style>
