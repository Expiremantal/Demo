// src/hooks/useNotifications.js
import { useCallback, useEffect, useState } from "react";
import { notificationApi } from "../lib/api";

const POLL_MS = 30_000;

export function useNotifications() {
  const [unread, setUnread]   = useState(0);
  const [items,  setItems]    = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshCount = useCallback(async () => {
    try {
      const { data } = await notificationApi.unreadCount();
      setUnread(data?.data?.count ?? 0);
    } catch {
      /* silent — don't toast on badge failure */
    }
  }, []);

  const loadFeed = useCallback(async (limit = 20) => {
    setLoading(true);
    try {
      const { data } = await notificationApi.list({ limit });
      setItems(data?.data ?? []);
      setUnread(data?.meta?.unreadCount ?? 0);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id) => {
    await notificationApi.markRead(id);
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnread((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationApi.markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  }, []);

  const remove = useCallback(async (id) => {
    await notificationApi.remove(id);
    setItems((prev) => prev.filter((n) => n._id !== id));
    refreshCount();
  }, [refreshCount]);

  // Initial + polling
  useEffect(() => {
    refreshCount();
    const id = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(id);
  }, [refreshCount]);

  return { unread, items, loading, refreshCount, loadFeed, markRead, markAllRead, remove };
}