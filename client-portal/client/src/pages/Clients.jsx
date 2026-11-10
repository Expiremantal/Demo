// src/pages/Clients.jsx
import { useEffect, useMemo, useState } from "react";
import { clientApi } from "../lib/api";
import { adaptClient } from "../lib/adapters";
import Can from "../components/Can";
import Tag from "../components/Tag";

export default function Clients() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", address: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await clientApi.list();
      setRows((data.data || []).map(adaptClient));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((c) =>
      (c.name + " " + c.email).toLowerCase().includes(s)
    );
  }, [rows, q]);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!form.name.trim()) { setErr("Name is required"); return; }
    setBusy(true);
    try {
      await clientApi.create({
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        address: form.address.trim() || null,
      });
      setForm({ name: "", email: "", phone: "", company: "", address: "" });
      setShowCreate(false);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to create client");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-h1">Clients</h1>
          <p className="page-sub">{rows.length} account{rows.length === 1 ? "" : "s"}</p>
        </div>
        <Can permission="client:create" fallback={
          <button className="btn-primary opacity-50 cursor-not-allowed" disabled>New client</button>
        }>
          <button className="btn-primary" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? "Cancel" : "New client"}
          </button>
        </Can>
      </div>

      {showCreate && (
        <form onSubmit={submit} className="card space-y-4">
          {err && <div className="rounded-md bg-dangerBg text-dangerText px-3 py-2 text-sm">{err}</div>}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input className="input" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Karoo Mining Supplies" />
            </div>
            <div>
              <label className="label">Company</label>
              <input className="input" value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="flex justify-end">
            <button className="btn-primary" disabled={busy}>
              {busy ? "Creating…" : "Create client"}
            </button>
          </div>
        </form>
      )}

      <div className="card card-flush">
        <div className="p-4 border-b border-line">
          <input className="input max-w-md" placeholder="Filter by name or email"
            value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-mute">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-mute">
            {q ? `No clients match "${q}"` : "No clients yet. Create one above."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-mute">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Client</th>
                  <th className="text-left font-medium px-5 py-3">Contact</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t border-line hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-ink">{c.name}</div>
                      {c.company !== "—" && (
                        <div className="text-xs text-mute">{c.company}</div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-slate-700">{c.email}</div>
                      <div className="text-xs text-mute">{c.phone}</div>
                    </td>
                    <td className="px-5 py-3"><Tag status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}