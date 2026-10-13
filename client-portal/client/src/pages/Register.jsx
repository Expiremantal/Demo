import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const MAX = { name: 60, email: 254, password: 128, phone: 20 };

const PASSWORD_RULES = [
    { test: (v) => v.length >= 12, msg: "At least 12 characters" },
    { test: (v) => /[A-Z]/.test(v), msg: "One uppercase letter" },
    { test: (v) => /[a-z]/.test(v), msg: "One lowercase letter" },
    { test: (v) => /\d/.test(v), msg: "One number" },
    { test: (v) => /[^A-Za-z0-9]/.test(v), msg: "One symbol" },
];

function validate(form) {
    const errors = {};
    if (!form.firstName.trim()) errors.firstName = "First name is required.";
    else if (form.firstName.length > MAX.name) errors.firstName = "Too long.";

    if (!form.lastName.trim()) errors.lastName = "Last name is required.";
    else if (form.lastName.length > MAX.name) errors.lastName = "Too long.";

    const email = form.email.trim();
    if (!email) errors.email = "Email is required.";
    else if (email.length > MAX.email) errors.email = "Email is too long.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        errors.email = "Enter a valid email address.";

    const pw = form.password;
    if (!pw) errors.password = "Password is required.";
    else {
        const failed = PASSWORD_RULES.filter((r) => !r.test(pw)).map((r) => r.msg);
        if (failed.length) errors.password = `Password needs: ${failed.join(", ")}.`;
    }

    if (form.phone) {
        const phone = form.phone.trim();
        if (!/^\+?[0-9\s\-()]{7,20}$/.test(phone))
            errors.phone = "Enter a valid phone number.";
    }
    return errors;
}

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        firstName: "", lastName: "", email: "", password: "", phone: "",
    });
    const [errors, setErrors] = useState({});
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (busy) return;
        setError("");
        const nextErrors = validate(form);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;

        const payload = {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim().toLowerCase(),
            password: form.password,
            phone: form.phone.trim() || undefined,
        };

        setBusy(true);
        try {
            await register(payload);
            navigate("/", { replace: true });
        } catch (err) {
            const data = err?.response?.data;
            const status = err?.response?.status;
            const allowed = ["firstName", "lastName", "email", "password", "phone"];
            if (data?.errors && typeof data.errors === "object") {
                const safe = {};
                for (const k of allowed) {
                    const v = data.errors[k];
                    if (typeof v === "string") safe[k] = v;
                }
                if (Object.keys(safe).length) setErrors(safe);
            }
            if (status === 409) setError("An account with these details already exists.");
            else if (status === 429) setError("Too many attempts. Please try again later.");
            else setError("Unable to create account right now. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    const field = (name, label, type = "text", extra = {}) => (
        <div>
            <label htmlFor={`reg-${name}`} className="label">{label}</label>
            <input
                id={`reg-${name}`}
                name={name}
                type={type}
                value={form[name]}
                onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                maxLength={MAX[name] ?? 200}
                className="input"
                {...extra}
            />
            {errors[name] && (
                <p className="text-xs text-dangerText mt-1">{errors[name]}</p>
            )}
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-canvas px-4 py-8">
            <div className="w-full max-w-md bg-white rounded-xl shadow-card p-8">
                <div className="text-navy font-semibold text-lg tracking-wide mb-6">
                    Brand
                </div>
                <h1 className="text-2xl font-semibold text-slate-900 mb-1">
                    Create account
                </h1>
                <p className="text-sm text-slate-500 mb-6">Start using Client Portal</p>

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
                    <div className="grid grid-cols-2 gap-3">
                        {field("firstName", "First name", "text", {
                            autoComplete: "given-name", required: true,
                        })}
                        {field("lastName", "Last name", "text", {
                            autoComplete: "family-name", required: true,
                        })}
                    </div>
                    {field("email", "Email", "email", {
                        autoComplete: "email", required: true,
                    })}
                    {field("password", "Password", "password", {
                        autoComplete: "new-password", required: true,
                    })}
                    {field("phone", "Phone (optional)", "tel", {
                        autoComplete: "tel",
                    })}

                    <p className="text-xs text-slate-500">
                        Password must be 12+ characters and include uppercase,
                        lowercase, a number, and a symbol.
                    </p>

                    <button type="submit" disabled={busy} className="btn-primary w-full">
                        {busy ? "Creating…" : "Create account"}
                    </button>
                </form>

                <p className="mt-6 text-sm text-slate-500 text-center">
                    Have an account?{" "}
                    <Link to="/login" className="text-brand font-medium hover:text-brand-dark">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}