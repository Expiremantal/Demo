import { useState } from "react";

const ROWS = [
    { name: "Client name", email: "contact@email", open: 0, quotes: 0, outstanding: "R 000,000", status: "Active" },
    { name: "Client name", email: "contact@email", open: 0, quotes: 0, outstanding: "R 00,000", status: "Active" },
    { name: "Client name", email: "contact@email", open: 0, quotes: 0, outstanding: "R 000,000", status: "Overdue" },
    { name: "Client name", email: "contact@email", open: 0, quotes: 0, outstanding: "R 00,000", status: "New" },
    { name: "Client name", email: "contact@email", open: 0, quotes: 0, outstanding: "—", status: "Active" },
];

const statusStyles = {
    Active: "bg-emerald-50 text-emerald-700",
    Overdue: "bg-dangerBg text-dangerText",
    New: "bg-blue-50 text-blue-700",
};

export default function Clients() {
    const [q, setQ] = useState("");
    const filtered = ROWS.filter(
        (r) =>
            r.name.toLowerCase().includes(q.toLowerCase()) ||
            r.email.toLowerCase().includes(q.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>

            <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filter by name or email"
                className="input max-w-md"
            />

            <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                        <tr>
                            <th className="text-left font-medium px-5 py-3">Client</th>
                            <th className="text-left font-medium px-5 py-3">Open requests</th>
                            <th className="text-left font-medium px-5 py-3">Quotes</th>
                            <th className="text-left font-medium px-5 py-3">Outstanding</th>
                            <th className="text-left font-medium px-5 py-3">Status</th>
                            <th className="px-5 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((r, i) => (
                            <tr key={i} className="border-t border-slate-100">
                                <td className="px-5 py-3">
                                    <div className="font-medium text-slate-800">{r.name}</div>
                                    <div className="text-xs text-slate-500">{r.email}</div>
                                </td>
                                <td className="px-5 py-3 text-slate-700">{r.open}</td>
                                <td className="px-5 py-3 text-slate-700">{r.quotes}</td>
                                <td className="px-5 py-3 text-slate-700">{r.outstanding}</td>
                                <td className="px-5 py-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[r.status]}`}>
                                        {r.status}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <button type="button" className="btn-outline btn-sm">View</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}