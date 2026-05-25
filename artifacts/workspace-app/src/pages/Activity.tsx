import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import type { ActivityLogResponseItem } from "@workspace/api-client-react";
import { Loader2, Activity as ActivityIcon } from "lucide-react";
import { format } from "date-fns";

export function useGetMyActivity() {
  return useQuery({
    queryKey: ["/api/dashboard/activity"],
    queryFn: () => customFetch<ActivityLogResponseItem[]>("/api/dashboard/activity"),
  });
}

export default function Activity() {
  const { data: activities, isLoading } = useGetMyActivity();

  return (
    <div className="p-5 md:p-7 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <ActivityIcon className="w-5 h-5 text-indigo-400" />
            </div>
            Recent Activity
          </h1>
          <p className="text-white/45 mt-2 text-sm">Track everything happening across your connected workspaces.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
        </div>
      ) : activities?.length === 0 ? (
        <div className="rounded-2xl border border-white/8 p-12 text-center" style={{ background: "rgba(20, 12, 45, 0.7)" }}>
          <ActivityIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">No recent activity</h3>
          <p className="text-white/50 text-sm">It's quiet here. Very quiet.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 p-6" style={{ background: "rgba(20, 12, 45, 0.7)" }}>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
            {activities?.map((activity) => (
              <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#080416] bg-gradient-to-br from-purple-500 to-violet-700 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-white font-bold text-sm">
                  {activity.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
                
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-white/5 bg-white/[0.02] transition-colors hover:bg-white/[0.04]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white/90 text-sm">{activity.user?.name}</span>
                    <span className="text-[10px] text-white/40 font-medium">
                      {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <div className="text-sm text-white/60">
                    <span className="text-purple-300/80 font-medium">{activity.action}</span>
                    {activity.description && (
                      <span className="ml-1 text-white/50">'{activity.description}'</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
