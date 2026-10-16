import { Bell, CheckCheck, BellPlus } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/use-notifications";
import { usePush } from "@/hooks/use-push";

function timeAgo(dateStr: string | Date | null) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

export function NotificationBell() {
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const push = usePush();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
              data-testid="badge-unread-count"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAllRead.mutate()}
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
        {push.status === "default" && (
          <div className="p-3 border-b border-border bg-primary/5">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs h-8"
              onClick={() => push.subscribe()}
              disabled={push.loading}
              data-testid="button-enable-push"
            >
              <BellPlus className="h-3 w-3 mr-1.5" />
              Activer les notifications sur cet appareil
            </Button>
          </div>
        )}
        {push.status === "denied" && (
          <p className="text-xs text-muted-foreground p-3 border-b border-border">
            Notifications bloquées pour ce site — autorisez-les dans les réglages de votre navigateur pour les recevoir même site fermé.
          </p>
        )}
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 px-4">
              Aucune notification pour le moment.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <Link key={n.id} href={n.link ?? "#"}>
                  <div
                    onClick={() => !n.read && markRead.mutate(n.id)}
                    className={`block p-3 text-sm cursor-pointer hover:bg-secondary/40 transition-colors ${
                      !n.read ? "bg-primary/5" : ""
                    }`}
                    data-testid={`notification-${n.id}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                      <div className="flex-1">
                        <p className={!n.read ? "font-medium" : "text-muted-foreground"}>{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
