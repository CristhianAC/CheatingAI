import { ap as ssr_context, q as noop } from "./index2.js";
import "clsx";
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
function createEventDispatcher() {
  return noop;
}
async function tick() {
}
export {
  createEventDispatcher as c,
  onDestroy as o,
  tick as t
};
