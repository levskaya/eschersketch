<template>
  <div>
  <es-numfield param="x" :val="x" @numchange="update"></es-numfield>
  <es-numfield param="y" :val="y" @numchange="update"></es-numfield>
  <es-numfield param="d" label="&Delta;" :val="d" @numchange="update"></es-numfield>
  <!--<es-numfield param="Nx" :val="Nx" @numchange="update"></es-numfield>
      <es-numfield param="Ny" :val="Ny" @numchange="update"></es-numfield>-->
  <div class="button" @click="halveD">&frac12;</div>
  <div class="button" @click="doubleD">2x</div>
  </div>
</template>
<script>
import es_numfield from './es_numfield';
import {_} from 'underscore';
import {gS} from '../main.js';

export default {
  components: {'es-numfield': es_numfield},
  props: ['x','y','d'], // ['x','y','d','Nx','Ny'],
  methods: {
    update: function(name, val){
      var gridcopy = _.clone(gS.symmState);
      gridcopy[name]=Number(val);

      gS.$emit('symmUpdate', gridcopy);
    },
    halveD: function(){ this.update("d", this.d/2.0); },
    doubleD: function(){ this.update("d", this.d*2.0); },
  },
}
</script>
<style scoped>
</style>
