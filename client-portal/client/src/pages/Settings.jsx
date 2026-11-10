// src/pages/Settings.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { userApi } from "../lib/api";

const TABS = ["Profile", "Security", "Notifications"];

export default function Settings() {
  const [tab, setTab] = useState("Profile");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-h1">Settings</h1>
        <p className="page-sub">Manage your account and preferences</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`chip ${tab === t ? "chip-on" : ""}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Profile"       && <ProfileTab />}
      {tab === "Security"      && <SecurityTab />}
      {tab === "Notifications" && <NotificationsTab />}
    </div>
  );
}

function ProfileTab() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "",
    email: "", company: "",
  });
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    userApi.me().then((res) => {
      const u = res.data.data;
      setForm({
        firstName: u.firstName || "",
        lastName:  u.lastName  || "",
        phone:     u.phone     || "",
        email:     u.email     || "",
        company:   u.organization?.name || "",
      });
    });
  }, []);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setSaved(false);
    setBusy(true);
    try {
      await userApi.update({
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        phone:     form.phone.trim() || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card max-w-2xl space-y-4">
      {saved && <div className="rounded-md bg-okBg text-ok px-3 py-2 text-sm">Profile saved.</div>}
      {err   && <div className="rounded-md bg-dangerBg text-dangerText px-3 py-2 text-sm">{err}</div>}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">First name</label>
          <input className="input" value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        </div>
        <div>
          <label className="label">Last name</label>
          <input className="input" value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        </div>
      </div>

      <div>
        <label className="label">Email</label>
        <input className="input bg-slate-50" value={form.email} disabled />
        <p className="text-xs text-mute mt-1">Email cannot be changed here.</p>
      </div>

      <div>
        <label className="label">Company</label>
        <input className="input bg-slate-50" value={form.company} disabled />
        <p className="text-xs text-mute mt-1">Company is set by your organization owner.</p>
      </div>

      <div>
        <label className="label">Phone</label>
        <input className="input" value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>

      <div className="flex justify-end">
        <button className="btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function SecurityTab() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [err, setErr] = useState("");
  const [ok, setOk]   = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(""); setOk("");
    if (form.newPassword !== form.confirm) { setErr("Passwords do not match"); return; }
    if (form.newPassword.length < 8)      { setErr("New password must be at least 8 characters"); return; }
    setBusy(true);
    try {
      await userApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setOk("Password updated");
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      setTimeout(() => setOk(""), 2500);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to update password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card max-w-2xl space-y-4">
      {ok  && <div className="rounded-md bg-okBg text-ok px-3 py-2 text-sm">{ok}</div>}
      {err && <div className="rounded-md bg-dangerBg text-dangerText px-3 py-2 text-sm">{err}</div>}

      <div>
        <label className="label">Current password</label>
        <input className="input" type="password" autoComplete="current-password"
          value={form.currentPassword}
          onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">New password</label>
          <input className="input" type="password" autoComplete="new-password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
        </div>
        <div>
          <label className="label">Confirm new password</label>
          <input className="input" type="password" autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
        </div>
      </div>
      <p className="text-xs text-mute">Must be at least 8 characters.</p>
      <div className="flex justify-end">
        <button className="btn-primary" disabled={busy}>
          {busy ? "Updating…" : "Update password"}
        </button>
      </div>
    </form>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("notificationPrefs") || "null") || {
        quoteApprovals: true, invoiceReminders: true, paymentReceived: true, weeklyDigest: false,
      };
    } catch {
      return { quoteApprovals: true, invoiceReminders: true, paymentReceived: true, weeklyDigest: false };
    }
  });

  function toggle(key) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    localStorage.setItem("notificationPrefs", JSON.stringify(next));
  }

  const items = [
    ["quoteApprovals",   "Quote approvals",   "Notify me when a quote needs my approval"],
    ["invoiceReminders", "Invoice reminders", "Email reminders 3 days before due date"],
    ["paymentReceived",  "Payment received",  "Notify me when a payment clears"],
    ["weeklyDigest",     "Weekly digest",     "Summary of activity every Monday"],
  ];

  return (
    <div className="card max-w-2xl divide-y divide-line">
      {items.map(([key, label, desc]) => (
        <label key={key} className="flex items-start justify-between gap-4 py-3 cursor-pointer first:pt-0 last:pb-0">
          <div>
            <div className="font-semibold text-ink">{label}</div>
            <div className="text-sm text-mute">{desc}</div>
          </div>
          <input type="checkbox" checked={!!prefs[key]} onChange={() => toggle(key)}
            className="mt-1 h-5 w-5 rounded border-slate-300 text-brand focus:ring-brand/40" />
        </label>
      ))}
      <p className="text-xs text-mute pt-3">
        Preferences saved locally. Email sending will come in a future release.
      </p>
    </div>
  );
}