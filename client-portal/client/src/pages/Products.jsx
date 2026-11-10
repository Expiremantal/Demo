// src/pages/Products.jsx
import { useEffect, useMemo, useState } from "react";
import { productApi, categoryApi } from "../lib/api";
import { adaptProduct } from "../lib/adapters";
import { R } from "../lib/format";

export default function Products() {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterCat, setFilterCat] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    sku: "", name: "", description: "",
    price: "", costPrice: "", unit: "each",
    category: "", manageStock: false, stockQuantity: 0,
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [showCat, setShowCat] = useState(false);
  const [catName, setCatName] = useState("");
  const [catBusy, setCatBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([productApi.list(), categoryApi.list()]);
      setRows((p.data.data || []).map(adaptProduct));
      setCategories(c.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let out = rows;
    if (filterCat) out = out.filter((p) => p.categoryId === filterCat);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      out = out.filter((p) =>
        (p.name + " " + p.sku).toLowerCase().includes(s)
      );
    }
    return out;
  }, [rows, q, filterCat]);

  async function submitProduct(e) {
    e.preventDefault();
    setErr("");
    if (!form.sku.trim() || !form.name.trim() || !form.price) {
      setErr("SKU, name, and price are required.");
      return;
    }
    setBusy(true);
    try {
      await productApi.create({
        sku: form.sku.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: Number(form.price),
        costPrice: Number(form.costPrice || 0),
        unit: form.unit || "each",
        category: form.category || null,
        manageStock: !!form.manageStock,
        stockQuantity: Number(form.stockQuantity || 0),
      });
      setForm({
        sku: "", name: "", description: "",
        price: "", costPrice: "", unit: "each",
        category: "", manageStock: false, stockQuantity: 0,
      });
      setShowCreate(false);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to create product");
    } finally {
      setBusy(false);
    }
  }

  async function createCategory(e) {
    e.preventDefault();
    if (!catName.trim()) return;
    setCatBusy(true);
    try {
      await categoryApi.create({ name: catName.trim() });
      setCatName("");
      setShowCat(false);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to create category");
    } finally {
      setCatBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-h1">Products</h1>
          <p className="page-sub">{rows.length} product{rows.length === 1 ? "" : "s"} · {categories.length} categor{categories.length === 1 ? "y" : "ies"}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={() => setShowCat((v) => !v)}>
            {showCat ? "Cancel" : "New category"}
          </button>
          <button className="btn-primary" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? "Cancel" : "New product"}
          </button>
        </div>
      </div>

      {showCat && (
        <form onSubmit={createCategory} className="card flex items-end gap-3">
          <div className="flex-1">
            <label className="label">Category name</label>
            <input className="input" value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Pumps, Fittings, Labour…" />
          </div>
          <button className="btn-primary" disabled={catBusy}>
            {catBusy ? "Creating…" : "Create category"}
          </button>
        </form>
      )}

      {showCreate && (
        <form onSubmit={submitProduct} className="card space-y-4">
          {err && <div className="rounded-md bg-dangerBg text-dangerText px-3 py-2 text-sm">{err}</div>}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">SKU *</label>
              <input className="input" value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="PUMP-001" />
            </div>
            <div>
              <label className="label">Name *</label>
              <input className="input" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Grundfos CR10" />
            </div>
            <div>
              <label className="label">Price * (ZAR)</label>
              <input className="input" type="number" min="0" step="0.01" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <label className="label">Cost price</label>
              <input className="input" type="number" min="0" step="0.01" value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
            </div>
            <div>
              <label className="label">Unit</label>
              <input className="input" value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="each, hour, kg…" />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[80px]" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.manageStock}
                onChange={(e) => setForm({ ...form, manageStock: e.target.checked })} />
              Track stock
            </label>
            {form.manageStock && (
              <input className="input w-32" type="number" min="0" value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                placeholder="Quantity" />
            )}
          </div>
          <div className="flex justify-end">
            <button className="btn-primary" disabled={busy}>
              {busy ? "Creating…" : "Create product"}
            </button>
          </div>
        </form>
      )}

      <div className="card card-flush">
        <div className="p-4 border-b border-line flex flex-wrap gap-2 items-center">
          <input className="input max-w-xs" placeholder="Search by name or SKU"
            value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input max-w-xs" value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-mute">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-mute">
            {q || filterCat ? "No products match your filters" : "No products yet. Create one above."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-mute">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Product</th>
                  <th className="text-left font-medium px-5 py-3">SKU</th>
                  <th className="text-left font-medium px-5 py-3">Category</th>
                  <th className="text-right font-medium px-5 py-3">Price</th>
                  <th className="text-left font-medium px-5 py-3">Unit</th>
                  <th className="text-left font-medium px-5 py-3">Stock</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-line hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-ink">{p.name}</td>
                    <td className="px-5 py-3 text-slate-700">{p.sku}</td>
                    <td className="px-5 py-3 text-mute">{p.category}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-700">{R(p.price)}</td>
                    <td className="px-5 py-3 text-mute">{p.raw.unit}</td>
                    <td className="px-5 py-3 text-mute">
                      {p.stock == null ? "—" : p.stock}
                    </td>
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