// src/pages/Invoices.jsx
import { useEffect, useState } from "react";
import { invoiceApi, clientApi, productApi } from "../lib/api";
import { adaptInvoice, adaptClient, adaptProduct } from "../lib/adapters";
import { R, fmtDate, fmtDateTime } from "../lib/format";
import Tag from "../components/Tag";

const TABS = [
  { key: "all",       label: "All" },
  { key: "draft",     label: "Draft" },
  { key: "sent",      label: "Outstanding" },
  { key: "overdue",   label: "Overdue" },
  { key: "paid",      label: "Paid" },
  { key: "cancelled", label: "Cancelled" },
];

export default function Invoices() {
  const [tab, setTab] = useState("all");
  const [rows, setRows] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [cForm, setCForm] = useState({ client: "", dueDate: "" });
  const [cErr, setCErr] = useState("");
  const [cBusy, setCBusy] = useState(false);

  const [detail, setDetail] = useState(null);

  const [payFor, setPayFor] = useState(null);
  const [pForm, setPForm] = useState({ amount: "", method: "eft", notes: "" });
  const [pErr, setPErr] = useState("");
  const [pBusy, setPBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [inv, c] = await Promise.all([invoiceApi.list(), clientApi.list()]);
      setRows((inv.data.data || []).map(adaptInvoice));
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

  async function createInvoice(e) {
    e.preventDefault();
    setCErr("");
    if (!cForm.client) { setCErr("Select a client"); return; }
    setCBusy(true);
    try {
      const { data } = await invoiceApi.create({
        client: cForm.client,
        dueDate: cForm.dueDate || null,
      });
      setCForm({ client: "", dueDate: "" });
      setShowCreate(false);
      await load();
      setDetail({ id: data.data._id });
    } catch (e) {
      setCErr(e?.response?.data?.message || "Failed to create invoice");
    } finally {
      setCBusy(false);
    }
  }

  function openPay(invoice) {
    setPayFor(invoice);
    setPForm({
      amount: String(invoice.amountDue > 0 ? invoice.amountDue : ""),
      method: "eft",
      notes: "",
    });
    setPErr("");
  }

  async function submitPayment(e) {
    e.preventDefault();
    setPErr("");
    const amt = Number(pForm.amount);
    if (!amt || amt <= 0) { setPErr("Enter a positive amount"); return; }
    setPBusy(true);
    try {
      await invoiceApi.recordPayment(payFor.id, {
        amount: amt,
        method: pForm.method,
        notes: pForm.notes || null,
      });
      setPayFor(null);
      await load();
    } catch (e) {
      setPErr(e?.response?.data?.message || "Failed to record payment");
    } finally {
      setPBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-h1">Invoices</h1>
          <p className="page-sub">
            {filtered.length} invoice{filtered.length === 1 ? "" : "s"} · {R(total)}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? "Cancel" : "New invoice"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createInvoice} className="card space-y-4">
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
              <label className="label">Due date</label>
              <input className="input" type="date" value={cForm.dueDate}
                onChange={(e) => setCForm({ ...cForm, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end">
            <button className="btn-primary" disabled={cBusy}>
              {cBusy ? "Creating…" : "Create draft invoice"}
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
          <div className="py-10 text-center text-sm text-mute">No invoices in this view</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[820px]">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-mute">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Invoice</th>
                  <th className="text-left font-medium px-5 py-3">Client</th>
                  <th className="text-left font-medium px-5 py-3">Issued</th>
                  <th className="text-left font-medium px-5 py-3">Due</th>
                  <th className="text-right font-medium px-5 py-3">Total</th>
                  <th className="text-right font-medium px-5 py-3">Due</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-line hover:bg-slate-50 cursor-pointer"
                      onClick={() => setDetail({ id: r.id })}>
                    <td className="px-5 py-3 font-semibold text-ink">{r.number}</td>
                    <td className="px-5 py-3 text-slate-700">{r.client}</td>
                    <td className="px-5 py-3 text-mute">{fmtDate(r.issuedAt)}</td>
                    <td className="px-5 py-3">
                      <DueCell date={r.dueDate} status={r.rawStatus} />
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-700">{R(r.amount)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-700">{R(r.amountDue)}</td>
                    <td className="px-5 py-3"><Tag status={r.status} /></td>
                    <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {["sent", "overdue"].includes(r.rawStatus) && r.amountDue > 0 && (
                        <button className="btn-primary btn-sm" onClick={() => openPay(r)}>
                          Pay
                        </button>
                      )}
                      {r.rawStatus === "paid" && (
                        <span className="text-xs text-mute">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detail && (
        <InvoiceDrawer
          invoiceId={detail.id}
          onClose={() => setDetail(null)}
          onChanged={load}
          onRecordPayment={openPay}
        />
      )}

      {payFor && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-[60]">
          <form onSubmit={submitPayment} className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-ink">Record payment</h3>
              <p className="text-sm text-mute mt-0.5">
                {payFor.number} · {payFor.client} · Due {R(payFor.amountDue)}
              </p>
            </div>
            {pErr && <div className="rounded-md bg-dangerBg text-dangerText px-3 py-2 text-sm">{pErr}</div>}
            <div>
              <label className="label">Amount</label>
              <input className="input" type="number" min="0.01" step="0.01"
                value={pForm.amount}
                onChange={(e) => setPForm({ ...pForm, amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Method</label>
              <select className="input" value={pForm.method}
                onChange={(e) => setPForm({ ...pForm, method: e.target.value })}>
                <option value="eft">EFT</option>
                <option value="card">Card</option>
                <option value="manual">Manual / Cash</option>
                <option value="debit_order">Debit order</option>
              </select>
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <input className="input" value={pForm.notes}
                onChange={(e) => setPForm({ ...pForm, notes: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-outline" onClick={() => setPayFor(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={pBusy}>
                {pBusy ? "Recording…" : "Record payment"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* ---------- Invoice detail drawer (workspace) ---------- */

function InvoiceDrawer({ invoiceId, onClose, onChanged, onRecordPayment }) {
  const [inv, setInv] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const [itemForm, setItemForm] = useState({
    product: "", description: "", quantity: "1", unitPrice: "",
  });
  const [itemBusy, setItemBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [i, p] = await Promise.all([
        invoiceApi.get(invoiceId),
        productApi.list(),
      ]);
      setInv(i.data.data);
      setProducts((p.data.data || []).map(adaptProduct));
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [invoiceId]);

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
      await invoiceApi.addItem(invoiceId, {
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
    if (!confirm("Remove this line item?")) return;
    try {
      await invoiceApi.removeItem(invoiceId, itemId);
      await load();
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to remove item");
    }
  }

  async function sendInvoice() {
    setActionBusy(true);
    try {
      await invoiceApi.send(invoiceId);
      await load();
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to send invoice");
    } finally {
      setActionBusy(false);
    }
  }

  async function cancelInvoice() {
    setActionBusy(true);
    try {
      // No cancel endpoint yet — using PATCH status
      await invoiceApi.update(invoiceId, { status: "cancelled" });
      setConfirmCancel(false);
      await load();
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to cancel invoice");
    } finally {
      setActionBusy(false);
    }
  }

  function printInvoice() {
    window.print();
  }

  function copyLink() {
    const link = `${window.location.origin}/client/invoices/${invoiceId}`;
    navigator.clipboard?.writeText(link);
    alert("Share link copied:\n" + link);
  }

  function duplicateInvoice() {
    alert("Duplicate flow coming in a future release.");
  }

  function sendReminder() {
    alert("Reminder email will be sent (email service not yet wired).");
  }

  const isDraft = inv?.status === "draft";
  const isSent = inv?.status === "sent";
  const isOverdue = inv?.status === "overdue";
  const isPaid = inv?.status === "paid";
  const isCancelled = inv?.status === "cancelled";
  const canSend = isDraft && (inv?.lineItems?.length > 0);
  const canRecordPayment = ["sent", "overdue"].includes(inv?.status) && inv?.amountDue > 0;

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex justify-end" onClick={onClose}>
      <div
        className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl print:bg-white print:shadow-none print:max-w-none print:w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-line px-6 py-4 flex items-center justify-between print:hidden">
          <div>
            <h2 className="text-lg font-extrabold text-ink">
              {inv?.invoiceNumber || "Loading…"}
            </h2>
            <p className="text-sm text-mute">{inv?.client?.name || ""}</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-outline btn-sm" onClick={printInvoice}>Print</button>
            <button className="btn-outline btn-sm" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <div className="py-10 text-center text-sm text-mute">Loading…</div>
          ) : err ? (
            <div className="rounded-md bg-dangerBg text-dangerText px-3 py-2 text-sm">{err}</div>
          ) : (
            <>
              {/* Status banner */}
              <StatusBanner invoice={inv} />

              {/* Meta grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <Meta label="Status" value={<Tag status={capitalize(inv.status)} />} />
                <Meta label="Issued" value={fmtDate(inv.issuedAt || inv.createdAt)} />
                <Meta label="Due" value={
                  <span className={isOverdue ? "text-danger font-semibold" : ""}>
                    {fmtDate(inv.dueDate)}
                  </span>
                } />
                <Meta label="Client" value={inv.client?.name || "—"} />
              </div>

              {/* Money summary */}
              <div className="grid grid-cols-3 gap-3">
                <MoneyBox label="Total"       value={R(inv.total)}     tone="default" />
                <MoneyBox label="Paid"        value={R(inv.amountPaid)} tone="ok" />
                <MoneyBox label="Outstanding" value={R(inv.amountDue)}  tone={inv.amountDue > 0 ? "warn" : "ok"} />
              </div>

              {/* Line items */}
              <div>
                <h3 className="text-sm font-semibold text-ink mb-2">Line items</h3>
                {(!inv.lineItems || inv.lineItems.length === 0) ? (
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
                        {inv.lineItems.map((it) => (
                          <tr key={it._id} className="border-t border-line">
                            <td className="px-3 py-2 text-ink">{it.description}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-mute">{it.quantity}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-mute">{R(it.unitPrice)}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-ink font-semibold">{R(it.lineTotal)}</td>
                            {isDraft && (
                              <td className="px-3 py-2 text-right print:hidden">
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
                  Subtotal {R(inv.subtotal)} · VAT {R(inv.taxAmount)} ·{" "}
                  <span className="text-ink font-semibold ml-1">Total {R(inv.total)}</span>
                </div>
              </div>

              {/* Add line item (draft) */}
              {isDraft && (
                <form onSubmit={addItem} className="border-t border-line pt-4 space-y-3 print:hidden">
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

              {/* Payment history */}
              {inv.payments && inv.payments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-ink mb-2">Payment history</h3>
                  <div className="border border-line rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-mute">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">Payment #</th>
                          <th className="text-left px-3 py-2 font-medium">Method</th>
                          <th className="text-left px-3 py-2 font-medium">Date</th>
                          <th className="text-right px-3 py-2 font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inv.payments.map((p) => (
                          <tr key={p._id} className="border-t border-line">
                            <td className="px-3 py-2 text-ink">{p.paymentNumber}</td>
                            <td className="px-3 py-2 text-mute capitalize">{p.method.replace("_", " ")}</td>
                            <td className="px-3 py-2 text-mute">{fmtDateTime(p.paidAt || p.createdAt)}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-ink font-semibold">{R(p.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action bar */}
              <div className="border-t border-line pt-4 space-y-3 print:hidden">
                {/* Draft actions */}
                {isDraft && (
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button className="btn-outline" onClick={duplicateInvoice}>
                      Duplicate
                    </button>
                    <button className="btn-outline" onClick={copyLink}>
                      Copy link
                    </button>
                    <button
                      className="btn-primary"
                      disabled={!canSend || actionBusy}
                      onClick={sendInvoice}
                    >
                      {actionBusy ? "Sending…" : "Send invoice"}
                    </button>
                  </div>
                )}

                {/* Sent / overdue actions */}
                {(isSent || isOverdue) && (
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button className="btn-outline" onClick={sendReminder}>
                      Send reminder
                    </button>
                    <button className="btn-outline" onClick={copyLink}>
                      Copy link
                    </button>
                    <button
                      className="btn-outline text-danger border-danger hover:bg-dangerBg"
                      onClick={() => setConfirmCancel(true)}
                    >
                      Cancel invoice
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => onRecordPayment?.({
                        id: inv._id,
                        number: inv.invoiceNumber,
                        client: inv.client?.name,
                        amountDue: inv.amountDue,
                      })}
                      disabled={!canRecordPayment}
                    >
                      Record payment
                    </button>
                  </div>
                )}

                {/* Paid actions */}
                {isPaid && (
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button className="btn-outline" onClick={copyLink}>
                      Copy link
                    </button>
                    <button className="btn-outline" onClick={duplicateInvoice}>
                      Duplicate
                    </button>
                  </div>
                )}

                {/* Cancelled — no actions */}
                {isCancelled && (
                  <div className="text-sm text-mute text-center py-2">
                    This invoice has been cancelled.
                  </div>
                )}

                {!canSend && isDraft && (
                  <div className="text-xs text-mute text-center">
                    Add at least one line item to send this invoice.
                  </div>
                )}
              </div>

              {/* Cancel confirm */}
              {confirmCancel && (
                <div className="fixed inset-0 bg-black/50 grid place-items-center z-[70]">
                  <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm space-y-3">
                    <h3 className="text-lg font-semibold text-ink">Cancel this invoice?</h3>
                    <p className="text-sm text-mute">
                      This can't be undone. The invoice will be marked cancelled and won't be payable.
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                      <button className="btn-outline" onClick={() => setConfirmCancel(false)}>
                        Never mind
                      </button>
                      <button
                        className="btn-primary"
                        style={{ backgroundColor: "#B4372F" }}
                        disabled={actionBusy}
                        onClick={cancelInvoice}
                      >
                        {actionBusy ? "Cancelling…" : "Cancel invoice"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- small components ---------- */

function Meta({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase text-mute">{label}</div>
      <div className="mt-1 text-ink">{value}</div>
    </div>
  );
}

function MoneyBox({ label, value, tone = "default" }) {
  const bg = {
    default: "bg-slate-50 text-ink",
    ok:      "bg-okBg text-ok",
    warn:    "bg-warnBg text-warn",
    bad:     "bg-dangerBg text-danger",
  }[tone];
  return (
    <div className={`rounded-lg px-3 py-2 ${bg}`}>
      <div className="text-xs uppercase opacity-75">{label}</div>
      <div className="text-lg font-bold tabular-nums mt-0.5">{value}</div>
    </div>
  );
}

function StatusBanner({ invoice }) {
  const daysOverdue = (() => {
    if (invoice.status !== "overdue" || !invoice.dueDate) return 0;
    return Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / 86400000);
  })();

  if (invoice.status === "overdue") {
    return (
      <div className="rounded-lg bg-dangerBg text-danger px-4 py-3 text-sm font-semibold">
        Overdue by {daysOverdue} day{daysOverdue === 1 ? "" : "s"} — follow up with the client.
      </div>
    );
  }
  if (invoice.status === "paid") {
    return (
      <div className="rounded-lg bg-okBg text-ok px-4 py-3 text-sm font-semibold">
        Paid in full. Well done.
      </div>
    );
  }
  if (invoice.status === "draft") {
    return (
      <div className="rounded-lg bg-warnBg text-warn px-4 py-3 text-sm">
        Draft — add line items, then send when ready.
      </div>
    );
  }
  if (invoice.status === "cancelled") {
    return (
      <div className="rounded-lg bg-slate-100 text-slate-700 px-4 py-3 text-sm">
        Cancelled — no longer payable.
      </div>
    );
  }
  return null;
}

function DueCell({ date, status }) {
  if (!date) return <span className="text-mute">—</span>;
  const isOverdue = status === "overdue";
  return (
    <span className={isOverdue ? "text-danger font-semibold" : "text-mute"}>
      {fmtDate(date)}
    </span>
  );
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}