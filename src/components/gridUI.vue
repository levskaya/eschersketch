<template>
  <div>
  <span>x</span>
  <es-numfield param="x" :val="x" @numchange="update"></es-numfield>
  <span>y</span>
  <es-numfield param="y" :val="y" @numchange="update"></es-numfield>
  <span>&Delta;</span>
  <es-numfield param="d" :val="d" @numchange="update"></es-numfield>
  <!--<span>Nx</span>
      <es-numfield param="Nx" :val="Nx" @numchange="update"></es-numfield>
      <span>Ny</span>
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
      var gridcopy = _.clone(gS.gridstate);
      gridcopy[name]=Number(val);

      gS.$emit('symmUpdate', gS.symstate.sym, gridcopy);
    },
    halveD: function(){ this.update("d", this.d/2.0); },
    doubleD: function(){ this.update("d", this.d*2.0); },
  },
}
</script>
<style scoped>
span {
    margin:5px;
}
.button {
    border:1px solid #ddd;
    text-indent:0px;
    background: #eeeeee;
    text-align: center;
    font-variant: small-caps;
    border-radius: 2px;
    margin: 2px;
    padding: 3px;
    display: inline-block;
    cursor:pointer;
    color:#666;
}
</style>
