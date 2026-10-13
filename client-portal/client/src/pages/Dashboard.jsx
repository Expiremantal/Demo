import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const cards = [
    { label: "Open requests", value: "00", sub: "R 000,000" },
    { label: "Pending quotes", value: "00", sub: "R 000,000" },
    { label: "Outstanding invoices", value: "00", sub: "R 000,000" },
    { label: "Overdue invoices", value: "00", sub: "R 000,000", danger: true },
];

const panels = [
    "Quotes awaiting approval",
    "Requests requiring attention",
    "Invoices awaiting approval",
];

export default function Dashboard() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div className="text-sm text-slate-500 py-20 text-center">Loading…</div>;
    }
    if (!user) return <Navigate to="/login" replace />;

    const displayName =
        typeof user.firstName === "string" && user.firstName.trim()
            ? user.firstName.trim().slice(0, 40)
            : "there";

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
                    <p className="text-sm text-slate-500">What needs you today</p>
                </div>
                <div className="flex gap-2">
                    <button type="button" className="btn-outline">
                        New client
                    </button>
                    <button type="button" className="btn-primary">
                        New request
                    </button>
                </div>
            </div>

            {/* Three attention panels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {panels.map((title) => (
                    <div key={title} className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-800">
                                {title}
                            </h3>
                            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                0
                            </span>
                        </div>
                        <div className="space-y-3">
                            {[1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between border-t border-slate-100 pt-3 first:border-0 first:pt-0"
                                >
                                    <div>
                                        <div className="text-sm font-medium text-slate-800">
                                            Placeholder
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Client name, awaiting 0 days
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <button type="button" className="btn-outline btn-sm">
                                            Review
                                        </button>
                                        <button type="button" className="btn-primary btn-sm">
                                            Approve
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {cards.map((c) => (
                    <div
                        key={c.label}
                        className={[
                            "rounded-xl shadow-card p-5",
                            c.danger ? "bg-dangerBg" : "bg-white",
                        ].join(" ")}
                    >
                        <div className="text-sm text-slate-500">{c.label}</div>
                        <div className="text-3xl font-semibold mt-1 text-slate-900">
                            {c.value}
                        </div>
                        <div className="text-sm text-slate-500 mt-1">{c.sub}</div>
                    </div>
                ))}
            </div>

            {/* Recent activity */}
            <div className="card">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">
                    Recent activity
                </h3>
                {[
                    ["Quote generated", "Client name, time"],
                    ["Quote accepted", "Client name, time"],
                    ["Invoice sent", "Client name, time"],
                    ["Payment received", "Client name, time"],
                ].map(([label, meta]) => (
                    <div
                        key={label}
                        className="flex items-center justify-between py-3 border-t border-slate-100 first:border-0"
                    >
                        <span className="text-sm text-slate-700">{label}</span>
                        <span className="text-xs text-slate-500">{meta}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}