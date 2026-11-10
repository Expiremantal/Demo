// src/hooks/useClients.js
import { clientApi } from "../lib/api";
import { useApi } from "./useApi";
import { useCallback } from "react";

export function useClients() {
  const { data, loading, error, refresh, setData } = useApi(
    () => clientApi.list(),
    []
  );
  const clients = data?.data ?? [];

  const setClients = useCallback(
    (updater) => {
      const next = typeof updater === "function" ? updater(clients) : updater;
      setData({ data: next });
    },
    [clients, setData]
  );

  return { clients, loading, error, refresh, setClients };
}