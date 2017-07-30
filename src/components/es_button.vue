<template>
  <div class="button" :class="selected" @click="bclick">
    {{ param.name }}
  </div>
</template>

<script>
export default {
  name: 'es-button',
  props: ['param'],
  methods: {
    bclick: function(){
      this.$emit("bclick", this.param.name);
    }
  },
  computed: {
    selected: function() {
      return {selected: this.param.selected};
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
/*.button {
    background: #eeeeee;
    text-indent:0px;
    text-align: center;
    border-radius: 2px;
    margin: 2px;
    padding: 3px;
    display: inline-block;
    cursor:pointer;
    color:#666;
}*/
.selected {
    background: rgba(250,150,150,0.6);
}
</style>
