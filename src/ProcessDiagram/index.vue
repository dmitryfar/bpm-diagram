<template>
    <div class="model-preview-wrapper" :class="viewClass">
        <div ref="bpmnModel" :style="canvasStyles" />
    </div>
</template>

<script>
  import Raphael from 'raphael'
  import BpmnDraw from '../utils/bpmnDraw'

  export default {
    name: 'process-diagram',
    props: {
      modelType: {
        type: String,
        required: true
      },
      viewClass: {
        type: String,
        required: false
      },
      processDefinition: {
        type: Object,
        validator(data) {
          return data != null && data.elements != null && data.elements.length > 0 && (data.pools == null || data.pools.length > 0)
        }
      }
    },
    data() {
      return {
        bpmnDraw: new BpmnDraw(),
        canvasWidth: null,
        canvasHeight: null,
        viewBoxWidth: null,
        viewBoxHeight: null,
        paper: null,
        isDebuggerEnabled: false,
        bpmnData: null
      }
    },
    computed: {
      processDefinitionId: {
        get() {
          return (this.processDefinition != null) ? this.processDefinition.id : null
        }
      },
      canvasStyles() {
        return {
          // height: `${this.canvasHeight}px`,
          // width: `${this.canvasWidth}px`
        }
      }
    },
    watch: {
      processDefinition: function (newValue, oldValue) {
        this.updateDiagram();
      }
    },
    mounted() {
      this.bpmnDraw.click = this.clickElement
      this.updateDiagram()
    },
    methods: {
      clickElement(event, element, x, y) {
        this.$emit('click-element', { event, element, x, y })
      },
      updateDiagram() {
        // the way to customize
        this.bpmnDraw.customActivityColors = null
        this.bpmnDraw.customActivityBackgroundOpacity = null

        // clear before
        if (this.paper != null) {
          this.paper.clear();
        }

        this.showDiagram()
      },

      showDiagram() {
        if (this.processDefinition == null) {
          this.canvasWidth = 0
          this.canvasHeight = 0
          this.viewBoxWidth = 0
          this.viewBoxHeight = 0
          this.paper && this.paper.remove()
          this.paper = null
          return
        }
        const data = this.processDefinition

        this.canvasWidth = data.diagramWidth
        this.canvasHeight = data.diagramHeight + 50;

        if (this.modelType == 'design') {
          this.canvasWidth += 20;
        } else {
          this.canvasWidth += 30;
        }

        this.viewBoxWidth = parseInt(this.canvasWidth)
        this.viewBoxHeight = parseInt(this.canvasHeight)

        if (this.modelType == 'design') {
          // TODO: fix offset
          let headerBarHeight = 170
          let offsetY = 0
          // if (jQuery(window).height() > (this.canvasHeight + headerBarHeight)) {
          //   offsetY = (jQuery(window).height() - headerBarHeight - this.canvasHeight) / 2;
          // }

          if (offsetY > 50) {
            offsetY = 50;
          }

          // jQuery('#bpmnModel').css('marginTop', offsetY)
        }

        if (this.paper == null) {
          this.paper = Raphael(this.$refs.bpmnModel, this.canvasWidth, this.canvasHeight)
        } else {
          this.paper.setSize(this.canvasWidth, this.canvasHeight)
        }
        this.paper.setViewBox(0, 0, this.viewBoxWidth, this.viewBoxHeight, false)
        this.paper.renderfix()

        this.bpmnDraw.setPaper(this.paper)

        if (data.pools) {
          for (let i = 0; i < data.pools.length; i++) {
            let pool = data.pools[i]
            this.bpmnDraw._drawPool(pool)
          }
        }

        let modelElements = data.elements

        for (var i = 0; i < modelElements.length; i++) {
          const element = modelElements[i]
          const drawFunction = "_draw" + element.type
          try {
            this._bpmnDraw(drawFunction)(element)
          } catch (e) {
            console.error('Error on draw %o: %o, element: %o', drawFunction, e, element)
          }
          if (this.isDebuggerEnabled) {
            this.bpmnDraw._drawBreakpoint(element)

            if (element.brokenExecutions) {
              for (let j = 0; j < element.brokenExecutions.length; j++) {
                this.bpmnDraw._drawContinueExecution(element.x + 25 + j * 10, element.y - 15, element.brokenExecutions[j], element.id)
              }
            }
          }
        }

        if (data.flows) {
          for (var i = 0; i < data.flows.length; i++) {
            var flow = data.flows[i]
            if (flow.type === 'sequenceFlow') {
              // correct waypoints to draw better connection
              var newWaypoints = this.bpmnDraw.connectFlowToActivity(flow.sourceRef, flow.targetRef, flow.waypoints)
              if (newWaypoints) {
                flow.waypoints = newWaypoints
              }
              this.bpmnDraw._drawFlow(flow)
            } else if (flow.type === 'association') {
              this.bpmnDraw._drawAssociation(flow)
            }
          }
        }
      },

      _bpmnDraw(drawFunction) {
        if (!this.bpmnDraw.__proto__.hasOwnProperty(drawFunction)) {
          throw new Error('bpmnDraw function "' + drawFunction + '" is undefined')
        }
        let self = this
        return function () {
          return self.bpmnDraw[drawFunction].apply(self.bpmnDraw, arguments)
        }
      }

    }
  }
</script>

<style scoped>
    .model-preview-wrapper {
        overflow: auto;

        /* border: 1px solid #909399; */
        border: 1px solid #d7d8da;
        background: #fefefe;
    }
</style>