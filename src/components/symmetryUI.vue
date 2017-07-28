<template>
  <div>
    <template v-for="sym in syms">
      <es-button :sym="sym" @bclick="changesym"></es-button>
    </template>
  </div>
</template>
<script>
import es_button from './es_button';
import {gS} from '../main.js';

export default {
  //data: { selected: selectedsym },
  props: ['selected', 'allsyms'],
  components: {'es-button': es_button},
  computed: {
    syms: function(){
      var symds=[];
      for(var sym of this.allsyms){
        symds.push({name: sym,
                    selected: (sym==this.selected.sym)});
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
