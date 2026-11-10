// src/pages/Reports.jsx
import { useEffect, useState } from "react";
import { reportApi } from "../lib/api";
import { R } from "../lib/format";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    reportApi.summary()
      .then((res) => setData(res.data.data))
      .catch((e) => setError(e?.response?.data?.message || "Failed to load reports"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-slate-500 py-20 text-center">Loading…</div>;
  if (error)   return <div className="text-sm text-danger py-20 text-center">{error}</div>;
  if (!data)   return null;

  const chartMax = Math.max(1, ...data.revenueByMonth.map((r) => r.value));
  const totalRevenue = data.revenueByMonth.reduce((t, r) => t + r.value, 0);
  const paidCount = data.invoices.byStatus?.paid?.count || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-h1">Reports</h1>
        <p className="page-sub">Last 6 months · all clients</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi">
          <div className="kpi-label">Revenue (6 months)</div>
          <div className="kpi-value">{R(totalRevenue)}</div>
          <div className="kpi-meta">{paidCount} paid invoices</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Active clients</div>
          <div className="kpi-value">{data.activeClients}</div>
          <div className="kpi-meta">{data.invoices.totalCount} invoices total</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Payments received</div>
          <div className="kpi-value">{R(data.payments.total)}</div>
          <div className="kpi-meta">{data.payments.count} payment{data.payments.count === 1 ? "" : "s"}</div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="card">
        <h2 className="text-sm font-semibold text-ink mb-4">Revenue by month</h2>
        {data.revenueByMonth.length === 0 ? (
          <div className="text-sm text-mute py-10 text-center">
            No paid invoices yet — revenue will appear here once payments settle.
          </div>
        ) : (
          <div className="flex items-end gap-3 h-52">
            {data.revenueByMonth.map((r) => {
              const h = Math.round((r.value / chartMax) * 100);
              return (
                <div key={`${r.year}-${r.month}`} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-xs text-mute">
                    {r.value >= 1000 ? `${Math.round(r.value / 1000)}k` : r.value}
                  </div>
                  <div className="w-full bg-brand/15 rounded-t-md relative" style={{ height: "100%" }}>
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-brand rounded-t-md"
                      style={{ height: `${Math.max(h, 2)}%` }}
                      title={R(r.value)}
                    />
                  </div>
                  <div className="text-xs font-semibold text-mute">
                    {MONTHS[r.month - 1]}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Two-column breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top clients */}
        <div className="card card-flush">
          <div className="px-5 py-3 border-b border-line">
            <h2 className="text-sm font-semibold text-ink">Top clients by revenue</h2>
          </div>
          {data.topClients.length === 0 ? (
            <div className="py-8 text-center text-sm text-mute">No paid invoices yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-mute">
                <tr>
                  <th className="text-left font-medium px-5 py-2">Client</th>
                  <th className="text-right font-medium px-5 py-2">Invoices</th>
                  <th className="text-right font-medium px-5 py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topClients.map((c, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="px-5 py-3 text-slate-700">{c.client}</td>
                    <td className="px-5 py-3 text-right text-mute">{c.invoices}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-700">{R(c.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Status breakdown */}
        <div className="card">
          <h2 className="text-sm font-semibold text-ink mb-3">Status breakdown</h2>
          <div className="space-y-2 text-sm">
            <Row label="Draft invoices"       count={data.invoices.byStatus?.draft?.count || 0} />
            <Row label="Sent invoices"        count={data.invoices.byStatus?.sent?.count || 0} />
            <Row label="Paid invoices"        count={data.invoices.byStatus?.paid?.count || 0} />
            <Row label="Overdue invoices"     count={data.invoices.byStatus?.overdue?.count || 0} danger />
            <Row label="Open quotes"          count={(data.quotes.byStatus?.sent?.count || 0) + (data.quotes.byStatus?.draft?.count || 0)} />
            <Row label="Accepted quotes"      count={data.quotes.byStatus?.accepted?.count || 0} />
            <Row label="Pending requests"     count={data.requests.byStatus?.pending?.count || 0} />
            <Row label="Resolved requests"    count={data.requests.byStatus?.resolved?.count || 0} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, count, danger = false }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-line last:border-0">
      <span className="text-slate-700">{label}</span>
      <span className={`font-semibold tabular-nums ${danger ? "text-danger" : "text-ink"}`}>{count}</span>
    </div>
  );
}