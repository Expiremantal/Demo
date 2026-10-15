import { useState } from "react";
import { useClients } from "../hooks/useClients";
import Can from "../components/Can";
import api from "../api/axios";

export default function Clients() {
    const { clients, loading, setClients } = useClients();
    const [assigning, setAssigning] = useState(null);

    async function assign(clientId, userIds) {
        const { data } = await api.post(`/clients/${clientId}/assign`, { userIds });
        setClients((prev) => prev.map((c) => (c._id === clientId ? data.data : c)));
        setAssigning(null);
    }

    if (loading) return <p>Loading…</p>;

    return (
        <div>
            <h1 className="text-2xl font-semibold mb-4">Clients</h1>

            {clients.map((c) => (
                <div key={c._id} className="border rounded p-4 mb-2 flex justify-between">
                    <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-sm text-gray-500">
                            Assigned to: {c.assignedTo.map((u) => `${u.firstName} ${u.lastName}`).join(", ") || "—"}
                        </p>
                    </div>

                    <Can permission="client:assign">
                        <button onClick={() => setAssigning(c)} className="text-blue-600">
                            Assign
                        </button>
                    </Can>
                </div>
            ))}

            {assigning && (
                <AssignModal
                    client={assigning}
                    onClose={() => setAssigning(null)}
                    onSave={assign}
                />
            )}
        </div>
    );
}