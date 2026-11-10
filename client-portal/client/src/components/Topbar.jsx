// src/components/Topbar.jsx
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { timeAgo } from "../lib/format";
import { Link } from "react-router-dom";

export default function Topbar() {
  const { user, logout } = useAuth();
  const { unread, items, loadFeed, markRead, markAllRead, remove } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  // Load feed when the panel opens
  useEffect(() => {
    if (open) loadFeed(10);
  }, [open, loadFeed]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-3 px-6 sticky top-0 z-10">
      {/* Search */}
      <div className="relative flex-1 max-w-xl">
        <svg
          viewBox="0 0 24 24"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-slate-400"
          fill="none" stroke="currentColor" strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="text"
          placeholder="Search clients, requests, quotes, invoices"
          className="w-full h-10 rounded-lg border border-slate-300 pl-9 pr-3 text-sm bg-canvas placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
          aria-label="Search"
        />
      </div>

      <div className="ml-auto flex items-center gap-2.5 relative" ref={panelRef}>
        {/* Notifications */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="h-10 px-4 rounded-lg border border-slate-300 text-sm font-semibold bg-white hover:bg-slate-50"
        >
          Notifications
          {unread > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-danger text-white text-[11px]">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-12 w-96 max-w-[90vw] bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <span className="text-sm font-semibold text-ink">Notifications</span>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 && (
                <div className="px-4 py-8 text-sm text-slate-500 text-center">
                  You're all caught up.
                </div>
              )}
              {items.map((n) => (
                <div
                  key={n._id}
                  className={`px-4 py-3 border-b border-slate-100 hover:bg-slate-50 ${!n.isRead ? "bg-slate-50/60" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm ${!n.isRead ? "font-semibold text-ink" : "text-slate-700"}`}>
                        {n.title}
                      </div>
                      {n.message && (
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {n.message}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400 mt-1">
                        {timeAgo(n.createdAt)}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {n.link && (
                        <Link
                          to={n.link}
                          onClick={() => { markRead(n._id); setOpen(false); }}
                          className="text-xs font-semibold text-brand hover:underline"
                        >
                          Open
                        </Link>
                      )}
                      {!n.isRead && (
                        <button
                          onClick={() => markRead(n._id)}
                          className="text-xs text-slate-500 hover:text-slate-700"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Avatar + logout */}
        <div className="relative group">
          <button
            className="h-9 w-9 rounded-full bg-gradient-to-br from-[#2BB5C0] to-[#1D5A8A] text-white text-xs font-bold flex items-center justify-center"
            title={`${user?.firstName} ${user?.lastName}`}
          >
            {initials}
          </button>
          <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg hidden group-hover:block z-20">
            <div className="px-3 py-2 text-xs text-slate-500 border-b truncate">
              {user?.email}
            </div>
            <button
              onClick={logout}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}