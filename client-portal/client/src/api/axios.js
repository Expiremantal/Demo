import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    // ✅ withCredentials removed
});

export const tokenStore = {
    getAccess: () => localStorage.getItem("accessToken"),
    getRefresh: () => localStorage.getItem("refreshToken"),
    set: (access, refresh) => {
        localStorage.setItem("accessToken", access);
        if (refresh) localStorage.setItem("refreshToken", refresh);
    },
    clear: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
    },
};

api.interceptors.request.use((config) => {
    const token = tokenStore.getAccess();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default api;