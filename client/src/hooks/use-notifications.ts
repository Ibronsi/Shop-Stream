import { useMutation, useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { apiFetch } from "@/lib/api";
import { useCurrentUser } from "@/hooks/use-auth";

export function useNotifications() {
  const { data: currentUser } = useCurrentUser();
  return useQuery({
    queryKey: [api.notifications.list.path],
    queryFn: async () => {
      const res = await apiFetch(api.notifications.list.path);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return api.notifications.list.responses[200].parse(await res.json());
    },
    enabled: !!currentUser,
    // On vérifie régulièrement : pas de notifications en temps réel (websocket),
    // mais un rafraîchissement discret suffit pour ce genre d'usage.
    refetchInterval: 20_000,
  });
}

export function useMarkNotificationRead() {
  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", buildUrl(api.notifications.markRead.path, { id }), {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.notifications.list.path] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  return useMutation({
    mutationFn: async () => {
      return apiRequest("POST", api.notifications.markAllRead.path, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.notifications.list.path] });
    },
  });
}
