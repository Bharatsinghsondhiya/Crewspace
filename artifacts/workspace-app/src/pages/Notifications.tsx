import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, getListNotificationsQueryKey, useAcceptInvite, useAcceptProjectInvite } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, Clock, Inbox } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Notifications() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useListNotifications({}, {
    query: { queryKey: getListNotificationsQueryKey() }
  });

  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();
  const acceptWorkspaceMutation = useAcceptInvite();
  const acceptProjectMutation = useAcceptProjectInvite();
  const [, setLocation] = useLocation();

  const handleMarkRead = (id: number) => {
    markReadMutation.mutate({ notificationId: id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() })
    });
  };

  const handleAcceptWorkspace = (id: number, token: string, workspaceId: number) => {
    acceptWorkspaceMutation.mutate(
      { data: { token } },
      {
        onSuccess: () => {
          toast.success("Successfully joined the workspace!");
          handleMarkRead(id);
          setLocation(`/workspaces/${workspaceId}`);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.detail || "Failed to accept workspace invitation");
        }
      }
    );
  };

  const handleAcceptProject = (id: number, token: string, projectId: number) => {
    acceptProjectMutation.mutate(
      { token },
      {
        onSuccess: () => {
          toast.success("Successfully joined the project!");
          handleMarkRead(id);
          setLocation(`/admin`); // Redirect to Project Hub
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.detail || "Failed to accept project invitation");
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
    <div className="p-5 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center border border-white/10 shadow-[0_0_20px_rgba(244,63,94,0.4)]">
              <Bell className="w-6 h-6 text-white" />
            </div>
            Notifications
          </h1>
          <p className="text-white/50 mt-2 text-sm md:text-base">Stay updated on your workspaces and task assignments.</p>
        </div>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            onClick={handleMarkAllRead} 
            disabled={markAllMutation.isPending}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
          >
            <Check className="mr-2 h-4 w-4 text-emerald-400" /> Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-4 mt-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-[2rem] bg-white/5" />)}
          </div>
        ) : notifications?.length === 0 ? (
          <div className="text-center py-24 bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2rem]">
            <div className="w-20 h-20 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Inbox className="h-10 w-10 text-white/20" />
            </div>
            <h3 className="text-xl font-semibold text-white">All caught up!</h3>
            <p className="mt-2 text-white/40">You have no new notifications.</p>
          </div>
        ) : (
          notifications?.map(notification => {
            let messageText = notification.message;
            let inviteData: any = null;
            const isWorkspaceInvite = notification.type === "workspace_invite";
            const isProjectInvite = notification.type === "project_invite";

            if (isWorkspaceInvite || isProjectInvite) {
              try {
                const parsed = JSON.parse(notification.message);
                messageText = parsed.text || messageText;
                inviteData = parsed;
              } catch (e) {
                // Ignore, it might be an old string message
              }
            }

            return (
              <Card key={notification.id} className={cn(
                "backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2rem] transition-all overflow-hidden border", 
                !notification.isRead 
                  ? "bg-gradient-to-r from-purple-900/40 to-black/60 border-purple-500/30 shadow-[0_8px_32px_0_rgba(168,85,247,0.15)] scale-[1.01]" 
                  : "bg-black/40 border-white/5 opacity-80 hover:opacity-100"
              )}>
                <CardContent className="p-5 flex gap-5 md:items-center flex-col md:flex-row">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border",
                    !notification.isRead 
                      ? "bg-purple-500/20 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]" 
                      : "bg-white/5 border-white/10"
                  )}>
                    <Bell className={cn("w-5 h-5", !notification.isRead ? "text-purple-300" : "text-white/40")} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className={cn("text-base font-semibold", !notification.isRead ? "text-purple-100" : "text-white/70")}>
                      {notification.title}
                    </h4>
                    <p className="text-sm text-white/50 mt-1 leading-relaxed">{messageText}</p>
                    
                    {(isWorkspaceInvite || isProjectInvite) && inviteData?.token && !notification.isRead && (
                      <div className="mt-4 flex gap-3">
                        {isWorkspaceInvite ? (
                          <Button 
                            className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                            size="sm" 
                            onClick={() => handleAcceptWorkspace(notification.id, inviteData.token, notification.workspaceId!)}
                            disabled={acceptWorkspaceMutation.isPending}
                          >
                            {acceptWorkspaceMutation.isPending ? "Accepting..." : "Accept Workspace"}
                          </Button>
                        ) : (
                          <Button 
                            className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl shadow-[0_0_15px_rgba(192,38,211,0.4)]"
                            size="sm" 
                            onClick={() => handleAcceptProject(notification.id, inviteData.token, inviteData.projectId!)}
                            disabled={acceptProjectMutation.isPending}
                          >
                            {acceptProjectMutation.isPending ? "Accepting..." : "Accept Project"}
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl"
                          onClick={() => handleMarkRead(notification.id)}
                          disabled={markReadMutation.isPending}
                        >
                          Decline
                        </Button>
                      </div>
                    )}

                    <p className="text-xs text-white/30 mt-3 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5" /> {format(new Date(notification.createdAt), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                  
                  {!notification.isRead && (!(isWorkspaceInvite || isProjectInvite) || !inviteData?.token) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="shrink-0 text-purple-300 hover:text-white hover:bg-purple-500/20 rounded-xl self-start md:self-center"
                      onClick={() => handleMarkRead(notification.id)} 
                      disabled={markReadMutation.isPending}
                    >
                      <Check className="w-4 h-4 mr-2" /> Mark as read
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
