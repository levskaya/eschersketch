<template>
<div id="helppanel" class="Absolute-Center" :style="helpDisplay">
  <center><div class="button" @click="help" key="helpback1"><b>BACK TO ESCHERSKETCH</b></div></center>
  <help-text/>
  <center><div class="button" @click="help" key="helpback2"><b>BACK TO ESCHERSKETCH</b></div></center>
</div>
</template>

<script>
//import es_numfield from './es_numfield';
import es_button from './es_button';
//import {gS, gCONSTS} from '../main.js';
//import {_} from 'underscore';
//import VueMarkdown from 'vue-markdown';
import helpText from './help.md'

export default {
  props: ['showHelp'],
  //data: function(){ return {toggled: false, armed: false}; },
  components: {
    helpText,
    //'vue-markdown': VueMarkdown,
    'es-button': es_button,
    //'es-numfield': es_numfield
  },
  computed:{
    helpDisplay: function() {
      if(this.showHelp){
        return {display: "block"};
      } else {
        return {display: "none"};
      }
    }
  },
  methods: { help: function(){ gS.$emit('help'); },
}
}
</script>
<style scoped>

#helppanel {
  z-index:10;
  padding:0 1% 0 1%;
  //width:768px;
  width: 60%;
  background-color:rgba(245,245,245,1.0);
}

#helppanel > img.helplogo {
  height:80px;
  vertical-align:middle;
  //margin-left:5%;
  //margin-right:5%
}

.Absolute-Center {
  margin: auto;
  position: absolute;
  left: 0;
  right: 0;
}


@media (max-width: 768px) {
#helppanel {
  width:100%;
  //padding-left: 5%;
  //padding-right: 5%;
}
#helppanel > img.helplogo {
  height:40px;
  //width: 40px;
  vertical-align:middle;
  //margin-left:1%;
  //margin-right:1%
}
}

</style>
