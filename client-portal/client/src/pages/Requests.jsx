// src/pages/Requests.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { requestApi, clientApi } from "../lib/api";
import { adaptRequest, adaptClient } from "../lib/adapters";
import { fmtDate } from "../lib/format";
import Can from "../components/Can";
import Tag from "../components/Tag";

const PRIORITY_TONE = { Low: "t-info", Normal: "t-info", High: "t-warn", Urgent: "t-bad" };

export default function Requests() {
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(params.get("new") === "1");
  const [form, setForm] = useState({
    title: "", client: "", priority: "normal", dueDate: "", description: "",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [r, c] = await Promise.all([requestApi.list(), clientApi.list()]);
      setRows((r.data.data || []).map(adaptRequest));
      setClients((c.data.data || []).map(adaptClient));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const pending = rows.filter((r) => r.status === "Pending").length;
    return { total: rows.length, pending };
  }, [rows]);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!form.title.trim() || !form.client) {
      setErr("Add a title and choose a client.");
      return;
    }
    setBusy(true);
    try {
      await requestApi.create({
        title: form.title.trim(),
        client: form.client,
        priority: form.priority,
        dueDate: form.dueDate || null,
        description: form.description || null,
      });
      setForm({ title: "", client: "", priority: "normal", dueDate: "", description: "" });
      setOpen(false);
      setParams({});
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to create request");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-h1">Requests</h1>
          <p className="page-sub">{stats.pending} pending of {stats.total} total</p>
        </div>
        <Can permission="request:create">
          <button className="btn-primary" onClick={() => setOpen((v) => !v)}>
            {open ? "Cancel" : "New request"}
          </button>
        </Can>
      </div>

      {open && (
        <form onSubmit={submit} className="card space-y-4">
          {err && <div className="rounded-md bg-dangerBg text-dangerText px-3 py-2 text-sm">{err}</div>}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Title</label>
              <input className="input" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Short summary" />
            </div>
            <div>
              <label className="label">Client</label>
              <select className="input" value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}>
                <option value="">Select a client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="label">Due date</label>
              <input className="input" type="date" value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Details (optional)</label>
            <textarea className="input min-h-[80px]" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex justify-end">
            <button className="btn-primary" disabled={busy}>
              {busy ? "Creating…" : "Create request"}
            </button>
          </div>
        </form>
      )}

      <div className="card card-flush">
        {loading ? (
          <div className="py-10 text-center text-sm text-mute">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-mute">No requests yet. Create one above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-mute">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Request</th>
                  <th className="text-left font-medium px-5 py-3">Client</th>
                  <th className="text-left font-medium px-5 py-3">Due</th>
                  <th className="text-left font-medium px-5 py-3">Priority</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-line hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-ink">{r.title}</div>
                      <div className="text-xs text-mute">{r.number}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-700">{r.client}</td>
                    <td className="px-5 py-3 text-mute">{fmtDate(r.dueDate)}</td>
                    <td className="px-5 py-3">
                      <span className={`tag ${PRIORITY_TONE[r.priority]}`}>{r.priority}</span>
                    </td>
                    <td className="px-5 py-3"><Tag status={r.status} /></td>
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