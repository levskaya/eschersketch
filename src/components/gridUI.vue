<template>
  <div>

  <es-numfield param="X" :val="x" @numchange="update"></es-numfield>
  <es-numfield param="Y" :val="y" @numchange="update"></es-numfield>

  <span :style="showGridParams">
    <es-numfield param="d" label="&Delta;" :val="d" @numchange="update"></es-numfield>
    <!--<es-numfield param="Nx" :val="Nx" @numchange="update"></es-numfield>
        <es-numfield param="Ny" :val="Ny" @numchange="update"></es-numfield>-->
    <div class="button" @click="halveD">&frac12;</div>
    <div class="button" @click="doubleD">2x</div>
  </span>

  <span :style="showPointParams">
    <es-numfield param="Nrot" :val="Nrot" @numchange="update"></es-numfield>
    <es-numfield param="Nref" :val="Nref" @numchange="update"></es-numfield>
    <!--<es-numfield param="rot" label="&theta;" :val="rot" @numchange="update"></es-numfield>-->
  </span>

  </div>

</template>
<script>
import es_numfield from './es_numfield';
import {_} from 'underscore';
import {gS, gCONSTS} from '../main.js';

export default {
  components: {'es-numfield': es_numfield},
  props: ['x','y','d', 'Nrot', 'Nref','rot', 't'], // ['x','y','d','Nx','Ny'],
  computed: {
    showPointParams: function(){
      if(gS.symmState.sym == "rosette"){
          return {display: "inline"}
      } else {
        return {display: "none"}
      }
    },
    showGridParams: function(){
      if(gCONSTS.TILINGSYMS.includes(gS.symmState.sym)){
        return {display: "inline"}
      } else {
        return {display: "none"}
      }
    }
  },
  methods: {
    update: function(name, val){
      var gridcopy = _.clone(gS.symmState);
      gridcopy[name] = Number(val);
      gS.$emit('symmUpdate', gridcopy);
    },
    halveD: function(){ this.update("d", this.d/2.0); },
    doubleD: function(){ this.update("d", this.d*2.0); },
  },
}
</script>
<style scoped>
</style>
