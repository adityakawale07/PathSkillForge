import axios from "axios";
const api = axios.create({ baseURL: "/api" });
api.interceptors.request.use((c) => { const t = localStorage.getItem("token"); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });
api.interceptors.response.use((r) => r, (e) => {
  if (e.response?.status === 401) { localStorage.clear(); location.href = "/login"; }
  return Promise.reject(new Error(e.response?.data?.message || "Something went wrong"));
});
export const mb = (b) => (b / 1024 / 1024).toFixed(1) + " MB";
export default api;
