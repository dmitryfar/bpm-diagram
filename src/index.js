import ProcessDiagram from "./ProcessDiagram/index.vue"

export default {
  install(Vue, options) {
    Vue.component("process-diagram", ProcessDiagram)
  }
}
