// src/pages/Payments.jsx
import { useEffect, useMemo, useState } from "react";
import { invoiceApi, clientApi } from "../lib/api";
import { adaptInvoice } from "../lib/adapters";
import { R, fmtDate, fmtDateTime } from "../lib/format";
import Tag from "../components/Tag";

const METHODS = ["eft", "card", "manual", "debit_order"];
const TABS = [
  { key: "all",      label: "All" },
  { key: "received", label: "Received" },
  { key: "pending",  label: "Pending" },
  { key: "failed",   label: "Failed" },
];

export default function Payments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  async function load() {
    setLoading(true);
    try {
      // Fetch all invoices, then fetch payments for each
      const { data } = await invoiceApi.list();
      const invoices = data.data || [];
      const allPayments = [];
      await Promise.all(
        invoices.map(async (inv) => {
          try {
            const p = await invoiceApi.listPayments(inv._id);
            (p.data.data || []).forEach((payment) => {
              allPayments.push({
                ...payment,
                invoiceNumber: inv.invoiceNumber,
                invoiceId: inv._id,
                clientName: inv.client?.name || "—",
              });
            });
          } catch { /* skip */ }
        })
      );
      allPayments.sort((a, b) => new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt));
      setRows(allPayments);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = tab === "all" ? rows : rows.filter((r) => r.status === tab);

  const stats = useMemo(() => {
    const received = rows.filter((r) => r.status === "received").reduce((t, p) => t + p.amount, 0);
    const pending  = rows.filter((r) => r.status === "pending").reduce((t, p) => t + p.amount, 0);
    const failed   = rows.filter((r) => r.status === "failed").reduce((t, p) => t + p.amount, 0);
    return { received, pending, failed };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-h1">Payments</h1>
        <p className="page-sub">Track what's in, what's due, what failed</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi">
          <div className="kpi-label">Received</div>
          <div className="kpi-value">{R(stats.received)}</div>
          <div className="kpi-meta">
            {rows.filter((r) => r.status === "received").length} payment(s)
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Pending</div>
          <div className="kpi-value">{R(stats.pending)}</div>
          <div className="kpi-meta">
            {rows.filter((r) => r.status === "pending").length} payment(s)
          </div>
        </div>
        <div className="kpi kpi-danger">
          <div className="kpi-label">Failed</div>
          <div className="kpi-value">{R(stats.failed)}</div>
          <div className="kpi-meta">
            {rows.filter((r) => r.status === "failed").length} payment(s)
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`chip ${tab === t.key ? "chip-on" : ""}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card card-flush">
        {loading ? (
          <div className="py-10 text-center text-sm text-mute">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-mute">No payments in this view</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[820px]">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-mute">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Payment</th>
                  <th className="text-left font-medium px-5 py-3">Invoice</th>
                  <th className="text-left font-medium px-5 py-3">Client</th>
                  <th className="text-left font-medium px-5 py-3">Method</th>
                  <th className="text-left font-medium px-5 py-3">Date</th>
                  <th className="text-right font-medium px-5 py-3">Amount</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p._id} className="border-t border-line hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-ink">{p.paymentNumber}</td>
                    <td className="px-5 py-3 text-slate-700">{p.invoiceNumber}</td>
                    <td className="px-5 py-3 text-slate-700">{p.clientName}</td>
                    <td className="px-5 py-3 text-mute capitalize">{p.method.replace("_", " ")}</td>
                    <td className="px-5 py-3 text-mute">{fmtDate(p.paidAt || p.createdAt)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-700">{R(p.amount)}</td>
                    <td className="px-5 py-3"><Tag status={capitalize(p.status)} /></td>
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

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}