import { w as writable } from "./index.js";
const STORAGE_KEY = "procto_exam";
function loadInitial() {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}
const examStore = writable(loadInitial());
if (typeof window !== "undefined") {
  examStore.subscribe((value) => {
    if (!value) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  });
}
export {
  examStore as e
};
