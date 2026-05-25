import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import type { TaskResponseItem } from "@workspace/api-client-react";
import { Loader2, LayoutList, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Link } from "wouter";

export function useGetMyTasks() {
  return useQuery({
    queryKey: ["/api/dashboard/my-tasks"],
    queryFn: () => customFetch<TaskResponseItem[]>("/api/dashboard/my-tasks"),
  });
}

function TaskStatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Completed</Badge>;
  }
  if (status === "in_progress") {
    return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">In Progress</Badge>;
  }
  return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Pending</Badge>;
}

function TaskPriorityBadge({ priority }: { priority: string }) {
  if (priority === "high") {
    return (
      <div className="flex items-center gap-1.5 text-red-400 text-xs font-medium">
        <AlertCircle className="w-3.5 h-3.5" /> High
      </div>
    );
  }
  if (priority === "medium") {
    return (
      <div className="flex items-center gap-1.5 text-orange-400 text-xs font-medium">
        <Clock className="w-3.5 h-3.5" /> Medium
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-blue-400 text-xs font-medium">
      <CheckCircle2 className="w-3.5 h-3.5" /> Low
    </div>
  );
}

export default function MyTasks() {
  const { data: tasks, isLoading } = useGetMyTasks();

  return (
    <div className="p-5 md:p-7 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
              <LayoutList className="w-5 h-5 text-purple-400" />
            </div>
            My Tasks
          </h1>
          <p className="text-white/45 mt-2 text-sm">Manage all tasks assigned to you across all workspaces.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
        </div>
      ) : tasks?.length === 0 ? (
        <div className="rounded-2xl border border-white/8 p-12 text-center" style={{ background: "rgba(20, 12, 45, 0.7)" }}>
          <LayoutList className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">No tasks assigned to you</h3>
          <p className="text-white/50 text-sm">You're all caught up! Enjoy your free time.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {tasks?.map((task) => (
            <Link key={task.id} href={`/tasks/${task.workspaceId}/${task.id}`}>
              <div 
                className="rounded-xl border border-white/8 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-white/[0.02] hover:border-purple-500/30 cursor-pointer" 
                style={{ background: "rgba(20, 12, 45, 0.5)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <TaskPriorityBadge priority={task.priority} />
                    <span className="text-white/30 text-xs">•</span>
                    <span className="text-xs text-white/50">Created {format(new Date(task.createdAt), "MMM d, yyyy")}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white/90 truncate">{task.title}</h3>
                  {task.dueDate && (
                    <p className="text-xs text-white/40 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Due {format(new Date(task.dueDate), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-4 shrink-0">
                  {task.labels && task.labels.length > 0 && (
                    <div className="hidden md:flex items-center gap-2">
                      {task.labels.slice(0, 2).map((label, idx) => (
                        <Badge key={idx} variant="outline" className="border-white/10 text-white/60 text-[10px]">
                          {label}
                        </Badge>
                      ))}
                      {task.labels.length > 2 && (
                        <span className="text-xs text-white/40">+{task.labels.length - 2}</span>
                      )}
                    </div>
                  )}
                  <TaskStatusBadge status={task.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
