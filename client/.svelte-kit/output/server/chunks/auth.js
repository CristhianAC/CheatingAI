import { w as writable } from "./index.js";
const STORAGE_KEY = "procto_auth";
const authStore = writable({
  token: null,
  user: null,
  role: null
});
function logout() {
  authStore.set({ token: null, user: null, role: null });
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
export {
  authStore as a,
  logout as l
};
