import { NavLink } from "react-router-dom";

const ICONS = {
  Dashboard: <path d="M3 12 12 4l9 8M5 10v10h5v-6h4v6h5V10" />,
  Clients: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.6 3.4-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .6 3.2 2.4 3.5 5.2" />
    </>
  ),
  Requests: <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h6" />,
  Quotes:   <path d="M5 4h14v16l-3-2-2 2-2-2-2 2-2-2-3 2zM9 9h6M9 13h4" />,
  Invoices: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18M7 15h3" />
    </>
  ),
  Payments: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9.5c0-1 1.2-1.8 3-1.8s3 .8 3 2-1.3 1.7-3 2-3 .8-3 2 1.2 2 3 2 3-.8 3-1.8M12 6v1.5M12 16.5V18" />
    </>
  ),
  Products: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />,
  Reports: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  Settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </>
  ),
};

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/clients", label: "Clients" },
  { to: "/requests", label: "Requests" },
  { to: "/quotes", label: "Quotes" },
  { to: "/invoices", label: "Invoices" },
  { to: "/payments", label: "Payments" },
  { to: "/products", label: "Products" },   // ← new
  { to: "/reports", label: "Reports" },
  { to: "/settings", label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-sidebar text-white flex flex-col h-screen sticky top-0">
      <div className="h-16 flex items-center gap-2.5 px-5 text-lg font-extrabold tracking-wide">
        <span className="w-7 h-7 rounded-lg grid place-items-center text-sm font-bold bg-gradient-to-br from-[#2BB5C0] to-brand">
          B
        </span>
        Brand
      </div>
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              [
                "nav-item",
                isActive ? "nav-item-active" : "",
              ].join(" ")
            }
          >
            <svg viewBox="0 0 24 24">{ICONS[l.label]}</svg>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}