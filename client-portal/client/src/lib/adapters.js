// src/lib/adapters.js
const STATUS_MAP = {
  // invoices
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
  // quotes
  viewed: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  converted: "Converted",
  // requests
  pending: "Pending",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const adaptStatus = (raw) => STATUS_MAP[raw] || raw || "—";

export const adaptClient = (c) => ({
  id: c._id,
  name: c.name,
  email: c.email || "—",
  phone: c.phone || "—",
  company: c.company || "—",
  assignedTo: c.assignedTo || [],
  status: c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : "Active",
  raw: c,
});

export const adaptRequest = (r) => ({
  id: r._id,
  number: r.requestNumber,
  title: r.title,
  description: r.description || "—",
  client: r.client?.name || "—",
  clientId: r.client?._id,
  priority: r.priority ? r.priority.charAt(0).toUpperCase() + r.priority.slice(1) : "Normal",
  status: adaptStatus(r.status),
  dueDate: r.dueDate,
  assignedTo: r.assignedTo,
  createdAt: r.createdAt,
  raw: r,
});

export const adaptQuote = (q) => ({
  id: q._id,
  number: q.quoteNumber,
  client: q.client?.name || "—",
  clientId: q.client?._id,
  amount: q.total || 0,
  status: adaptStatus(q.status),
  rawStatus: q.status,
  issuedAt: q.issuedAt || q.createdAt,
  expiresAt: q.expiresAt,
  createdAt: q.createdAt,
  raw: q,
});

export const adaptInvoice = (i) => ({
  id: i._id,
  number: i.invoiceNumber,
  client: i.client?.name || "—",
  clientId: i.client?._id,
  amount: i.total || 0,
  amountPaid: i.amountPaid || 0,
  amountDue: i.amountDue || 0,
  status: adaptStatus(i.status),
  rawStatus: i.status,
  paymentStatus: i.paymentStatus,
  issuedAt: i.issuedAt || i.createdAt,
  dueDate: i.dueDate,
  createdAt: i.createdAt,
  raw: i,
});

export const adaptPayment = (p) => ({
  id: p._id,
  number: p.paymentNumber,
  invoiceId: p.invoice,
  client: p.client?.name || "—",
  method: p.method,
  status: adaptStatus(p.status),
  amount: p.amount,
  paidAt: p.paidAt,
  createdAt: p.createdAt,
  raw: p,
});

export const adaptProduct = (p) => ({
  id: p._id,
  sku: p.sku,
  name: p.name,
  description: p.description || "—",
  category: p.category?.name || "—",
  categoryId: p.category?._id,
  price: p.price,
  costPrice: p.costPrice,
  stock: p.manageStock ? p.stockQuantity : null,
  isActive: p.isActive,
  raw: p,
});