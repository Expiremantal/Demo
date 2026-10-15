import { useEffect, useState } from "react";
import api from "../api/axios";

export function useClients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        api.get("/clients")
            .then((res) => { if (!cancelled) setClients(res.data.data); })
            .catch((e) => { if (!cancelled) setError(e); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    return { clients, loading, error, setClients };
}