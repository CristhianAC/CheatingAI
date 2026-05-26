import { f as spread_props } from "./index2.js";
import { I as Icon } from "./Icon.js";
function Circle_check($$renderer, $$props) {
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    ["circle", { "cx": "12", "cy": "12", "r": "10" }],
    ["path", { "d": "m9 12 2 2 4-4" }]
  ];
  Icon($$renderer, spread_props([{ name: "circle-check" }, props, { iconNode }]));
}
export {
  Circle_check as C
};
