import { w as writable } from "./index.js";
const authStore = writable({
  token: null,
  user: null,
  role: null
});
export {
  authStore as a
};
