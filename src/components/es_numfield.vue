<template>
  <input type="text" @change="numchange" :value="val" size="3"/>
</template>
<script>
  export default {
    name: 'es-numfield',
    props: ['param', 'val'],
    methods: {
      numchange: function({type, target}){
        target.blur();
        this.$emit("numchange", this.param, target.value);
      }
    }
  }
</script>
<style scoped>
input {
    vertical-align:text-top;
}
</style>
