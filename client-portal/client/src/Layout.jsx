import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const NAV = [
    { to: "/", label: "Dashboard", end: true },
    { to: "/clients", label: "Clients" },
    { to: "/requests", label: "Requests" },
    { to: "/quotes", label: "Quotes" },
    { to: "/invoices", label: "Invoices" },
    { to: "/payments", label: "Payments" },
    { to: "/reports", label: "Reports" },
    { to: "/settings", label: "Settings" },
];

function initials(user) {
    const f = (user?.firstName || "").trim()[0] || "";
    const l = (user?.lastName || "").trim()[0] || "";
    return (f + l).toUpperCase() || "U";
}

export default function Layout() {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex bg-canvas">
            {/* Sidebar */}
            <aside className="w-56 shrink-0 bg-navy flex flex-col">
                <div className="h-16 flex items-center px-5 text-white font-semibold text-lg tracking-wide">
                    Brand
                </div>
                <nav className="flex-1 px-2 py-2 space-y-0.5">
                    {NAV.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                [
                                    "nav-item",
                                    isActive ? "nav-item-active" : "",
                                ].join(" ")
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Main column */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-4 px-6">
                    <input
                        type="search"
                        placeholder="Search clients, requests, quotes, invoices"
                        className="flex-1 h-10 max-w-2xl rounded-md border border-slate-300 px-3 text-sm bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
                        aria-label="Search"
                    />
                    <div className="ml-auto flex items-center gap-3">
                        <button
                            type="button"
                            className="h-10 px-4 rounded-md border border-slate-300 text-sm bg-white hover:bg-slate-50"
                        >
                            Notifications <span className="text-slate-400">3</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/settings")}
                            className="h-9 w-9 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center"
                            aria-label="Account"
                        >
                            {initials(user)}
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}