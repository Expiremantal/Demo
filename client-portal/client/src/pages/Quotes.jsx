// src/pages/Quotes.jsx
import { useEffect, useState } from "react";
import { quoteApi, clientApi, productApi } from "../lib/api";
import { adaptQuote, adaptClient, adaptProduct } from "../lib/adapters";
import { R, fmtDate } from "../lib/format";
import Tag from "../components/Tag";

const TABS = [
  { key: "all",       label: "All" },
  { key: "draft",     label: "Draft" },
  { key: "sent",      label: "Awaiting" },
  { key: "accepted",  label: "Accepted" },
  { key: "converted", label: "Converted" },
  { key: "rejected",  label: "Rejected" },
];

export default function Quotes() {
  const [tab, setTab] = useState("all");
  const [rows, setRows] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [cForm, setCForm] = useState({ client: "", expiresAt: "" });
  const [cErr, setCErr] = useState("");
  const [cBusy, setCBusy] = useState(false);

  const [detail, setDetail] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [q, c] = await Promise.all([quoteApi.list(), clientApi.list()]);
      setRows((q.data.data || []).map(adaptQuote));
      setClients((c.data.data || []).map(adaptClient));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = tab === "all" ? rows : rows.filter((r) => r.rawStatus === tab);
  const total = filtered.reduce((t, r) => t + r.amount, 0);

  async function createQuote(e) {
    e.preventDefault();
    setCErr("");
    if (!cForm.client) { setCErr("Select a client"); return; }
    setCBusy(true);
    try {
      const { data } = await quoteApi.create({
        client: cForm.client,
        expiresAt: cForm.expiresAt || null,
      });
      setCForm({ client: "", expiresAt: "" });
      setShowCreate(false);
      await load();
      setDetail({ id: data.data._id });  // open drawer immediately
    } catch (e) {
      setCErr(e?.response?.data?.message || "Failed to create quote");
    } finally {
      setCBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-h1">Quotes</h1>
          <p className="page-sub">
            {filtered.length} quote{filtered.length === 1 ? "" : "s"} · {R(total)}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? "Cancel" : "New quote"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createQuote} className="card space-y-4">
          {cErr && <div className="rounded-md bg-dangerBg text-dangerText px-3 py-2 text-sm">{cErr}</div>}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Client</label>
              <select className="input" value={cForm.client}
                onChange={(e) => setCForm({ ...cForm, client: e.target.value })}>
                <option value="">Select a client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Expires at (optional)</label>
              <input className="input" type="date" value={cForm.expiresAt}
                onChange={(e) => setCForm({ ...cForm, expiresAt: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end">
            <button className="btn-primary" disabled={cBusy}>
              {cBusy ? "Creating…" : "Create draft quote"}
            </button>
          </div>
        </form>
      )}

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
          <div className="py-10 text-center text-sm text-mute">No quotes in this view</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-mute">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Quote</th>
                  <th className="text-left font-medium px-5 py-3">Client</th>
                  <th className="text-left font-medium px-5 py-3">Issued</th>
                  <th className="text-right font-medium px-5 py-3">Amount</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q.id} className="border-t border-line hover:bg-slate-50 cursor-pointer"
                      onClick={() => setDetail({ id: q.id })}>
                    <td className="px-5 py-3 font-semibold text-ink">{q.number}</td>
                    <td className="px-5 py-3 text-slate-700">{q.client}</td>
                    <td className="px-5 py-3 text-mute">{fmtDate(q.issuedAt)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-700">{R(q.amount)}</td>
                    <td className="px-5 py-3"><Tag status={q.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detail && (
        <QuoteDrawer
          quoteId={detail.id}
          onClose={() => setDetail(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

/* ---------- Quote detail drawer ---------- */

function QuoteDrawer({ quoteId, onClose, onChanged }) {
  const [quote, setQuote] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [itemForm, setItemForm] = useState({
    product: "", description: "", quantity: "1", unitPrice: "",
  });
  const [itemBusy, setItemBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [q, p] = await Promise.all([
        quoteApi.get(quoteId),
        productApi.list(),
      ]);
      setQuote(q.data.data);
      setProducts((p.data.data || []).map(adaptProduct));
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load quote");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [quoteId]);

  function selectProduct(id) {
    const p = products.find((x) => x.id === id);
    if (!p) return setItemForm({ ...itemForm, product: "", description: "", unitPrice: "" });
    setItemForm({
      product: id,
      description: p.name,
      quantity: "1",
      unitPrice: String(p.price),
    });
  }

  async function addItem(e) {
    e.preventDefault();
    if (!itemForm.description.trim() || !itemForm.quantity || !itemForm.unitPrice) {
      setErr("Fill description, quantity, and unit price");
      return;
    }
    setItemBusy(true);
    setErr("");
    try {
      await quoteApi.addItem(quoteId, {
        product: itemForm.product || null,
        description: itemForm.description.trim(),
        quantity: Number(itemForm.quantity),
        unitPrice: Number(itemForm.unitPrice),
      });
      setItemForm({ product: "", description: "", quantity: "1", unitPrice: "" });
      await load();
      onChanged?.();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to add item");
    } finally {
      setItemBusy(false);
    }
  }

  async function removeItem(itemId) {
    try {
      await quoteApi.removeItem(quoteId, itemId);
      await load();
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to remove item");
    }
  }

  async function runAction(action) {
    try {
      if (action === "send")    await quoteApi.send(quoteId);
      if (action === "accept")  await quoteApi.accept(quoteId);
      if (action === "reject")  await quoteApi.reject(quoteId);
      if (action === "convert") {
        const { data } = await quoteApi.convertToInvoice(quoteId);
        alert(`Invoice ${data.data.invoiceNumber} created`);
      }
      await load();
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.message || `Failed to ${action}`);
    }
  }

  const isDraft = quote?.status === "draft";
  const isSent = quote?.status === "sent" || quote?.status === "viewed";
  const isAccepted = quote?.status === "accepted";
  const canSend = isDraft && quote?.lineItems?.length > 0;

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex justify-end" onClick={onClose}>
      <div
        className="bg-white w-full max-w-xl h-full overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-line px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-ink">
              {quote?.quoteNumber || "Loading…"}
            </h2>
            <p className="text-sm text-mute">{quote?.client?.name || ""}</p>
          </div>
          <button className="btn-outline btn-sm" onClick={onClose}>Close</button>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <div className="py-10 text-center text-sm text-mute">Loading…</div>
          ) : err ? (
            <div className="rounded-md bg-dangerBg text-dangerText px-3 py-2 text-sm">{err}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs uppercase text-mute">Status</div>
                  <div className="mt-1"><Tag status={capitalize(quote.status)} /></div>
                </div>
                <div>
                  <div className="text-xs uppercase text-mute">Expires</div>
                  <div className="mt-1 text-ink">{fmtDate(quote.expiresAt)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-mute">Total</div>
                  <div className="mt-1 text-ink font-semibold">{R(quote.total)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-mute">
                    {quote.convertedToInvoice ? "Invoice" : "VAT"}
                  </div>
                  <div className="mt-1 text-ink font-semibold">
                    {quote.convertedToInvoice ? "Converted" : R(quote.taxAmount)}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-ink mb-2">Line items</h3>
                {(!quote.lineItems || quote.lineItems.length === 0) ? (
                  <div className="text-sm text-mute py-4 text-center border border-dashed border-line rounded-lg">
                    No line items yet{isDraft ? ". Add one below." : "."}
                  </div>
                ) : (
                  <div className="border border-line rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-mute">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">Description</th>
                          <th className="text-right px-3 py-2 font-medium">Qty</th>
                          <th className="text-right px-3 py-2 font-medium">Unit</th>
                          <th className="text-right px-3 py-2 font-medium">Total</th>
                          {isDraft && <th className="px-3 py-2"></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {quote.lineItems.map((it) => (
                          <tr key={it._id} className="border-t border-line">
                            <td className="px-3 py-2 text-ink">{it.description}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-mute">{it.quantity}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-mute">{R(it.unitPrice)}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-ink font-semibold">{R(it.lineTotal)}</td>
                            {isDraft && (
                              <td className="px-3 py-2 text-right">
                                <button className="text-xs text-danger hover:underline"
                                  onClick={() => removeItem(it._id)}>
                                  Remove
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-3 flex justify-end text-sm text-mute">
                  Subtotal {R(quote.subtotal)} · VAT {R(quote.taxAmount)} ·{" "}
                  <span className="text-ink font-semibold ml-1">Total {R(quote.total)}</span>
                </div>
              </div>

              {isDraft && (
                <form onSubmit={addItem} className="border-t border-line pt-4 space-y-3">
                  <h3 className="text-sm font-semibold text-ink">Add line item</h3>
                  <div>
                    <label className="label">From product (optional)</label>
                    <select className="input" value={itemForm.product}
                      onChange={(e) => selectProduct(e.target.value)}>
                      <option value="">Custom line</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {R(p.price)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <input className="input" value={itemForm.description}
                      onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Quantity</label>
                      <input className="input" type="number" min="0.01" step="0.01"
                        value={itemForm.quantity}
                        onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Unit price</label>
                      <input className="input" type="number" min="0" step="0.01"
                        value={itemForm.unitPrice}
                        onChange={(e) => setItemForm({ ...itemForm, unitPrice: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button className="btn-primary" disabled={itemBusy}>
                      {itemBusy ? "Adding…" : "Add item"}
                    </button>
                  </div>
                </form>
              )}

              {/* Action bar per state */}
              <div className="border-t border-line pt-4 flex justify-end gap-2 flex-wrap">
                {isDraft && (
                  <>
                    <button
                      className="btn-primary"
                      disabled={!canSend}
                      onClick={() => runAction("send")}
                    >
                      Send quote
                    </button>
                    {!canSend && (
                      <span className="text-xs text-mute self-center">
                        Add at least one line item to send
                      </span>
                    )}
                  </>
                )}

                {isSent && (
                  <>
                    <button className="btn-outline" onClick={() => runAction("reject")}>
                      Reject
                    </button>
                    <button className="btn-primary" onClick={() => runAction("accept")}>
                      Accept
                    </button>
                  </>
                )}

                {isAccepted && (
                  <button className="btn-primary" onClick={() => runAction("convert")}>
                    Convert to invoice
                  </button>
                )}

                {quote.convertedToInvoice && (
                  <div className="text-sm text-mute self-center">
                    Converted to invoice ✓
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}