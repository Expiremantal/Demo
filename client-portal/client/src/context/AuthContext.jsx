// src/context/AuthContext.jsx
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import api, { tokenStore } from "../api/axios";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // On mount: hydrate user if we already have an access token
    useEffect(() => {
        const access = tokenStore.getAccess();
        if (!access) {
            setIsLoading(false);
            return;
        }
        api.get("/auth/me")
            .then((res) => setUser(res.data.data.user))
            .catch(() => {
                tokenStore.clear();
                setUser(null);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const login = useCallback(async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        const { user, accessToken, refreshToken } = data.data;
        tokenStore.set(accessToken, refreshToken);   // ← tokenStore.set
        setUser(user);
        return user;
    }, []);

    const register = useCallback(async (payload) => {
        const { data } = await api.post("/auth/register", payload);
        const { user, accessToken, refreshToken } = data.data;
        tokenStore.set(accessToken, refreshToken);   // ← tokenStore.set
        setUser(user);
        return user;
    }, []);

    const logout = useCallback(async () => {
        const refresh = tokenStore.getRefresh();
        try {
            if (refresh) await api.post("/auth/logout", { refreshToken: refresh });
        } catch {
            /* ignore */
        }
        tokenStore.clear();
        setUser(null);
    }, []);

    const value = useMemo(
        () => ({
            user,
            isLoading,
            login,
            register,
            logout,
            isAuthenticated: !!user,
        }),
        [user, isLoading, login, register, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return ctx;
}