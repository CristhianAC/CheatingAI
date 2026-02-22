import { w as writable } from "./index.js";
const submissions = writable([]);
const toast = writable(null);
const activeJob = writable(null);
let toastTimer;
function showToast(message, type = "success", duration = 3500) {
  clearTimeout(toastTimer);
  toast.set({ message, type });
  toastTimer = setTimeout(() => toast.set(null), duration);
}
function showError(message) {
  showToast(message, "error", 5e3);
}
export {
  activeJob as a,
  showError as b,
  submissions as s,
  toast as t
};
