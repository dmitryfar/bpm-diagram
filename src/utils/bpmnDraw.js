import { conf } from './constants'
import * as bpmnDrawHelper from './bpmn-draw-helper'
import * as bpmnIcons from './bpmn-icons'
import { Polyline } from './Polyline'
import Raphael from 'raphael'

// just import to add group function to Raphael
import * as raphaelGroup from './raphael.group'

function BpmnDraw(paper) {
  let self = this
  self.debug = false
  self.paper = paper

  self.ninjaPaper = (function (local_raphael) {
    var paper = local_raphael(1, 1, 1, 1)
    return paper
  })(Raphael.ninja());

  self.customActivityColors = null
  self.customActivityBackgroundOpacity = null

  self.elementsAdded = new Array()
  self.elementsRemoved = new Array()
  self.selectedElement = undefined
}

BpmnDraw.prototype = {
  setPaper (paper) {
    this.paper = paper
  },

  _drawPool (pool) {
    let rect = this.paper.rect(pool.x, pool.y, pool.width, pool.height)

    rect.attr({"stroke-width": 1,
      "stroke": "#000000",
      "fill": "white"
    });

    let poolName = null
    if (pool.name) {
      poolName = this.paper.text(pool.x + 14, pool.y + (pool.height / 2), pool.name).attr({
        "text-anchor" : "middle",
        "font-family" : "Arial",
        "font-size" : "12",
        "fill" : "#000000"
      })

      poolName.transform("r270")
    }
    let group = this.paper.group(rect, poolName)
    group.setAttribute('element', pool.id)

    if (pool.lanes) {
      for (let i = 0; i < pool.lanes.length; i++) {
        let lane = pool.lanes[i]
        let laneSet = this._drawLane(lane)

        let group = this.paper.group(laneSet)
        group.setAttribute('element', lane.id)
      }
    }
  },

  _drawLane(lane) {
    let rect = this.paper.rect(lane.x, lane.y, lane.width, lane.height)

    rect.attr({"stroke-width": 1,
      "stroke": "#000000",
      "fill": "white"
    })

    let laneName = null
    if (lane.name) {
      laneName = this.paper.text(lane.x + 10, lane.y + (lane.height / 2), lane.name).attr({
        "text-anchor" : "middle",
        "font-family" : "Arial",
        "font-size" : "12",
        "fill" : "#000000"
      })

      laneName.transform("r270")
    }
    return [rect, laneName]
  },

  _drawSubProcess(element) {
    let rect = this.paper.rect(element.x, element.y, element.width, element.height, 4)

    let strokeColor = bpmnDrawHelper._bpmnGetColor(element, conf.MAIN_STROKE_COLOR)

    rect.attr({"stroke-width": 1,
      "stroke": strokeColor,
      "fill": "white"
    })
    let group = this.paper.group(rect)
    group.setAttribute('element', element.id)
  },

  _drawTransaction(element) {
    let rect = this.paper.rect(element.x, element.y, element.width, element.height, 4)

    let strokeColor = bpmnDrawHelper._bpmnGetColor(element, conf.MAIN_STROKE_COLOR)

    rect.attr({"stroke-width": 1,
      "stroke": strokeColor,
      "fill": "white"
    })

    let borderRect = this.paper.rect(element.x + 2, element.y + 2, element.width - 4, element.height -4, 4)

    borderRect.attr({"stroke-width": 1,
      "stroke": "black",
      "fill": "none"
    })
    let group = this.paper.group(rect, borderRect)
    group.setAttribute('element', element.id)
  },

  _drawEventSubProcess(element) {
    let rect = this.paper.rect(element.x, element.y, element.width, element.height, 4)
    let strokeColor = bpmnDrawHelper._bpmnGetColor(element, conf.MAIN_STROKE_COLOR)

    rect.attr({"stroke-width": 1,
      "stroke": strokeColor,
      "stroke-dasharray": ".",
      "fill": "white"
    })
    let group = this.paper.group(rect)
    group.setAttribute('element', element.id)
  },

  _drawAdhocSubProcess(element) {
    let rect = this.paper.rect(element.x, element.y, element.width, element.height, 4)

    let strokeColor = bpmnDrawHelper._bpmnGetColor(element, conf.MAIN_STROKE_COLOR)

    rect.attr({"stroke-width": 1,
      "stroke": strokeColor,
      "fill": "white"
    })

    let text = this.paper.text(element.x + (element.width / 2), element.y + element.height - 8).attr({
      "text-anchor" : "middle",
      "font-family" : "Arial",
      "font-size" : 20,
      "text" : "~",
      "fill" : "#373e48"
    })
    let group = this.paper.group(rect, text)
    group.setAttribute('element', element.id)
  },

  /* *** Start-Stop Events *** */

  _drawStartEvent (element) {
    let eventSet = this._drawEvent(element, conf.NORMAL_STROKE, 15)

    let hoverElement = this._addHoverLogic(element, "circle", conf.MAIN_STROKE_COLOR)

    let group = this.paper.group(eventSet, hoverElement)
    group.setAttribute('element', element.id)

    let self = this
    hoverElement.click(function() {
      self._zoom(true)
    })
  },

  _drawEndEvent (element) {
    let eventSet = this._drawEvent(element, conf.ENDEVENT_STROKE, 14);

    let hoverElement = this._addHoverLogic(element, "circle", conf.MAIN_STROKE_COLOR);

    let group = this.paper.group(eventSet, hoverElement)
    group.setAttribute('element', element.id)

    let self = this
    hoverElement.click(function() {
      self._zoom(false);
    });
  },
  _drawEvent (element, strokeWidth, radius) {
    let x = element.x + (element.width / 2);
    let y = element.y + (element.height / 2);

    let circle = this.paper.circle(x, y, radius);

    let strokeColor = bpmnDrawHelper._bpmnGetColor(element, conf.MAIN_STROKE_COLOR);

    // Fill
    let eventFillColor = this._determineCustomFillColor(element, "#ffffff");

    // Opacity
    let eventOpacity = 1.0;
    if (this.customActivityBackgroundOpacity) {
      eventOpacity = this.customActivityBackgroundOpacity;
    }


    if (element.interrupting === undefined || element.interrupting) {
      circle.attr({
        "stroke-width": strokeWidth,
        "stroke": strokeColor,
        "fill": eventFillColor,
        "fill-opacity": eventOpacity,
      });

    } else {
      circle.attr({
        "stroke-width": strokeWidth,
        "stroke": strokeColor,
        "stroke-dasharray": ".",
        "fill": eventFillColor,
        "fill-opacity": eventOpacity,
      });
    }

    circle.id = element.id;

    let iconSet = bpmnIcons._drawEventIcon(this.paper, element);

    return [circle, iconSet];
  },

  /* *** Task *** */

  _drawServiceTask(element) {
    let rectSet = this._drawTask(element);
    let iconSet = null;
    if (element.taskType === "mail")
    {
      iconSet = bpmnIcons._drawSendTaskIcon(this.paper, element.x + 4, element.y + 4);
    }
    else if (element.taskType === "camel")
    {
      iconSet = bpmnIcons._drawCamelTaskIcon(this.paper, element.x + 4, element.y + 4);
    }
    else if (element.taskType === "mule")
    {
      iconSet = bpmnIcons._drawMuleTaskIcon(this.paper, element.x + 4, element.y + 4);
    }
    else if (element.taskType === "http")
    {
      iconSet = bpmnIcons._drawHttpTaskIcon(this.paper, element.x + 4, element.y + 4);
    }
    else if (element.taskType === "shell")
    {
      iconSet = bpmnIcons._drawShellTaskIcon(this.paper, element.x + 4, element.y + 4);
    }
    else if (element.taskType === "dmn") {
      iconSet = bpmnIcons._drawDecisionTaskIcon(this.paper, element.x + 4, element.y + 4);
    }
    else if (element.stencilIconId)
    {
      iconSet = this.paper.image("../service/stencilitem/" + element.stencilIconId + "/icon", element.x + 4, element.y + 4, 16, 16);
    }
    else
    {
      iconSet = bpmnIcons._drawServiceTaskIcon(this.paper, element.x + 4, element.y + 4);
    }
    let hoverElement = this._addHoverLogic(element, "rect", conf.ACTIVITY_STROKE_COLOR);

    let group = this.paper.group(rectSet, iconSet, hoverElement)
    group.setAttribute('element', element.id)
  },
  _drawHttpServiceTask(element) {
    let rectSet = this._drawTask(element);
    let iconSet = bpmnIcons._drawHttpTaskIcon(this.paper, element.x + 4, element.y + 4);
    let hoverElement = this._addHoverLogic(element, "rect", conf.ACTIVITY_STROKE_COLOR);

    let group = this.paper.group(rectSet, iconSet, hoverElement)
    group.setAttribute('element', element.id)
  },
  _drawCallActivity(element) {
    let strokeWidth = conf.CALL_ACTIVITY_STROKE;

    let d = strokeWidth%2 == 1 ? 0.5 : 0;

    let width = element.width - (conf.CALL_ACTIVITY_STROKE / 2);
    let height = element.height - (conf.CALL_ACTIVITY_STROKE / 2);

    let rect = this.paper.rect(element.x + d, element.y + d, width + d, height + d, 4);

    // Stroke
    let strokeColor = bpmnDrawHelper._bpmnGetColor(element, conf.ACTIVITY_STROKE_COLOR);

    // Fill
    let callActivityFillColor = this._determineCustomFillColor(element, conf.ACTIVITY_FILL_COLOR);

    // Opacity
    let callActivityOpacity = 1.0;
    if (this.customActivityBackgroundOpacity) {
      callActivityOpacity = this.customActivityBackgroundOpacity;
    }

    rect.attr({
      "stroke-width": strokeWidth,
      "stroke": strokeColor,
      "fill": callActivityFillColor,
      "fill-opacity": callActivityOpacity
    });

    rect.id = element.id;

    let multilineText = null
    if (element.name) {
      multilineText = this._drawMultilineText(element.name, element.x, element.y, element.width, element.height, "middle", "middle", 11);
      multilineText.transform("T" + 0 + "," + (multilineText.getBBox().y*0 - conf.TEXT_PADDING*2));
      console.log("---, %o", multilineText);
    }
    //let iconSet = bpmnIcons._drawScriptTaskIcon(this.paper, element.x + 4, element.y + 4);
    let hoverElement = this._addHoverLogic(element, "rect", conf.ACTIVITY_STROKE_COLOR);

    let group = this.paper.group(rect, multilineText, /*iconSet,*/ hoverElement)
    group.setAttribute('element', element.id)
  },
  _drawScriptTask(element) {
    let rectSet = this._drawTask(element);
    let iconSet = bpmnIcons._drawScriptTaskIcon(this.paper, element.x + 4, element.y + 4);
    let hoverElement = this._addHoverLogic(element, "rect", conf.ACTIVITY_STROKE_COLOR);
    let group = this.paper.group(rectSet, iconSet, hoverElement)
    group.setAttribute('element', element.id)
  },
  _drawUserTask (element) {
    let rectSet = this._drawTask(element);
    let iconSet = bpmnIcons._drawUserTaskIcon(this.paper, element.x + 4, element.y + 4);
    let hoverElement = this._addHoverLogic(element, "rect", conf.ACTIVITY_STROKE_COLOR);
    let group = this.paper.group(rectSet, iconSet, hoverElement)
    group.setAttribute('element', element.id)
  },
  _drawBusinessRuleTask(element) {
    let rectSet = this._drawTask(element);
    let iconSet = bpmnIcons._drawBusinessRuleTaskIcon(this.paper, element.x + 4, element.y + 4);
    let hoverElement = this._addHoverLogic(element, "rect", conf.ACTIVITY_STROKE_COLOR);
    let group = this.paper.group(rectSet, iconSet, hoverElement)
    group.setAttribute('element', element.id)
  },
  _drawManualTask(element) {
    let rectSet = this._drawTask(element);
    let iconSet = bpmnIcons._drawManualTaskIcon(this.paper, element.x + 4, element.y + 4);
    let hoverElement = this._addHoverLogic(element, "rect", conf.ACTIVITY_STROKE_COLOR);
    let group = this.paper.group(rectSet, iconSet, hoverElement)
    group.setAttribute('element', element.id)
  },
  _drawSendTask(element) {
    let rectSet = this._drawTask(element);
    let iconSet = bpmnIcons._drawSendTaskIcon(this.paper, element.x + 4, element.y + 4);
    let hoverElement = this._addHoverLogic(element, "rect", conf.ACTIVITY_STROKE_COLOR);
    let group = this.paper.group(rectSet, iconSet, hoverElement)
    group.setAttribute('element', element.id)
  },
  _drawReceiveTask(element) {
    let rectSet = this._drawTask(element);
    let iconSet = bpmnIcons._drawReceiveTaskIcon(this.paper, element.x, element.y);
    let hoverElement = this._addHoverLogic(element, "rect", conf.ACTIVITY_STROKE_COLOR);
    let group = this.paper.group(rectSet, iconSet, hoverElement)
    group.setAttribute('element', element.id)
  },
  _drawTask (element) {
    let rectAttrs = {};

    // Stroke
    let strokeColor = bpmnDrawHelper._bpmnGetColor(element, conf.ACTIVITY_STROKE_COLOR);
    rectAttrs['stroke'] = strokeColor;

    let strokeWidth;
    if (strokeColor === conf.ACTIVITY_STROKE_COLOR) {
      strokeWidth = conf.TASK_STROKE;
    } else {
      strokeWidth = conf.TASK_HIGHLIGHT_STROKE;
    }
    let d = strokeWidth%2 == 1 ? 0.5 : 0;

    let width = element.width - (strokeWidth / 2);
    let height = element.height - (strokeWidth / 2);

    let rect = this.paper.rect(element.x + d, element.y + d, width + d, height + d, 4);
    rectAttrs['stroke-width'] = strokeWidth;

    // Fill
    let fillColor = this._determineCustomFillColor(element, conf.ACTIVITY_FILL_COLOR);
    rectAttrs['fill'] = fillColor;

    // Opacity
    if (this.customActivityBackgroundOpacity) {
      rectAttrs['fill-opacity'] = this.customActivityBackgroundOpacity;
    }

    rect.attr(rectAttrs);
    rect.id = element.id;

    let multilineText = null;
    if (element.name) {
      multilineText = this._drawMultilineText(element.name, element.x, element.y, element.width, element.height, "middle", "middle", 11);
    }
    return [rect, multilineText]
  },

  /* *** Gateway *** */

  _drawExclusiveGateway (element)
  {
    let rhombus = this._drawGateway(element);
    let quarterWidth = element.width / 4;
    let quarterHeight = element.height / 4;

    let iks = this.paper.path(
      "M" + (element.x + quarterWidth + 3) + " " + (element.y + quarterHeight + 3) +
      "L" + (element.x + 3 * quarterWidth - 3) + " " + (element.y + 3 * quarterHeight - 3) +
      "M" + (element.x + quarterWidth + 3) + " " + (element.y + 3 * quarterHeight - 3) +
      "L" + (element.x + 3 * quarterWidth - 3) + " " + (element.y + quarterHeight + 3)
    );

    let strokeColor = bpmnDrawHelper._bpmnGetColor(element, conf.MAIN_STROKE_COLOR);

    // Fill
    let gatewayFillColor = this._determineCustomFillColor(element, conf.ACTIVITY_FILL_COLOR);

    // Opacity
    let gatewayOpacity = 1.0;
    if (this.customActivityBackgroundOpacity) {
      gatewayOpacity = this.customActivityBackgroundOpacity;
    }


    iks.attr({"stroke-width": 3, "stroke": strokeColor, "fill": gatewayFillColor, "fill-opacity": gatewayOpacity});

    let hoverElement = this._addHoverLogic(element, "rhombus", conf.MAIN_STROKE_COLOR);
    let group = this.paper.group(rhombus, iks, hoverElement)
    group.setAttribute('element', element.id)
  },
  _drawParallelGateway(element) {
    let rhombus = this._drawGateway(element);

    let strokeColor = bpmnDrawHelper._bpmnGetColor(element, conf.MAIN_STROKE_COLOR);

    let path1 = this.paper.path("M 6.75,16 L 25.75,16 M 16,6.75 L 16,25.75");

    // Fill
    let gatewayFillColor = this._determineCustomFillColor(element, conf.ACTIVITY_FILL_COLOR);

    // Opacity
    let gatewayOpacity = 1.0;
    if (this.customActivityBackgroundOpacity) {
      gatewayOpacity = this.customActivityBackgroundOpacity;
    }

    path1.attr({
      "stroke-width": 3,
      "stroke": strokeColor,
      "fill": gatewayFillColor,
      "fill-opacity": gatewayOpacity
    });

    path1.transform("T" + (element.x + 4) + "," + (element.y + 4));

    let hoverElement = this._addHoverLogic(element, "rhombus", conf.MAIN_STROKE_COLOR);
    let group = this.paper.group(rhombus, path1, hoverElement)
    group.setAttribute('element', element.id)
  },
  _drawInclusiveGateway(element) {
    let rhombus = this._drawGateway(element);

    let strokeColor = bpmnDrawHelper._bpmnGetColor(element, conf.MAIN_STROKE_COLOR);

    let circle1 = this.paper.circle(element.x + (element.width / 2), element.y + (element.height / 2), 9.75);

    // Fill
    let gatewayFillColor = this._determineCustomFillColor(element, conf.ACTIVITY_FILL_COLOR);

    // Opacity
    let gatewayOpacity = 1.0;
    if (this.customActivityBackgroundOpacity) {
      gatewayOpacity = this.customActivityBackgroundOpacity;
    }

    circle1.attr({
      "stroke-width": 2.5,
      "stroke": strokeColor,
      "fill": gatewayFillColor,
      "fill-opacity": gatewayOpacity
    });

    let hoverElement = this._addHoverLogic(element, "rhombus", conf.MAIN_STROKE_COLOR);
    let group = this.paper.group(rhombus, circle1, hoverElement)
    group.setAttribute('element', element.id)
  },
  _drawEventGateway(element){
    let rhombus = this._drawGateway(element);

    let strokeColor = bpmnDrawHelper._bpmnGetColor(element, conf.MAIN_STROKE_COLOR);

    let circle1 = this.paper.circle(element.x + (element.width / 2), element.y + (element.height / 2), 10.4);

    // Fill
    let gatewayFillColor = this._determineCustomFillColor(element, conf.ACTIVITY_FILL_COLOR);

    // Opacity
    let gatewayOpacity = 1.0;
    if (this.customActivityBackgroundOpacity) {
      gatewayOpacity = this.customActivityBackgroundOpacity;
    }

    circle1.attr({
      "stroke-width": 0.5,
      "stroke": strokeColor,
      "fill": gatewayFillColor,
      "fill-opacity": gatewayOpacity
    });

    let circle2 = this.paper.circle(element.x + (element.width / 2), element.y + (element.height / 2), 11.7);
    circle2.attr({
      "stroke-width": 0.5,
      "stroke": strokeColor,
      "fill": gatewayFillColor,
      "fill-opacity": gatewayOpacity
    });

    let path1 = this.paper.path("M 20.327514,22.344972 L 11.259248,22.344216 L 8.4577203,13.719549 L 15.794545,8.389969 L 23.130481,13.720774 L 20.327514,22.344972 z");
    path1.attr({
      "stroke-width": 1.39999998,
      "stroke": strokeColor,
      "fill": gatewayFillColor,
      "fill-opacity": gatewayOpacity,
      "stroke-linejoin": "bevel"
    });

    path1.transform("T" + (element.x + 4) + "," + (element.y + 4));

    let hoverElement = this._addHoverLogic(element, "rhombus", conf.MAIN_STROKE_COLOR);
    let group = this.paper.group(rhombus, circle1, circle2, path1, hoverElement)
    group.setAttribute('element', element.id)
  },
  _drawGateway (element)
  {
    let strokeColor = bpmnDrawHelper._bpmnGetColor(element, conf.MAIN_STROKE_COLOR);

    let rhombus = this.paper.path("M" + element.x + " " + (element.y + (element.height / 2)) +
      "L" + (element.x + (element.width / 2)) + " " + (element.y + element.height) +
      "L" + (element.x + element.width) + " " + (element.y + (element.height / 2)) +
      "L" + (element.x + (element.width / 2)) + " " + element.y + "z"
    );

    // Fill
    let gatewayFillColor = this._determineCustomFillColor(element, conf.ACTIVITY_FILL_COLOR);

    // Opacity
    let gatewayOpacity = 1.0;
    if (this.customActivityBackgroundOpacity) {
      gatewayOpacity = this.customActivityBackgroundOpacity;
    }

    rhombus.attr("stroke-width", 2);
    rhombus.attr("stroke", strokeColor);
    rhombus.attr("fill", gatewayFillColor);
    rhombus.attr("fill-opacity", gatewayOpacity);

    rhombus.id = element.id;

    return rhombus;
  },

  /* *** Events *** */

  _drawBoundaryEvent(element) {
     let x = element.x + (element.width / 2);
     let y = element.y + (element.height / 2);

     let circle = this.paper.circle(x, y, 15);

     let strokeColor = bpmnDrawHelper._bpmnGetColor(element, conf.MAIN_STROKE_COLOR);

    if (element.cancelActivity)  {
      circle.attr({
        "stroke-width": 1,
        "stroke": strokeColor,
        "fill": "white"
      });

    } else {
      circle.attr({
        "stroke-width": 1,
        "stroke-dasharray": ".",
        "stroke": strokeColor,
        "fill": "white"
      });
    }

    let innerCircle = this.paper.circle(x, y, 12);

    if (element.cancelActivity)  {
      innerCircle.attr({"stroke-width": 1,
        "stroke": strokeColor,
        "fill": "none"
      });

    } else {
      innerCircle.attr({
        "stroke-width": 1,
        "stroke-dasharray": ".",
        "stroke": strokeColor,
        "fill": "none"
      });
    }

    let iconSet = bpmnIcons._drawEventIcon(this.paper, element);
    let hoverElement = this._addHoverLogic(element, "circle", conf.MAIN_STROKE_COLOR);

    let group = this.paper.group(circle, innerCircle, iconSet, hoverElement)
    group.setAttribute('element', element.id)

    circle.id = element.id;
    innerCircle.id = element.id + "_inner";
  },
  _drawIntermediateCatchEvent(element) {
     let x = element.x + (element.width / 2);
     let y = element.y + (element.height / 2);

     let circle = this.paper.circle(x, y, 15);

     let strokeColor = bpmnDrawHelper._bpmnGetColor(element, conf.MAIN_STROKE_COLOR);

    circle.attr({"stroke-width": 1,
      "stroke": strokeColor,
      "fill": "white"
    });

     let innerCircle = this.paper.circle(x, y, 12);

    innerCircle.attr({"stroke-width": 1,
      "stroke": strokeColor,
      "fill": "none"
    });

    let iconSet = bpmnIcons._drawEventIcon(this.paper, element);
    let hoverElement = this._addHoverLogic(element, "circle", conf.MAIN_STROKE_COLOR);

    let group = this.paper.group(circle, innerCircle, iconSet, hoverElement)
    group.setAttribute('element', element.id)

    circle.id = element.id;
    innerCircle.id = element.id + "_inner";
  },
  _drawThrowEvent(element) {
    let x = element.x + (element.width / 2);
    let y = element.y + (element.height / 2);

    let circle = this.paper.circle(x, y, 15);

    let strokeColor = bpmnDrawHelper._bpmnGetColor(element,conf. MAIN_STROKE_COLOR);

    circle.attr({"stroke-width": 1,
      "stroke": strokeColor,
      "fill": "white"
    });

    let innerCircle = this.paper.circle(x, y, 12);

    innerCircle.attr({"stroke-width": 1,
      "stroke": strokeColor,
      "fill": "none"
    });

    let iconSet = bpmnIcons._drawEventIcon(this.paper, element);
    let hoverElement = this._addHoverLogic(element, "circle", conf.MAIN_STROKE_COLOR);

    let group = this.paper.group(circle, innerCircle, iconSet, hoverElement)
    group.setAttribute('element', element.id)

    circle.id = element.id;
    innerCircle.id = element.id + "_inner";
  },

  /* *** Text *** */

  _drawMultilineText(text, x, y, boxWidth, boxHeight, horizontalAnchor, verticalAnchor, fontSize) {
    if (!text || text == "")
    {
      return null;
    }

    let textBoxX, textBoxY;
    let width = boxWidth - (2 * conf.TEXT_PADDING);

    if (horizontalAnchor === "middle")
    {
      textBoxX = x + (boxWidth / 2);
    }
    else if (horizontalAnchor === "start")
    {
      textBoxX = x;
    }

    textBoxY = y + (boxHeight / 2);

    let dx = textBoxX % 2 == 1 ? 0.5 : 0;
    let dy = textBoxY % 2 == 1 ? 0.5 : 0;

    let t = this.paper.text(textBoxX + conf.TEXT_PADDING + dx, textBoxY + conf.TEXT_PADDING + dy).attr({
      "text-anchor" : horizontalAnchor,
      "font-family" : "Arial",
      "font-size" : fontSize,
      "fill" : "#373e48"
    });

    let abc = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    t.attr({
      "text" : abc
    });
    let letterWidth = t.getBBox().width / abc.length;

    t.attr({
      "text" : text
    });
    let removedLineBreaks = text.split("\n");
    let xx = 0, s = [];
    for (let r = 0; r < removedLineBreaks.length; r++)
    {
      let words = removedLineBreaks[r].split(" ");
      for ( let i = 0; i < words.length; i++) {

        let l = words[i].length;
        if (xx + (l * letterWidth) > width) {
          s.push("\n");
          xx = 0;
        }
        xx += l * letterWidth;
        s.push(words[i] + " ");
      }
      s.push("\n");
      xx = 0;
    }
    t.attr({
      "text" : s.join("")
    });

    if (verticalAnchor && verticalAnchor === "top")
    {
      t.attr({"y": y + (t.getBBox().height/2) + conf.TEXT_PADDING + dy});
    }

    if (horizontalAnchor === "middle") {
      t.attr({
        "x": x + boxWidth / 2
      });
    }

    if (this.debug) {

      let boxStyle = {stroke: "LightSteelBlue", "stroke-width": 1.0, "stroke-dasharray": "- "};
      let textAreaCX = x + boxWidth/2;
      let textAreaCY = y + boxHeight/2;
      // let dot1 = this.paper.ellipse(x + boxWidth / 2, y, 3, 3).attr({"stroke-width": 0, fill: "purple", stroke: "none"});
      let dotLeftTop = this.paper.ellipse(x, y, 3, 3).attr({"stroke-width": 0, fill: "lightSteelBlue", stroke: "none"}).hide();
      let dotCenter = this.paper.ellipse(textAreaCX, textAreaCY, 3, 3).attr({fill: "lightcoral", stroke: "none"}).hide();
      let rect = this.paper.rect(x, y, boxWidth, boxHeight).attr(boxStyle).attr({"stroke":"coral"}).hide();
      let rectText = this.paper.rect(t.getBBox().x, t.getBBox().y, t.getBBox().width, t.getBBox().height).attr({"stroke-width": 1}).attr(boxStyle).hide();
      let debugSet = this.paper.set();
      dotCenter.node.id = text
      debugSet.push(dotLeftTop, dotCenter, rect, rectText);
      debugSet.show();

    }

    return t;
  },

  _drawTextAnnotation(element) {
    let x = element.x
    let y = element.y
    let lineLength = 18;
    let waypoints = [
      // {x: x + lineLength, y},
      // {x, y},
      // {x, y: y + element.height},
      // {x: x + lineLength, y: y + element.height},
      // {x: x + lineLength, y: y + element.height  - 1},
      // {x: x + 1, y: y + element.height  - 1},
      // {x: x + 1, y: y + 1},
    ]
    // let polyline = new Polyline(element.id, waypoints, conf.NORMAL_STROKE, this.paper);
    // polyline.element = this.paper.path(polyline.path);
    // let path1 = polyline.path;
    // polyline.element.attr({"stroke":"#585858"});
    let path1 = this.paper.path("M20,1 L1,1 L1," + element.height + " L20,"  + element.height);

    let strokeWidth = conf.NORMAL_STROKE;
    path1.attr({
      "stroke-width": strokeWidth,
      "stroke": "#585858",
      "fill": "none"
    });

    let d = strokeWidth%2 == 1 ? 0.5 : 0;

     let annotation = this.paper.set();
    annotation.push(path1);

    annotation.transform("T" + (element.x + d) + "," + (element.y + d));

    if (element.text) {
      let dotLeftTop = this.paper.ellipse(element.x, element.y, 4, 4).attr({"stroke-width": 1, fill: "none", stroke: "red"}).show();
      this._drawMultilineText(element.text, element.x, element.y, element.width, element.height, "start", "top", 11);
    }
  },

  /* *** Connection *** */

  _drawFlow(flow) {
    let polyline = new Polyline(flow.id, flow.waypoints, conf.SEQUENCEFLOW_STROKE, this.paper);

    let strokeColor = bpmnDrawHelper._bpmnGetColor(flow, conf.MAIN_STROKE_COLOR);

    polyline.element = this.paper.path(polyline.path);
    polyline.element.attr({"stroke-width":conf.SEQUENCEFLOW_STROKE});
    polyline.element.attr({"stroke":strokeColor});

    polyline.element.id = flow.id;

    let lastLineIndex = polyline.getLinesCount() - 1;
    let line = polyline.getLine(lastLineIndex);

    if (line == undefined) return;

    if (flow.type == "connection" && flow.conditions)
    {
       let middleX = (line.x1 + line.x2) / 2;
       let middleY = (line.y1 + line.y2) / 2;
       let image = this.paper.image("../editor/images/condition-flow.png", middleX - 8, middleY - 8, 16, 16);
    }

     let polylineInvisible = new Polyline(flow.id, flow.waypoints, conf.SEQUENCEFLOW_STROKE, this.paper);

    polylineInvisible.element = this.paper.path(polyline.path);
    polylineInvisible.element.attr({
      "opacity": 0,
      "stroke-width": 8,
      "stroke" : "#000000"
    });

    this._showTip(polylineInvisible.element.node, flow);

    polylineInvisible.element.mouseover(function() {
      this.paper.getById(polyline.element.id).attr({"stroke":"blue"});
    });

    polylineInvisible.element.mouseout(function() {
      this.paper.getById(polyline.element.id).attr({"stroke":"#585858"});
    });

    let self = this
    polylineInvisible.element.click(function (event, x, y) {
      self.click(event, flow, x, y)
    })

    let arrowHead = this._drawArrowHead(line);

    let group = this.paper.group(polyline.element, polylineInvisible.element, arrowHead)
    group.setAttribute('element', flow.id)
  },
  _drawAssociation(flow) {
    let self = this
    let polyline = new Polyline(flow.id, flow.waypoints, conf.ASSOCIATION_STROKE, this.paper);

    polyline.element = this.paper.path(polyline.path);
    polyline.element.attr({"stroke-width": conf.ASSOCIATION_STROKE});
    polyline.element.attr({"stroke-dasharray": ". "});
    polyline.element.attr({"stroke":"#585858"});

    polyline.element.id = flow.id;

    let polylineInvisible = new Polyline(flow.id, flow.waypoints, conf.ASSOCIATION_STROKE, this.paper);

    polylineInvisible.element = this.paper.path(polyline.path);
    polylineInvisible.element.attr({
      "opacity": 0,
      "stroke-width": 8,
      "stroke" : "#000000"
    });

    this._showTip(polylineInvisible.element.node, flow);

    polylineInvisible.element.mouseover(function() {
      self.paper.getById(polyline.element.id).attr({"stroke":"blue"});
    });

    polylineInvisible.element.mouseout(function() {
      self.paper.getById(polyline.element.id).attr({"stroke":"#585858"});
    });
  },
  _drawArrowHead(line, connectionType) {
    let doubleArrowWidth = 2 * conf.ARROW_WIDTH;

    let arrowHead = this.paper.path("M0 0L-" + (conf.ARROW_WIDTH / 2 + .5) + " -" + doubleArrowWidth + "L" + (conf.ARROW_WIDTH/2 + .5) + " -" + doubleArrowWidth + "z");

    // anti smoothing
    if (this.strokeWidth%2 == 1)
      line.x2 += .5, line.y2 += .5;

    arrowHead.transform("t" + line.x2 + "," + line.y2 + "");
    arrowHead.transform("...r" + Raphael.deg(line.angle - Math.PI / 2) + " " + 0 + " " + 0);

    arrowHead.attr("fill", "#585858");

    arrowHead.attr("stroke-width", conf.SEQUENCEFLOW_STROKE);
    arrowHead.attr("stroke", "#585858");

    return arrowHead;
  },

  /* ******************************************* */

  _determineCustomFillColor (element, defaultColor) {

    let color;

    // By name
    if (this.customActivityColors && this.customActivityColors[element.name]) {
      color = this.customActivityColors[element.name];
    }

    if (color !== null && color !== undefined) {
      return color;
    }

    // By id
    if (this.customActivityColors && this.customActivityColors[element.id]) {
      color = this.customActivityColors[element.id];
    }

    if (color !== null && color !== undefined) {
      return color;
    }

    return defaultColor;
  },

  /* ******************************************* */

  _addHoverLogic (element, type, defaultColor) {
    let self = this
    let strokeColor = bpmnDrawHelper._bpmnGetColor(element, defaultColor);
    let topBodyRect = null;
    if (type === "rect")
    {
      topBodyRect = this.paper.rect(element.x, element.y, element.width, element.height);
    }
    else if (type === "circle")
    {
      let x = element.x + (element.width / 2);
      let y = element.y + (element.height / 2);
      topBodyRect = this.paper.circle(x, y, 15);
    }
    else if (type === "rhombus")
    {
      topBodyRect = this.paper.path("M" + element.x + " " + (element.y + (element.height / 2)) +
        "L" + (element.x + (element.width / 2)) + " " + (element.y + element.height) +
        "L" + (element.x + element.width) + " " + (element.y + (element.height / 2)) +
        "L" + (element.x + (element.width / 2)) + " " + element.y + "z"
      );
    }

    let opacity = 0;
    let fillColor = "#ffffff";
    // if (jQuery.inArray(element.id, elementsAdded) >= 0)
    if (this.elementsAdded.includes(element.id))
    {
      opacity = 0.2;
      fillColor = "green";
    }

    if (this.elementsRemoved.includes(element.id))
    {
      opacity = 0.2;
      fillColor = "red";
    }

    topBodyRect.attr({
      "opacity": opacity,
      "stroke" : "none",
      "fill" : fillColor
    });
    this._showTip(topBodyRect.node, element);

    topBodyRect.mouseover(function () {
      self.paper.getById(element.id).attr({"stroke": conf.HOVER_COLOR});
    });

    topBodyRect.mouseout(function () {
      self.paper.getById(element.id).attr({"stroke": bpmnDrawHelper._bpmnGetColor(element, defaultColor)});
    });

    topBodyRect.click(function (event, x, y) {
      self.click && self.click(event, element, x, y);
    });

    if (this.isDebuggerEnabled) {
      if (element.current || element.brokenExecutions) {
        topBodyRect.click(function () {
          if (self.selectedElement != element.id) {
            self.paper.getById(element.id).attr({"stroke": "green"});
            self.selectedElement = element.id;
            self.paper.getById(element.id).attr({"stroke": "red"});
            self._executionClicked(element.id);
          } else {
            self.selectedElement = undefined;
            self.paper.getById(element.id).attr({"stroke": "green"});

            throw new Error('FIXME: there is used angular')
            let scope = angular.element(document.querySelector('#bpmnModel')).scope();
            modelDiv.attr("selected-execution", scope.model.processInstance.id);
            scope.model.selectedExecution = scope.model.processInstance.id;
            angular.element(document.querySelector('#variablesUi')).scope().loadVariables();
          }
        });
      }
    }
    return topBodyRect
  },
  _showTip (htmlNode, element) {
    // console.warn('_showTip', htmlNode, element)
  },

  connectFlowToActivity (sourceRef, targetRef, waypoints) {
    let source = this.paper.getById(sourceRef);
    let target = this.paper.getById(targetRef);
    if (source == null || target == null) {
      return null;
    }
    let bbSource = source.getBBox()
    let bbTarget = target.getBBox()

    let path = [];
    let newWaypoints = [];
    for(let i = 0; i < waypoints.length; i++){
      let pathType = ""
      if (i==0)
        pathType = "M";
      else
        pathType = "L";

      path.push([pathType, waypoints[i].x, waypoints[i].y]);
      newWaypoints.push({x:waypoints[i].x, y:waypoints[i].y});
    }

    let ninjaPathSource = this.ninjaPaper.path(source.realPath);
    let ninjaPathTarget = this.ninjaPaper.path(target.realPath);
    let ninjaBBSource = ninjaPathSource.getBBox();
    let ninjaBBTarget = ninjaPathTarget.getBBox();

    // set target of the flow to the center of the taskObject
    let newPath = path;
    let originalSource = {x: newPath[0][1], y: newPath[0][2]};
    let originalTarget = {x: newPath[newPath.length-1][1], y: newPath[newPath.length-1][2]};
    newPath[0][1] = ninjaBBSource.x + (ninjaBBSource.x2 - ninjaBBSource.x ) / 2;
    newPath[0][2] = ninjaBBSource.y + (ninjaBBSource.y2 - ninjaBBSource.y ) / 2;
    newPath[newPath.length-1][1] = ninjaBBTarget.x + (ninjaBBTarget.x2 - ninjaBBTarget.x ) / 2;
    newPath[newPath.length-1][2] = ninjaBBTarget.y + (ninjaBBTarget.y2 - ninjaBBTarget.y ) / 2;

    let ninjaPathFlowObject = this.ninjaPaper.path(newPath);
    let ninjaBBFlowObject = ninjaPathFlowObject.getBBox();

    let intersectionsSource = Raphael.pathIntersection(ninjaPathSource.realPath, ninjaPathFlowObject.realPath);
    let intersectionsTarget = Raphael.pathIntersection(ninjaPathTarget.realPath, ninjaPathFlowObject.realPath);
    let intersectionSource = intersectionsSource.pop();
    let intersectionTarget = intersectionsTarget.pop();

    if (intersectionSource != undefined) {
      if (this.gebug) {
        let diameter = 5;
        let dotOriginal = this.paper.ellipse(originalSource.x, originalSource.y, diameter, diameter).attr({"fill": '#ffffff', "stroke": 'violet'});
        let dot = this.paper.ellipse(intersectionSource.x, intersectionSource.y, diameter, diameter).attr({"fill": '#ffffff', "stroke": 'skyblue'});
      }

      newWaypoints[0].x = intersectionSource.x;
      newWaypoints[0].y = intersectionSource.y;
    }
    if (intersectionTarget != undefined) {
      if (this.gebug) {
        let diameter = 5;
        let dotOriginal = this.paper.ellipse(originalTarget.x, originalTarget.y, diameter, diameter).attr({"fill": '#ffffff', "stroke": 'red'});
        let dot = this.paper.ellipse(intersectionTarget.x, intersectionTarget.y, diameter, diameter).attr({"fill": '#ffffff', "stroke": 'blue'});
      }

      newWaypoints[newWaypoints.length-1].x = intersectionTarget.x;
      newWaypoints[newWaypoints.length-1].y = intersectionTarget.y;
    }

    this.ninjaPaper.clear();
    return newWaypoints;
  },

  _zoom(zoomIn)
  {
    const {width, height} = this.paper.getSize()
    let canvasWidth = width
    let canvasHeight = height

    let tmpCanvasWidth, tmpCanvasHeight;
    if (zoomIn)
    {
      tmpCanvasWidth = canvasWidth * (1.0/0.90);
      tmpCanvasHeight = canvasHeight * (1.0/0.90);
    }
    else
    {
      tmpCanvasWidth = canvasWidth * (1.0/1.10);
      tmpCanvasHeight = canvasHeight * (1.0/1.10);
    }

    if (tmpCanvasWidth != canvasWidth || tmpCanvasHeight != canvasHeight)
    {
      canvasWidth = tmpCanvasWidth;
      canvasHeight = tmpCanvasHeight;
      this.paper.setSize(canvasWidth, canvasHeight);
      //this.paper.setViewBox(0, 0, canvasWidth, canvasHeight, false)
    }
  }
}

export default BpmnDraw
