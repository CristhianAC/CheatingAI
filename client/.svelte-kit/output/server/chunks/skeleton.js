import { l as attributes, c as clsx, p as bind_props } from "./index2.js";
import { c as cn } from "./button.js";
function Skeleton($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      ref = null,
      class: className,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    $$renderer2.push(`<div${attributes({
      "data-slot": "skeleton",
      class: clsx(cn("bg-muted rounded-md animate-pulse", className)),
      ...restProps
    })}></div>`);
    bind_props($$props, { ref });
  });
}
export {
  Skeleton as S
};
