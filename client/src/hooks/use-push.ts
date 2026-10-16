import { useEffect, useState, useCallback } from "react";
import { api } from "@shared/routes";
import { apiFetch } from "@/lib/api";

// Convertit la clé VAPID (texte) dans le format binaire attendu par le navigateur.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export type PushStatus = "unsupported" | "default" | "granted" | "denied" | "subscribed";

export function usePush() {
  const [status, setStatus] = useState<PushStatus>("default");
  const [loading, setLoading] = useState(false);

  const supported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;

  useEffect(() => {
    if (!supported) {
      setStatus("unsupported");
      return;
    }
    (async () => {
      const reg = await navigator.serviceWorker.register("/sw.js").catch(() => null);
      if (!reg) return;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setStatus("subscribed");
      } else {
        setStatus(Notification.permission === "denied" ? "denied" : "default");
      }
    })();
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported) return;
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "default");
        return;
      }
      const keyRes = await apiFetch(api.push.publicKey.path);
      const { publicKey } = await keyRes.json();
      if (!publicKey) return; // push pas configuré côté serveur

      const reg = await navigator.serviceWorker.register("/sw.js");
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = subscription.toJSON();
      await apiFetch(api.push.subscribe.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth }),
      });
      setStatus("subscribed");
    } finally {
      setLoading(false);
    }
  }, [supported]);

  return { status, loading, subscribe, supported };
}
