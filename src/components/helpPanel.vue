<template>
<div id="helppanel" :style="helpDisplay">
  <div id="buttoncontainer">
  <div id="topbutton" class="button" @click="help" key="helpback1"><b>EXIT HELP</b></div>
  <div id="xbutton" class="button" @click="help" key="helpback1b"><b>X</b></div>
</div>
  <help-text>
    <div slot="header">
      <div id="logocontainer">
        <div class="spacer"/>
        <h2>escher</h2><div class="spacer"/>
        <img src="/static/svg/eslogo2.svg" height="50px">
        <div class="spacer"/>
        <h2>sketch</h2>
        <div class="spacer"/>
     </div>
     <div id="logocontainer">
       <span style="font-size:50%">{{params.versionString}}</span>
     </div>
  </div>
  </help-text>

  <div class="button" @click="help" key="helpback2"><b>EXIT HELP</b></div>
</div>
</template>

<script>
import esButton from './es_button';
import helpText from './help.md'

export default {
  props: ['params'],
  components: { helpText, esButton },
  computed: {
    helpDisplay: function() {
      return {display: this.params.showHelp ? "block" : "none"};
    }
  },
  methods: {
    help: function(){ gS.$emit('help'); }
  }
}
</script>

<style>
#helppanel {
  z-index:10;
  padding:0 2% 0 2%;
  margin: auto;
  position: absolute;
  left: 0;
  right: 0;
  width: 60%;
  background-color:rgba(245,245,245,1.0);
  display: flex;
  align-content: start;
  flex-flow: row wrap;
  align-items: baseline;
  justify-content: center;
}
@media (max-width: 768px) {
  #helppanel {
    width:100%;
  }
}

#helppanel > .button {
  display: block; /* wide button */
  align-self: flex-start;
  flex: 1 1 auto;
  background-color: #ff5555;
  color: white;
}

#buttoncontainer {
  margin: auto;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: flex-end;
  width:100%;
}
#buttoncontainer > #topbutton {
  align-self: flex-start;
  flex: 1 1 90%;
  background-color: #ff5555;
  color: white;
}
#buttoncontainer > #xbutton {
  align-self: flex-start;
  flex: 1 1 2%;
  background-color: red;
  color: white;
  border-radius: 4px;
}

#logocontainer {
  margin: auto;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
  width:100%;
}
#logocontainer  h2, #logocontainer img {
  flex: 0 1 auto;
  font-variant: small-caps;
}
#logocontainer .spacer{
  align-self: flex-start;
  flex: 1 1 1rem;
}

th {
  display: none;
}

</style>
