<template>
  <span>
    <label    v-if="label" v-html="label" :for="param"></label>
    <template v-else-if="this.$slots.default">  <slot></slot>  </template>
    <label    v-else :for="param">{{param}}</label>
    <input type="checkbox" :name="param" :checked="val" @change="checked"/>
</span>
</template>
<script>
  export default {
    name: 'es-checkbox',
    props: ['param', 'val', 'label'],
    methods: {
      checked: function({type, target}) {
        target.blur();
        this.$emit("checked", this.param, !this.val);
      }
    }
  }
</script>

<style scoped>
</style>
