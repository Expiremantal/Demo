// src/lib/api.js
import api from "../api/axios";

// ---------- Auth ----------
export const authApi = {
  login:    (email, password) => api.post("/auth/login", { email, password }),
  register: (payload)         => api.post("/auth/register", payload),
  me:       ()                => api.get("/auth/me"),
  logout:   (refreshToken)    => api.post("/auth/logout", { refreshToken }),
};

// ---------- Clients ----------
export const clientApi = {
  list:   (params)   => api.get("/clients", { params }),
  get:    (id)       => api.get(`/clients/${id}`),
  create: (body)     => api.post("/clients", body),
  update: (id, body) => api.patch(`/clients/${id}`, body),
  assign: (id, userIds) => api.post(`/clients/${id}/assign`, { userIds }),
};

// ---------- Categories ----------
export const categoryApi = {
  list:   (params)   => api.get("/categories", { params }),
  create: (body)     => api.post("/categories", body),
  update: (id, body) => api.patch(`/categories/${id}`, body),
  remove: (id)       => api.delete(`/categories/${id}`),
};

// ---------- Products ----------
export const productApi = {
  list:   (params)   => api.get("/products", { params }),
  get:    (id)       => api.get(`/products/${id}`),
  create: (body)     => api.post("/products", body),
  update: (id, body) => api.patch(`/products/${id}`, body),
  remove: (id)       => api.delete(`/products/${id}`),
};

// ---------- Requests ----------
export const requestApi = {
  list:   (params)   => api.get("/requests", { params }),
  get:    (id)       => api.get(`/requests/${id}`),
  create: (body)     => api.post("/requests", body),
  update: (id, body) => api.patch(`/requests/${id}`, body),
  remove: (id)       => api.delete(`/requests/${id}`),
};

// ---------- Quotes ----------
export const quoteApi = {
  list:          (params)         => api.get("/quotes", { params }),
  get:           (id)             => api.get(`/quotes/${id}`),
  create:        (body)           => api.post("/quotes", body),
  update:        (id, body)       => api.patch(`/quotes/${id}`, body),
  remove:        (id)             => api.delete(`/quotes/${id}`),

  addItem:       (id, body)       => api.post(`/quotes/${id}/items`, body),
  updateItem:    (id, iid, body)  => api.patch(`/quotes/${id}/items/${iid}`, body),
  removeItem:    (id, iid)        => api.delete(`/quotes/${id}/items/${iid}`),

  send:          (id)             => api.post(`/quotes/${id}/send`),
  accept:        (id)             => api.post(`/quotes/${id}/accept`),
  reject:        (id)             => api.post(`/quotes/${id}/reject`),
  convertToInvoice: (id)          => api.post(`/quotes/${id}/convert-to-invoice`),
};

// ---------- Invoices ----------
export const invoiceApi = {
  list:          (params)         => api.get("/invoices", { params }),
  get:           (id)             => api.get(`/invoices/${id}`),
  create:        (body)           => api.post("/invoices", body),
  update:        (id, body)       => api.patch(`/invoices/${id}`, body),
  remove:        (id)             => api.delete(`/invoices/${id}`),
  send:          (id)             => api.post(`/invoices/${id}/send`),

  addItem:       (id, body)       => api.post(`/invoices/${id}/items`, body),
  updateItem:    (id, iid, body)  => api.patch(`/invoices/${id}/items/${iid}`, body),
  removeItem:    (id, iid)        => api.delete(`/invoices/${id}/items/${iid}`),

  recordPayment: (id, body)       => api.post(`/invoices/${id}/payments`, body),
  listPayments:  (id)             => api.get(`/invoices/${id}/payments`),
};

// ---------- Notifications ----------
export const notificationApi = {
  list:        (params) => api.get("/notifications", { params }),
  unreadCount: ()       => api.get("/notifications/unread-count"),
  markRead:    (id)     => api.patch(`/notifications/${id}/read`),
  markAllRead: ()       => api.post("/notifications/mark-all-read"),
  remove:      (id)     => api.delete(`/notifications/${id}`),
};

export const reportApi = {
  summary: () => api.get("/reports/summary"),
};

export const userApi = {
  me:             ()           => api.get("/users/me"),
  update:         (body)       => api.patch("/users/me", body),
  changePassword: (body)       => api.patch("/users/me/password", body),
};