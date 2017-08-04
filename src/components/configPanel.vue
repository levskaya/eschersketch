<template>
  <div id="configpanel">
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer euismod orci nisi, vehicula eleifend tortor lacinia ac. Cras condimentum aliquam convallis. Nullam imperdiet tellus leo, in sagittis magna laoreet sit amet. Quisque ut ex sed leo facilisis elementum. Ut sagittis dictum magna eget sollicitudin. Ut eros turpis, dignissim sit amet urna id, vulputate congue arcu. Curabitur odio metus, tempus eget pretium vestibulum, scelerisque a nulla. Aenean vel augue dapibus elit dignissim convallis. Aenean placerat euismod augue nec rhoncus. Nam id vulputate arcu. Nullam tincidunt ornare enim, ac volutpat ex feugiat ac. Curabitur aliquet viverra ipsum id fermentum. Pellentesque vel felis nulla. Sed scelerisque erat nulla, eu vehicula tortor egestas in. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non interdum tellus.
    </p>
  </div>
</template>
<script>
import es_numfield from './es_numfield';
import es_button from './es_button';
import {gS, gCONSTS} from '../main.js';
import {_} from 'underscore';

export default {
  props: ['options'],
  //data: function(){ return {toggled: false, armed: false}; },
  components: {
    'es-button': es_button,
    'es-numfield': es_numfield
  },
  computed:{
  }
}
</script>
<style scoped>
#configpanel {
  width:100%
}
</style>
