// src/hooks/useApi.js
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useApi(fetcher, deps, options)
 *  - fetcher: () => Promise<{ data: ... }>
 *  - deps: array (like useEffect deps)
 *  - options: { skip: boolean }
 * Returns { data, loading, error, refresh, setData }
 */
export function useApi(fetcher, deps = [], options = {}) {
  const { skip = false } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  const refresh = useCallback(async () => {
    if (skip) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher();
      if (mounted.current) setData(res?.data ?? null);
    } catch (err) {
      if (mounted.current) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Something went wrong";
        setError(msg);
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!skip) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, ...deps]);

  return { data, loading, error, refresh, setData };
}