import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Persist tokens in localStorage. (We'll harden this to httpOnly cookies later.)
const ACCESS_KEY = "cp_access";
const REFRESH_KEY = "cp_refresh";

export const tokenStore = {
    getAccess: () => localStorage.getItem(ACCESS_KEY),
    getRefresh: () => localStorage.getItem(REFRESH_KEY),
    set: (access, refresh) => {
        if (access) localStorage.setItem(ACCESS_KEY, access);
        if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    },
    clear: () => {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
    },
};

const api = axios.create({
    baseURL: API_URL,
    headers: { "Content-Type": "application/json" },
});

// Attach access token on every request
api.interceptors.request.use((config) => {
    const token = tokenStore.getAccess();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- Auto-refresh on 401 (once), then retry original request ---
let isRefreshing = false;
let queue = [];

function processQueue(error, token = null) {
    queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
    queue = [];
}

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        const status = error.response?.status;

        // Don't try to refresh for the refresh endpoint itself, or the login/register endpoints
        const url = original?.url || "";
        const skipRefresh =
            url.includes("/auth/refresh") ||
            url.includes("/auth/login") ||
            url.includes("/auth/register");

        if (status === 401 && !original._retry && !skipRefresh) {
            if (isRefreshing) {
                // wait in line
                return new Promise((resolve, reject) => {
                    queue.push({ resolve, reject });
                }).then((token) => {
                    original.headers.Authorization = `Bearer ${token}`;
                    return api(original);
                });
            }

            original._retry = true;
            isRefreshing = true;

            const refresh = tokenStore.getRefresh();
            if (!refresh) {
                isRefreshing = false;
                tokenStore.clear();
                window.location.href = "/login";
                return Promise.reject(error);
            }

            try {
                const { data } = await axios.post(`${API_URL}/auth/refresh`, {
                    refreshToken: refresh,
                });
                const newAccess = data.data.accessToken;
                const newRefresh = data.data.refreshToken;
                tokenStore.set(newAccess, newRefresh);

                processQueue(null, newAccess);

                original.headers.Authorization = `Bearer ${newAccess}`;
                return api(original);
            } catch (refreshErr) {
                processQueue(refreshErr, null);
                tokenStore.clear();
                window.location.href = "/login";
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;