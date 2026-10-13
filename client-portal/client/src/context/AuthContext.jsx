import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import api, { tokenStore } from "../api/axios";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // On mount: if we have a token, fetch /me to hydrate user
    useEffect(() => {
        const access = tokenStore.getAccess();
        if (!access) {
            setLoading(false);
            return;
        }

        api.get("/auth/me")
            .then((res) => setUser(res.data.data.user))
            .catch(() => {
                tokenStore.clear();
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    const login = useCallback(async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        tokenStore.set(data.data.accessToken, data.data.refreshToken);
        setUser(data.data.user);
        return data.data.user;
    }, []);

    const register = useCallback(async (payload) => {
        const { data } = await api.post("/auth/register", payload);
        tokenStore.set(data.data.accessToken, data.data.refreshToken);
        setUser(data.data.user);
        return data.data.user;
    }, []);

    const logout = useCallback(async () => {
        const refresh = tokenStore.getRefresh();
        try {
            if (refresh) await api.post("/auth/logout", { refreshToken: refresh });
        } catch {
            // ignore — we're logging out anyway
        }
        tokenStore.clear();
        setUser(null);
    }, []);

    const value = useMemo(
        () => ({ user, loading, login, register, logout, isAuthenticated: !!user }),
        [user, loading, login, register, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}