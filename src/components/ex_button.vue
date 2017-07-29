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

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.button {
    //outline:1px solid #ddd;
    background: #eeeeee;
    text-indent:0px;
    text-align: center;
    border-radius: 2px;
    margin: 2px;
    padding: 3px;
    display: inline-block;
    cursor:pointer;
    color:#666;
}
.selected {
    background: rgba(250,150,150,0.6);
}
</style>
