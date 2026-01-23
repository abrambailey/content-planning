"use client";

import { useState, useCallback, useEffect } from "react";
import {
  savePushSubscription,
  removePushSubscription,
  getVapidPublicKey,
} from "@/lib/notifications/push-actions";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

interface UsePushNotificationsReturn {
  permission: PermissionState;
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as Uint8Array<ArrayBuffer>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSupport = async () => {
      const supported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      setIsSupported(supported);

      if (!supported) {
        setPermission("unsupported");
        return;
      }

      // Check current permission
      setPermission(Notification.permission as PermissionState);

      // Check if already subscribed
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        }
      } catch (err) {
        console.error("Error checking subscription:", err);
      }
    };

    checkSupport();
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Push notifications are not supported");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);
      return result === "granted";
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to request permission";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Push notifications are not supported");
      return false;
    }

    if (permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Get VAPID public key
      const vapidPublicKey = await getVapidPublicKey();
      if (!vapidPublicKey) {
        setError("VAPID public key not configured");
        return false;
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Save subscription to server
      const subscriptionJson = subscription.toJSON();
      console.log("[Push Client] Saving subscription to server:", {
        endpoint: subscription.endpoint.substring(0, 50) + "...",
        hasP256dh: !!subscriptionJson.keys?.p256dh,
        hasAuth: !!subscriptionJson.keys?.auth,
      });

      const result = await savePushSubscription({
        endpoint: subscription.endpoint,
        p256dh_key: subscriptionJson.keys?.p256dh || "",
        auth_key: subscriptionJson.keys?.auth || "",
      });

      console.log("[Push Client] Save result:", result);

      if (!result.success) {
        setError(result.error || "Failed to save subscription");
        return false;
      }

      setIsSubscribed(true);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to subscribe";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission, requestPermission]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        setIsSubscribed(false);
        return true;
      }

      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setIsSubscribed(false);
        return true;
      }

      // Unsubscribe from push
      await subscription.unsubscribe();

      // Remove from server
      await removePushSubscription(subscription.endpoint);

      setIsSubscribed(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to unsubscribe";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    permission,
    isSupported,
    isSubscribed,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}
