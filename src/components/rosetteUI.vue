<template>
  <div :style="showme"><br>
  <es-numfield param="Nrot" :val="Nrot" @numchange="update"></es-numfield>
  <es-numfield param="Nref" :val="Nref" @numchange="update"></es-numfield>
  <es-numfield param="rot" label="&theta;" :val="rot" @numchange="update"></es-numfield>
  </div>
</template>
<script>
import es_numfield from './es_numfield';
import {_} from 'underscore';
import {gS} from '../main.js';

export default {
  components: {'es-numfield': es_numfield},
  props: ['Nrot','Nref','rot'],
  computed: {showme: function(){
    if(gS.symmState.sym == "rosette"){
        return {display: "block"}
    } else {
      return {display: "none"}
    }
  } },
  methods: {
    update: function(name, val){
      var gridcopy = _.clone(gS.symmState);
      gridcopy[name] = Number(val);
      gS.$emit('symmUpdate', gridcopy);
    }
  },
}
</script>
<style scoped>
</style>
