import {conf} from "./constants";

export function _bpmnGetColor (element, defaultColor) {
  let strokeColor;

  if (!element) {
    return defaultColor;
  }

  if (element.current) {
    strokeColor = conf.CURRENT_COLOR;
  } else if (element.completed) {
    strokeColor = conf.COMPLETED_COLOR;
  } else {
    strokeColor = defaultColor;
  }

  return strokeColor;
}
