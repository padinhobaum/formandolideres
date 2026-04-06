import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const VAPID_PUBLIC_KEY = "BP_kEeP6ldU7YAibbFDcTj1pqz_WqQct5HT3Jfb5gU5NsXMcoA5R6ptHzlxHn3jS1-Z4ImTkALVm2OKfJfjOSYE";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function usePushSubscription() {
  const { user } = useAuth();

  const subscribe = useCallback(async () => {
    if (!user) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    // Don't run in iframes or preview
    try {
      if (window.self !== window.top) return;
    } catch {
      return;
    }
    if (
      window.location.hostname.includes("id-preview--") ||
      window.location.hostname.includes("lovableproject.com")
    ) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check existing subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer,
        });
      }

      const key = subscription.getKey("p256dh");
      const auth = subscription.getKey("auth");
      if (!key || !auth) return;

      // Save to database
      const subData = {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: arrayBufferToBase64url(key),
        auth: arrayBufferToBase64url(auth),
      };

      await supabase.from("push_subscriptions").upsert(subData, {
        onConflict: "user_id,endpoint",
      });
    } catch (err) {
      console.error("Push subscription failed:", err);
    }
  }, [user]);

  useEffect(() => {
    // Small delay to not block initial render
    const timer = setTimeout(subscribe, 3000);
    return () => clearTimeout(timer);
  }, [subscribe]);
}
