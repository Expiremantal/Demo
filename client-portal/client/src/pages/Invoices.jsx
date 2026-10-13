import { useState } from "react";

const TABS = ["All", "Awaiting approval", "Outstanding", "Overdue", "Paid"];

const ROWS = [
    { number: "Invoice number", client: "Client name", issued: "00 Mon", due: "00 Mon", amount: "R 000,000", status: "Awaiting approval" },
    { number: "Invoice number", client: "Client name", issued: "00 Mon", due: "00 Mon", amount: "R 000,000", status: "Sent" },
    { number: "Invoice number", client: "Client name", issued: "00 Mon", due: "00 Mon", amount: "R 000,000", status: "Overdue" },
    { number: "Invoice number", client: "Client name", issued: "00 Mon", due: "00 Mon", amount: "R 000,000", status: "Paid" },
    { number: "Invoice number", client: "Client name", issued: "00 Mon", due: "00 Mon", amount: "R 000,000", status: "Sent" },
];

const statusStyles = {
    "Awaiting approval": "bg-amber-50 text-amber-700",
    Sent: "bg-blue-50 text-blue-700",
    Overdue: "bg-dangerBg text-dangerText",
    Paid: "bg-emerald-50 text-emerald-700",
};

export default function Invoices() {
    const [tab, setTab] = useState("All");
    const filtered = tab === "All" ? ROWS : ROWS.filter((r) => r.status === tab);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold text-slate-900">Invoices</h1>

            <div className="flex gap-1 border-b border-slate-200">
                {TABS.map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={[
                            "px-4 py-2 text-sm -mb-px border-b-2 transition-colors",
                            tab === t
                                ? "border-brand text-brand font-medium"
                                : "border-transparent text-slate-500 hover:text-slate-700",
                        ].join(" ")}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                        <tr>
                            <th className="text-left font-medium px-5 py-3">Invoice</th>
                            <th className="text-left font-medium px-5 py-3">Client</th>
                            <th className="text-left font-medium px-5 py-3">Issued</th>
                            <th className="text-left font-medium px-5 py-3">Due</th>
                            <th className="text-left font-medium px-5 py-3">Amount</th>
                            <th className="text-left font-medium px-5 py-3">Status</th>
                            <th className="px-5 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((r, i) => (
                            <tr key={i} className="border-t border-slate-100">
                                <td className="px-5 py-3 text-slate-800">{r.number}</td>
                                <td className="px-5 py-3 text-slate-700">{r.client}</td>
                                <td className="px-5 py-3 text-slate-500">{r.issued}</td>
                                <td className="px-5 py-3 text-slate-500">{r.due}</td>
                                <td className="px-5 py-3 text-slate-700">{r.amount}</td>
                                <td className="px-5 py-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[r.status]}`}>
                                        {r.status}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <button type="button" className="btn-outline btn-sm">Open</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}