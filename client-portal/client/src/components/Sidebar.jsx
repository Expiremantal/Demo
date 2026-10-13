import { NavLink } from "react-router-dom";

const links = [
    { to: "/", label: "Dashboard", end: true },
    { to: "/clients", label: "Clients" },
    { to: "/requests", label: "Requests" },
    { to: "/quotes", label: "Quotes" },
    { to: "/invoices", label: "Invoices" },
    { to: "/payments", label: "Payments" },
    { to: "/reports", label: "Reports" },
    { to: "/settings", label: "Settings" },
];

export default function Sidebar() {
    return (
        <aside className="w-60 shrink-0 bg-sidebar text-white flex flex-col">
            <div className="h-16 flex items-center px-6 text-xl font-semibold tracking-wide">
                Brand
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
                {links.map((l) => (
                    <NavLink
                        key={l.to}
                        to={l.to}
                        end={l.end}
                        className={({ isActive }) =>
                            [
                                "block rounded-md px-4 py-2 text-sm transition-colors",
                                isActive
                                    ? "bg-sidebarActive text-white"
                                    : "text-slate-200 hover:bg-sidebarHover",
                            ].join(" ")
                        }
                    >
                        {l.label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}