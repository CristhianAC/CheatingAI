import { w as writable } from "./index.js";
import { a as toast } from "./toast-state.svelte.js";
const submissions = writable([]);
const activeJob = writable(null);
function showToast(message, type = "success", duration = 3500) {
  const options = { duration };
  if (type === "error") toast.error(message, options);
  else if (type === "info") toast.info(message, options);
  else toast.success(message, options);
}
function showError(message) {
  showToast(message, "error", 5e3);
}
export {
  activeJob as a,
  showToast as b,
  showError as c,
  submissions as s
};
