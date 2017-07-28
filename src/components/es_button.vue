<template>
  <div class="symsel" :class="selected" @click="bclick">
    {{ sym.name }}
  </div>
</template>

<script>
export default {
  name: 'es-button',
  props: ['sym'],
  methods: {
    bclick: function(){
      this.$emit("bclick", this.sym.name);
    }
  },
  computed: {
    selected: function() {
      return {selected: this.sym.selected};
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.symsel {
    outline:1px solid #ddd;
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
