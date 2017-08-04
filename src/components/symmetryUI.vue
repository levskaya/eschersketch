<template>
  <div>
    <es-button name="none" :selected="cursym" @bclick="changeSym"></es-button>
    <es-button name="rosette" :selected="cursym" @bclick="changeSym"></es-button><br>
    <!--Rotation Free<br>-->
    <es-button name="p1" :selected="cursym" @bclick="changeSym"></es-button>
    <es-button name="diagonalgrid" :selected="cursym" @bclick="changeSym">diaggrid</es-button>
    <es-button name="pm" :selected="cursym" @bclick="changeSym"></es-button>
    <es-button name="cm" :selected="cursym" @bclick="changeSym"></es-button>
    <es-button name="pg" :selected="cursym" @bclick="changeSym"></es-button>
    <!--<br>180&deg;</br>-->
    <es-button name="pmg" :selected="cursym" @bclick="changeSym"></es-button>
    <es-button name="pgg" :selected="cursym" @bclick="changeSym"></es-button>
    <es-button name="pmm" :selected="cursym" @bclick="changeSym"></es-button>
    <es-button name="p2" :selected="cursym" @bclick="changeSym"></es-button>
    <es-button name="cmm" :selected="cursym" @bclick="changeSym"></es-button>
    <!--<br>Square<br>-->
    <es-button name="p4" :selected="cursym" @bclick="changeSym"></es-button>
    <es-button name="p4g" :selected="cursym" @bclick="changeSym"></es-button>
    <es-button name="p4m" :selected="cursym" @bclick="changeSym"></es-button>
    <!--<br>Hexagonal<br>-->
    <es-button name="hexgrid" :selected="cursym" @bclick="changeSym"></es-button>
    <es-button name="p3" :selected="cursym" @bclick="changeSym"></es-button>
    <es-button name="p6" :selected="cursym" @bclick="changeSym"></es-button>
    <es-button name="p31m" :selected="cursym" @bclick="changeSym"></es-button>
    <es-button name="p3m1" :selected="cursym" @bclick="changeSym"></es-button>
    <es-button name="p6m" :selected="cursym" @bclick="changeSym"></es-button>
    <br>

    <es-button name="grid"   :selected="curtool" @bclick="changeTool">
      grid adjust
    </es-button>

    <es-numfield param="X" :val="symmState.x" @numchange="update"></es-numfield>
    <es-numfield param="Y" :val="symmState.y" @numchange="update"></es-numfield>

    <span :style="showGridParams">
      <es-numfield param="d" label="&Delta;" :val="symmState.d" @numchange="update"></es-numfield>
      <!--<es-numfield param="Nx" :val="Nx" @numchange="update"></es-numfield>
          <es-numfield param="Ny" :val="Ny" @numchange="update"></es-numfield>-->
      <div class="button" @click="halveD">&frac12;</div>
      <div class="button" @click="doubleD">2x</div>
    </span>

    <span :style="showPointParams">
      <es-numfield param="Nrot" :val="symmState.Nrot" @numchange="update"></es-numfield>
      <es-numfield param="Nref" :val="symmState.Nref" @numchange="update"></es-numfield>
      <!--<es-numfield param="rot" label="&theta;" :val="rot" @numchange="update"></es-numfield>-->
    </span>

  </div>
</template>

<script>
import es_numfield from './es_numfield';
import es_button from './es_button';
import {gS, gCONSTS} from '../main.js';

export default {
  props: ['symmState','params'],
  components: {
    'es-button': es_button,
    'es-numfield': es_numfield
  },
  computed: {
    cursym: function(){ return this.symmState.sym; },
    curtool: function(){ return this.params.curTool; },
    showPointParams: function(){
      if(gS.symmState.sym == "rosette"){
          return {display: "inline"}
      } else {
        return {display: "none"}
      }
    },
    showGridParams: function(){
      if(gCONSTS.TILINGSYMS.includes(this.symmState.sym)){
        return {display: "inline"}
      } else {
        return {display: "none"}
      }
    }
  },
  methods: {
    changeSym: function(symname){ gS.$emit('symmUpdate', {sym: symname}); },
    changeTool: function(toolName){ gS.$emit('toolUpdate', toolName); },
    update: function(name, val){
      var gridcopy = _.clone(gS.symmState);
      gridcopy[name] = Number(val);
      gS.$emit('symmUpdate', gridcopy);
    },
    halveD: function(){ this.update("d", this.symmState.d/2.0); },
    doubleD: function(){ this.update("d", this.symmState.d*2.0); },
  },
}
</script>
<style scoped>
</style>
