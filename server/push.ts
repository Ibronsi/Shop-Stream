import webpush from "web-push";
import { storage } from "./storage";

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const configured = !!publicKey && !!privateKey;

if (configured) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:contact@shop-stream.app",
    publicKey!,
    privateKey!,
  );
}

export function isPushConfigured() {
  return configured;
}

export function getPublicKey() {
  return publicKey ?? null;
}

// Envoie une notification "comme une application" à tous les appareils d'un
// utilisateur. Si un appareil a désinstallé/révoqué l'abonnement, on le retire
// silencieusement de la base (ce n'est pas une erreur, c'est normal).
export async function sendPushToUser(userId: number, payload: { title: string; body: string; url?: string }) {
  if (!configured) return;
  const subscriptions = await storage.getPushSubscriptions(userId);
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await storage.deletePushSubscription(sub.endpoint);
        } else {
          console.error("Erreur envoi push:", err?.message || err);
        }
      }
    }),
  );
}

export async function sendPushToUsers(userIds: number[], payload: { title: string; body: string; url?: string }) {
  await Promise.all(userIds.map((id) => sendPushToUser(id, payload)));
}
