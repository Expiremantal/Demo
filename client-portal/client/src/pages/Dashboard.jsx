// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { requestApi, quoteApi, invoiceApi, notificationApi } from "../lib/api";
import { R, timeAgo } from "../lib/format";
import { adaptQuote, adaptInvoice, adaptRequest } from "../lib/adapters";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  const [pendingQuotes, setPendingQuotes] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [openRequests, setOpenRequests] = useState(0);
  const [outstanding, setOutstanding] = useState({ count: 0, amount: 0 });
  const [overdue, setOverdue] = useState({ count: 0, amount: 0 });
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      try {
        const [q, r, inv, notes] = await Promise.all([
          quoteApi.list(),
          requestApi.list(),
          invoiceApi.list(),
          notificationApi.list({ limit: 5 }),
        ]);
        if (cancelled) return;

        const quotes = (q.data.data || []).map(adaptQuote);
        const requests = (r.data.data || []).map(adaptRequest);
        const invoices = (inv.data.data || []).map(adaptInvoice);
        const notifs = notes.data.data || [];

        setPendingQuotes(quotes.filter((x) => x.rawStatus === "sent"));
        setPendingRequests(requests.filter((x) => x.rawStatus === "pending"));
        setPendingInvoices(
          invoices.filter((x) => x.rawStatus === "draft")
        );
        setOpenRequests(
          requests.filter((x) => ["Pending", "In progress"].includes(x.status)).length
        );

        const out = invoices.filter((i) =>
          ["Sent", "Overdue"].includes(i.status)
        );
        setOutstanding({
          count: out.length,
          amount: out.reduce((t, i) => t + i.amountDue, 0),
        });

        const od = invoices.filter((i) => i.status === "Overdue");
        setOverdue({
          count: od.length,
          amount: od.reduce((t, i) => t + i.amountDue, 0),
        });

        setActivity(notifs);
      } catch (err) {
        console.error("Dashboard load failed", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  if (isLoading) {
    return <div className="text-sm text-slate-500 py-20 text-center">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-h1">Dashboard</h1>
          <p className="page-sub">What needs you today</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={() => navigate("/clients")}>
            New client
          </button>
          <button className="btn-primary" onClick={() => navigate("/requests?new=1")}>
            New request
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500 py-10 text-center">Loading data…</div>
      ) : (
        <>
          {/* Three attention panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel
              title="Quotes awaiting approval"
              count={pendingQuotes.length}
              empty="All quotes approved"
              viewAll="/quotes"
            >
              {pendingQuotes.slice(0, 3).map((q) => (
                <Row
                  key={q.id}
                  title={q.number}
                  meta={`${q.client} · ${R(q.amount)}`}
                  onReview={() => navigate(`/quotes?open=${q.id}`)}
                />
              ))}
            </Panel>

            <Panel
              title="Requests requiring attention"
              count={pendingRequests.length}
              empty="Nothing needs attention"
              viewAll="/requests"
            >
              {pendingRequests.slice(0, 3).map((r) => (
                <Row
                  key={r.id}
                  title={r.title}
                  meta={`${r.client} · ${r.priority} priority`}
                  onReview={() => navigate(`/requests?open=${r.id}`)}
                />
              ))}
            </Panel>

            <Panel
              title="Invoice drafts to send"
              count={pendingInvoices.length}
              empty="No invoices waiting to send"
              viewAll="/invoices"
            >
              {pendingInvoices.slice(0, 3).map((i) => (
                <Row
                  key={i.id}
                  title={i.number}
                  meta={`${i.client} · ${R(i.amount)}`}
                  onReview={() => navigate(`/invoices?open=${i.id}`)}
                />
              ))}
            </Panel>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="kpi">
              <div className="kpi-label">Open requests</div>
              <div className="kpi-value">{openRequests}</div>
              <div className="kpi-meta">Pending or in progress</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Pending quotes</div>
              <div className="kpi-value">{pendingQuotes.length}</div>
              <div className="kpi-meta">
                {R(pendingQuotes.reduce((t, q) => t + q.amount, 0))}
              </div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Outstanding invoices</div>
              <div className="kpi-value">{outstanding.count}</div>
              <div className="kpi-meta">{R(outstanding.amount)}</div>
            </div>
            <div className="kpi kpi-danger">
              <div className="kpi-label">Overdue invoices</div>
              <div className="kpi-value">{overdue.count}</div>
              <div className="kpi-meta">{R(overdue.amount)}</div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-ink">Recent activity</h2>
              <Link to="/notifications" className="text-xs font-semibold text-brand hover:underline">
                View all
              </Link>
            </div>
            {activity.length === 0 ? (
              <div className="text-sm text-mute py-4 text-center">
                No recent activity yet.
              </div>
            ) : (
              activity.map((n) => (
                <div key={n._id} className="act">
                  <div className={`dot t-${dotTone(n.type)}`}>{dotIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-ink truncate">{n.title}</div>
                    {n.message && (
                      <div className="text-xs text-mute truncate">{n.message}</div>
                    )}
                  </div>
                  <div className="text-xs text-mute shrink-0">
                    {timeAgo(n.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- subcomponents ---------- */

function Panel({ title, count, empty, viewAll, children }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <span className="tag t-warn">{count}</span>
      </div>
      {count === 0 ? (
        <div className="text-sm text-mute py-4 text-center">{empty}</div>
      ) : (
        <>
          {children}
          {viewAll && count > 3 && (
            <Link to={viewAll} className="block text-xs font-semibold text-brand mt-2 hover:underline">
              View all {count} →
            </Link>
          )}
        </>
      )}
    </div>
  );
}

function Row({ title, meta, onReview }) {
  return (
    <div className="row">
      <div>
        <div className="row-title">{title}</div>
        <div className="row-meta">{meta}</div>
      </div>
      <button className="btn-outline btn-sm" onClick={onReview}>
        Review
      </button>
    </div>
  );
}

function dotTone(type) {
  if (["quote_accepted", "payment_received"].includes(type)) return "ok";
  if (["quote_rejected", "invoice_overdue"].includes(type)) return "bad";
  if (["quote_sent", "invoice_sent", "request_assigned"].includes(type)) return "info";
  return "info";
}

function dotIcon(type) {
  if (type === "payment_received") return "R";
  if (type === "quote_accepted") return "✓";
  if (type === "quote_rejected") return "✕";
  if (type === "invoice_sent") return "➤";
  if (type === "request_assigned") return "+";
  return "•";
}