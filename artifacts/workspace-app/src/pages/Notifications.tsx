import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, getListNotificationsQueryKey, useAcceptInvite } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, Clock } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function Notifications() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useListNotifications({}, {
    query: { queryKey: getListNotificationsQueryKey() }
  });

  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();
  const acceptMutation = useAcceptInvite();
  const [, setLocation] = useLocation();

  const handleMarkRead = (id: number) => {
    markReadMutation.mutate({ notificationId: id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() })
    });
  };

  const handleAcceptInvite = (id: number, token: string, workspaceId: number) => {
    acceptMutation.mutate(
      { data: { token } },
      {
        onSuccess: () => {
          toast.success("Successfully joined the workspace!");
          handleMarkRead(id);
          setLocation(`/workspaces/${workspaceId}`);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.detail || "Failed to accept invitation");
        }
      }
    );
  };

  const handleMarkAllRead = () => {
    markAllMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("All notifications marked as read");
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      }
    });
  };

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-2">Updates from your workspaces and tasks.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead} disabled={markAllMutation.isPending}>
            <Check className="mr-2 h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div>Loading...</div>
        ) : notifications?.length === 0 ? (
          <div className="text-center py-20 bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2rem]">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-semibold">All caught up</h3>
            <p className="mt-2 text-muted-foreground">You have no new notifications.</p>
          </div>
        ) : (
          notifications?.map(notification => {
            let messageText = notification.message;
            let inviteData: any = null;
            const isInvite = notification.type === "workspace_invite";

            if (isInvite) {
              try {
                const parsed = JSON.parse(notification.message);
                messageText = parsed.text || messageText;
                inviteData = parsed;
              } catch (e) {
                // Ignore, it might be an old string message
              }
            }

            return (
              <Card key={notification.id} className={cn("bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2rem] transition-colors", !notification.isRead && "bg-black/60 border-primary/50 shadow-[0_8px_32px_0_rgba(120,119,198,0.2)]")}>
                <CardContent className="p-4 flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={cn("text-sm font-medium", !notification.isRead && "text-primary")}>{notification.title}</h4>
                    <p className="text-sm text-foreground mt-1">{messageText}</p>
                    
                    {isInvite && inviteData?.token && !notification.isRead && (
                      <div className="mt-3 flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleAcceptInvite(notification.id, inviteData.token, notification.workspaceId!)}
                          disabled={acceptMutation.isPending}
                        >
                          {acceptMutation.isPending ? "Accepting..." : "Accept"}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleMarkRead(notification.id)}
                          disabled={markReadMutation.isPending}
                        >
                          Decline
                        </Button>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {format(new Date(notification.createdAt), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                  {!notification.isRead && (!isInvite || !inviteData?.token) && (
                    <Button variant="ghost" size="sm" onClick={() => handleMarkRead(notification.id)} disabled={markReadMutation.isPending}>
                      Mark read
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
