<template>
  <div>
    <template v-for="sym in symmetries">
      <es-button :param="sym" @bclick="changesym"></es-button>
    </template>
  </div>
</template>
<script>
import es_button from './es_button';
import {gS} from '../main.js';

export default {
  props: ['params', 'allsyms'],
  components: {'es-button': es_button},
  computed: {
    symmetries: function(){
      var symds=[];
      for(var sym of this.allsyms){
        symds.push({name: sym,
                    selected: (sym==this.params.symstate)});
      }
      return symds;
    }
  },
  methods: {
    changesym: function(symname){
      gS.$emit('symmUpdate', symname, gS.gridstate);
    }
  },
}
</script>
<style scoped>
</style>
