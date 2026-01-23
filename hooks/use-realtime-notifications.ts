"use client";

import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/notifications/types";

interface UseRealtimeNotificationsProps {
  userId: string | undefined;
  onNewNotification: (notification: Notification) => void;
}

export function useRealtimeNotifications({
  userId,
  onNewNotification,
}: UseRealtimeNotificationsProps) {
  const handleNewNotification = useCallback(
    (payload: { new: Notification }) => {
      onNewNotification(payload.new);
    },
    [onNewNotification]
  );

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    // Subscribe to new notifications for this user
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        handleNewNotification
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, handleNewNotification]);
}
