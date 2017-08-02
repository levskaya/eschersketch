<template>
  <div>
    <ex-button name="none" :selected="cursym" @bclick="changeSym"></ex-button>
    <!--Rotation Free<br>-->
    <ex-button name="p1" :selected="cursym" @bclick="changeSym"></ex-button>
    <ex-button name="diagonalgrid" :selected="cursym" @bclick="changeSym"></ex-button>
    <ex-button name="pm" :selected="cursym" @bclick="changeSym"></ex-button>
    <ex-button name="cm" :selected="cursym" @bclick="changeSym"></ex-button>
    <ex-button name="pg" :selected="cursym" @bclick="changeSym"></ex-button>
    <!--<br>180&deg;</br>-->
    <ex-button name="pmg" :selected="cursym" @bclick="changeSym"></ex-button>
    <ex-button name="pgg" :selected="cursym" @bclick="changeSym"></ex-button>
    <ex-button name="pmm" :selected="cursym" @bclick="changeSym"></ex-button>
    <ex-button name="p2" :selected="cursym" @bclick="changeSym"></ex-button>
    <ex-button name="cmm" :selected="cursym" @bclick="changeSym"></ex-button>
    <!--<br>Square<br>-->
    <ex-button name="p4" :selected="cursym" @bclick="changeSym"></ex-button>
    <ex-button name="p4g" :selected="cursym" @bclick="changeSym"></ex-button>
    <ex-button name="p4m" :selected="cursym" @bclick="changeSym"></ex-button>
    <!--<br>Hexagonal<br>-->
    <ex-button name="hexgrid" :selected="cursym" @bclick="changeSym"></ex-button>
    <ex-button name="p3" :selected="cursym" @bclick="changeSym"></ex-button>
    <ex-button name="p6" :selected="cursym" @bclick="changeSym"></ex-button>
    <ex-button name="p31m" :selected="cursym" @bclick="changeSym"></ex-button>
    <ex-button name="p3m1" :selected="cursym" @bclick="changeSym"></ex-button>
    <ex-button name="p6m" :selected="cursym" @bclick="changeSym"></ex-button><br>
    <!--<br>Rosettes<br>-->
    <ex-button name="rosette" :selected="cursym" @bclick="changeSym"></ex-button>
  </div>
</template>
<script>
import es_button from './ex_button';
import {gS} from '../main.js';

export default {
  props: ['params'],
  components: {'ex-button': es_button},
  computed: {
    cursym: function(){ return this.params.symstate;},
  },
  methods: {
    changeSym: function(symname){
      gS.$emit('symmUpdate', symname, gS.gridstate);
    }
  },
}
</script>
<style scoped>
</style>
