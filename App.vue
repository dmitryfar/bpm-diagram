<template>
  <div id="app">
    <button @click="showModel(1)">model 1</button>
    <button @click="showModel(2)">model 2</button>
    <button @click="showModel(3)">null</button>
    <hr />
    <process-diagram model-type="process-definition"
                     :process-definition="processDefinition"
                     @click-element="onClickElement"
                     viewClass="bpm-diagram" />
  </div>
</template>

<script>
import ProcessDiagram from './src/ProcessDiagram/index'
import modelJson from './dist/model-json'
import modelJson2 from './dist/model-json-2'

export default {
  name: 'App',
  components: { ProcessDiagram },
  data() {
    return {
      processDefinition: modelJson
    }
  },
  methods: {
    showModel(model) {
      console.log('showModel %o', model)
      switch (model) {
        case 1:
          this.processDefinition = modelJson
          break
        case 2:
          this.processDefinition = modelJson2
          break
        default:
          this.processDefinition = null
      }
    },
    onClickElement({ event, element, x, y }) {
      let name = element.type === 'sequenceFlow' ? element.sourceRef + ' -> ' + element.targetRef : element.name
      console.log('clicked element: %o - %o, properties: %o', element.id, name, element.properties)
    }
  }
}
</script>

<style>
  @import url('https://fonts.googleapis.com/css?family=Exo+2');

  #app {
    font-family: 'Exo 2', 'Avenir', Helvetica, Arial, sans-serif;
    /*font-family: 'Roboto Mono', monospace;*/
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
  }

  .ui.button {
    font-family: 'Exo 2', 'Avenir', Helvetica, Arial, sans-serif;
    font-weight: normal;
  }

  .bpm-diagram {
    border: 2px solid #d0d3d9 !important;
    background: #fefefe;
    padding: 5px;
  }
</style>
