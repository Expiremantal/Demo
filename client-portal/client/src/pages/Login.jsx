import { useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const MAX_EMAIL = 254;
const MAX_PASSWORD = 128;

function safeRedirect(target) {
    if (typeof target !== "string") return "/";
    if (!target.startsWith("/") || target.startsWith("//")) return "/";
    return target;
}

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const submitLock = useRef(false);

    const submit = async (e) => {
        e.preventDefault();
        if (submitLock.current || busy) return;

        setError("");
        const email = form.email.trim().toLowerCase();
        const password = form.password;

        if (!email || email.length > MAX_EMAIL) {
            setError("Please enter a valid email address.");
            return;
        }
        if (!password || password.length > MAX_PASSWORD) {
            setError("Invalid credentials.");
            return;
        }

        submitLock.current = true;
        setBusy(true);
        try {
            await login(email, password);
            navigate(safeRedirect(location.state?.from?.pathname), { replace: true });
        } catch (err) {
            const status = err?.response?.status;
            if (status === 401) setError("Invalid email or password.");
            else if (status === 429) setError("Too many attempts. Please try again later.");
            else setError("Unable to sign in right now. Please try again.");
        } finally {
            setBusy(false);
            setTimeout(() => { submitLock.current = false; }, 800);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-card p-8">
                <div className="text-navy font-semibold text-lg tracking-wide mb-6">
                    Brand
                </div>
                <h1 className="text-2xl font-semibold text-slate-900 mb-1">
                    Welcome back
                </h1>
                <p className="text-sm text-slate-500 mb-6">Sign in to Client Portal</p>

                {error && (
                    <div
                        role="alert"
                        aria-live="polite"
                        className="mb-4 rounded-md bg-dangerBg text-dangerText px-3 py-2 text-sm"
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4" noValidate>
                    <div>
                        <label htmlFor="login-email" className="label">Email</label>
                        <input
                            id="login-email"
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            maxLength={MAX_EMAIL}
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="input"
                        />
                    </div>

                    <div>
                        <label htmlFor="login-password" className="label">Password</label>
                        <input
                            id="login-password"
                            name="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            maxLength={MAX_PASSWORD}
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="input"
                        />
                    </div>

                    <button type="submit" disabled={busy} className="btn-primary w-full">
                        {busy ? "Signing in…" : "Sign in"}
                    </button>
                </form>

                <p className="mt-6 text-sm text-slate-500 text-center">
                    No account?{" "}
                    <Link to="/register" className="text-brand font-medium hover:text-brand-dark">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}