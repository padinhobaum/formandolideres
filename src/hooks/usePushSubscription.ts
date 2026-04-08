import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const VAPID_PUBLIC_KEY = "BP_kEeP6ldU7YAibbFDcTj1pqz_WqQct5HT3Jfb5gU5NsXMcoA5R6ptHzlxHn3jS1-Z4ImTkALVm2OKfJfjOSYE";

type PushPermissionState = NotificationPermission | "unsupported";

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

function isPreviewEnvironment() {
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }

  return (
    window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com")
  );
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function usePushSubscription() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<PushPermissionState>(() => {
    if (typeof window === "undefined") return "unsupported";
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return "unsupported";
    }

    return Notification.permission;
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supportsPush = useMemo(() => {
    if (typeof window === "undefined") return false;

    return (
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      !isPreviewEnvironment()
    );
  }, []);

  const requiresIosInstall = useMemo(() => {
    if (typeof window === "undefined") return false;
    return supportsPush && isIosDevice() && !isStandaloneMode();
  }, [supportsPush]);

  const syncSubscription = useCallback(async (requestPermission = false) => {
    if (!user || !supportsPush || requiresIosInstall) return false;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      let nextPermission = Notification.permission;

      if (nextPermission === "default" && requestPermission) {
        nextPermission = await Notification.requestPermission();
      }

      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        setIsSubscribed(false);

        if (nextPermission === "denied") {
          setErrorMessage("As notificações estão bloqueadas no navegador ou no app instalado.");
        }

        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const key = subscription.getKey("p256dh");
      const auth = subscription.getKey("auth");

      if (!key || !auth) {
        throw new Error("Não foi possível obter as chaves da assinatura push.");
      }

      const normalizedSubscription = {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: arrayBufferToBase64url(key),
        auth: arrayBufferToBase64url(auth),
      };

      const { data: existingSubscriptions, error: existingError } = await supabase
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("user_id", user.id);

      if (existingError) throw existingError;

      const exactMatch = existingSubscriptions?.find((item) =>
        item.endpoint === normalizedSubscription.endpoint &&
        item.p256dh === normalizedSubscription.p256dh &&
        item.auth === normalizedSubscription.auth
      );

      const staleIds = (existingSubscriptions || [])
        .filter((item) => item.endpoint !== normalizedSubscription.endpoint)
        .map((item) => item.id);

      if (staleIds.length > 0) {
        const { error: deleteStaleError } = await supabase
          .from("push_subscriptions")
          .delete()
          .in("id", staleIds);

        if (deleteStaleError) throw deleteStaleError;
      }

      if (!exactMatch) {
        const duplicateEndpoint = existingSubscriptions?.find((item) => item.endpoint === normalizedSubscription.endpoint);

        if (duplicateEndpoint) {
          const { error: deleteDuplicateError } = await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", duplicateEndpoint.id);

          if (deleteDuplicateError) throw deleteDuplicateError;
        }

        const { error: insertError } = await supabase.from("push_subscriptions").insert(normalizedSubscription);
        if (insertError) throw insertError;
      }

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error("Push subscription failed:", err);
      setIsSubscribed(false);
      setErrorMessage("Não foi possível ativar as notificações neste dispositivo.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [requiresIosInstall, supportsPush, user]);

  const subscribe = useCallback(async () => syncSubscription(true), [syncSubscription]);

  useEffect(() => {
    if (!supportsPush) return;
    setPermission(Notification.permission);
  }, [supportsPush]);

  useEffect(() => {
    if (!user) {
      setIsSubscribed(false);
      setErrorMessage(null);
      return;
    }

    if (!supportsPush || requiresIosInstall) return;
    if (Notification.permission !== "granted") return;

    void syncSubscription(false);
  }, [requiresIosInstall, supportsPush, syncSubscription, user]);

  return {
    supportsPush,
    permission,
    isSubscribed,
    isLoading,
    errorMessage,
    requiresIosInstall,
    subscribe,
  };
}
