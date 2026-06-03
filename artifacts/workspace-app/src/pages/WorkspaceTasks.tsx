import { useListWorkspaceTasks, useCreateTask, useUpdateTask, useGetWorkspaceMembers, useGetWorkspace, getListWorkspaceTasksQueryKey, getGetWorkspaceMembersQueryKey, getGetWorkspaceQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, GripVertical, AlertCircle, Clock, CheckCircle2, Loader2, ArrowUpCircle, ArrowRightCircle, ArrowDownCircle, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";

const createSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  assigneeId: z.string().optional(),
});

type CreateFormValues = z.infer<typeof createSchema>;

export default function WorkspaceTasks() {
  const params = useParams<{ id: string }>();
  const workspaceId = parseInt(params.id || "0", 10);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: tasks, isLoading: tasksLoading } = useListWorkspaceTasks(workspaceId, {}, {
    query: { enabled: !!workspaceId, queryKey: getListWorkspaceTasksQueryKey(workspaceId) }
  });

  const { data: members } = useGetWorkspaceMembers(workspaceId, {
    query: { enabled: !!workspaceId, queryKey: getGetWorkspaceMembersQueryKey(workspaceId) }
  });

  const { data: workspace } = useGetWorkspace(workspaceId, {
    query: { enabled: !!workspaceId, queryKey: getGetWorkspaceQueryKey(workspaceId) },
  });
  
  const { user } = useAuth();
  const currentMember = members?.find(m => m.userId === user?.id);
  const isAdmin = currentMember?.role === "admin" || workspace?.ownerId === user?.id || user?.role === "admin";

  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { title: "", description: "", priority: "medium", status: "pending", assigneeId: "none" },
  });

  const onSubmit = (data: CreateFormValues) => {
    const previousTasks = queryClient.getQueryData(getListWorkspaceTasksQueryKey(workspaceId));
    const optimisticTask = {
      id: Date.now(),
      title: data.title,
      description: data.description || "",
      priority: data.priority,
      status: data.status,
      workspaceId,
      assigneeId: data.assigneeId && data.assigneeId !== "none" ? parseInt(data.assigneeId, 10) : null,
      assignee: data.assigneeId && data.assigneeId !== "none" ? members?.find(m => m.userId.toString() === data.assigneeId)?.user : null,
    };

    queryClient.setQueryData(getListWorkspaceTasksQueryKey(workspaceId), (old: any) => {
      return old ? [...old, optimisticTask] : [optimisticTask];
    });

    setOpen(false);
    toast.success("Task created");
    form.reset();

    createMutation.mutate(
      { workspaceId, data: { ...data, assigneeId: data.assigneeId && data.assigneeId !== "none" ? parseInt(data.assigneeId, 10) : undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWorkspaceTasksQueryKey(workspaceId) });
        },
        onError: () => {
          queryClient.setQueryData(getListWorkspaceTasksQueryKey(workspaceId), previousTasks);
          toast.error("Failed to create task");
        }
      }
    );
  };

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData("taskId", taskId.toString());
  };

  const handleDrop = (e: React.DragEvent, newPriority: "low" | "medium" | "high") => {
    e.preventDefault();
    if (!isAdmin) return;
    
    const taskId = parseInt(e.dataTransfer.getData("taskId"), 10);
    if (!taskId) return;
    
    const task = tasks?.find(t => t.id === taskId);
    if (task && task.priority !== newPriority) {
      const previousTasks = queryClient.getQueryData(getListWorkspaceTasksQueryKey(workspaceId));
      queryClient.setQueryData(getListWorkspaceTasksQueryKey(workspaceId), (old: any) => 
        old ? old.map((t: any) => t.id === taskId ? { ...t, priority: newPriority } : t) : old
      );

      updateMutation.mutate(
        { workspaceId, taskId, data: { priority: newPriority } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListWorkspaceTasksQueryKey(workspaceId) });
          },
          onError: () => {
            queryClient.setQueryData(getListWorkspaceTasksQueryKey(workspaceId), previousTasks);
            toast.error("Failed to move task");
          }
        }
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "high": return "text-destructive border-destructive/20 bg-destructive/10";
      case "medium": return "text-orange-500 border-orange-500/20 bg-orange-500/10";
      default: return "text-blue-500 border-blue-500/20 bg-blue-500/10";
    }
  };

  const columns = [
    { id: "high" as const, title: "High Priority", icon: <ArrowUpCircle className="w-4 h-4 text-destructive" /> },
    { id: "medium" as const, title: "Medium Priority", icon: <ArrowRightCircle className="w-4 h-4 text-orange-500" /> },
    { id: "low" as const, title: "Low Priority", icon: <ArrowDownCircle className="w-4 h-4 text-blue-500" /> },
  ];

  if (tasksLoading) {
    return (
      <div className="p-5 md:p-6 space-y-5 max-w-[1600px] mx-auto min-h-screen md:h-[calc(100vh-1rem)] flex flex-col">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between shrink-0 gap-4">
          <div className="space-y-2 animate-pulse">
            <div className="h-8 w-24 bg-white/10 rounded-xl" />
            <div className="h-4 w-48 bg-white/5 rounded-lg" />
          </div>
          <div className="flex items-center gap-3 animate-pulse">
            <div className="h-9 w-48 bg-white/5 rounded-xl hidden sm:block" />
            <div className="h-9 w-24 bg-white/5 rounded-xl" />
            <div className="h-9 w-28 bg-white/10 rounded-xl" />
          </div>
        </div>

        {/* Kanban Columns Skeleton */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-5 overflow-x-auto overflow-y-auto md:overflow-hidden pb-2">
          {columns.map((col) => {
            const borderColor = col.id === "high" ? "border-red-500/10" : col.id === "medium" ? "border-orange-500/10" : "border-blue-500/10";
            const topBar = col.id === "high" ? "from-red-500/30 to-transparent" : col.id === "medium" ? "from-orange-500/30 to-transparent" : "from-blue-500/30 to-transparent";
            const headerColor = col.id === "high" ? "text-red-400/40" : col.id === "medium" ? "text-orange-400/40" : "text-blue-400/40";
            
            return (
              <div key={col.id}
                className={`flex flex-col w-full md:flex-1 md:min-w-0 rounded-2xl border ${borderColor} relative overflow-hidden min-h-[300px] md:min-h-0`}
                style={{ background: "rgba(14, 8, 30, 0.4)" }}
              >
                {/* Top color bar */}
                <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${topBar}`} />
                
                {/* Column header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0 animate-pulse">
                  <div className={`flex items-center gap-2 font-semibold text-sm ${headerColor}`}>
                    {col.icon} {col.title}
                  </div>
                  <div className="w-5 h-5 rounded-full bg-white/5 border border-white/5" />
                </div>

                {/* Task card skeletons (shimmer style) */}
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n}
                      className="rounded-xl border border-white/5 p-4 space-y-4 animate-pulse"
                      style={{ 
                        background: "linear-gradient(135deg, rgba(20, 10, 45, 0.4) 0%, rgba(20, 10, 45, 0.2) 100%)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-3.5 h-3.5 bg-white/5 rounded shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-white/10 rounded-lg w-5/6" />
                          {n === 1 && <div className="h-3.5 bg-white/5 rounded-lg w-2/3" />}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="h-5 w-16 bg-white/5 rounded border border-white/5" />
                        <div className="w-6 h-6 rounded-full bg-white/10" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 space-y-5 max-w-[1600px] mx-auto min-h-screen md:h-[calc(100vh-1rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between shrink-0 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Board</h1>
          <p className="text-white/45 mt-1 text-sm">Manage tasks for this workspace.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden sm:block">
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-48 h-9 pl-9 pr-3 rounded-xl text-sm text-white/70 border border-white/10 outline-none focus:border-purple-500/40 transition-all placeholder:text-white/30"
              style={{ background: "rgba(20,12,45,0.7)" }}
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          {/* Settings — links to members/invite/roles page */}
          <Link href={`/workspaces/${workspaceId}`}>
            <button
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm text-white/60 border border-white/10 hover:text-white hover:border-purple-500/30 transition-all"
              style={{ background: "rgba(20,12,45,0.7)" }}
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </Link>
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white border-0 shadow-[0_0_20px_rgba(139,92,246,0.3)] rounded-xl font-semibold h-9">
                  <Plus className="w-4 h-4 mr-2" /> New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95%] sm:max-w-[500px] border-white/10 rounded-3xl p-6 md:p-8" style={{ background: "rgba(15, 8, 35, 0.95)", backdropFilter: "blur(40px)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(139, 92, 246, 0.15)" }}>
                <DialogHeader className="mb-2">
                  <DialogTitle className="text-xl text-white font-bold tracking-tight">Create Task</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField control={form.control} name="title" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-sm font-medium">Task Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Update landing page..." className="bg-white/5 border-white/10 text-white rounded-xl focus-visible:ring-purple-500/50 h-11 px-4 placeholder:text-white/20 transition-all" />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-sm font-medium">Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Add details..." className="bg-white/5 border-white/10 text-white rounded-xl focus-visible:ring-purple-500/50 min-h-[100px] p-4 resize-none placeholder:text-white/20 transition-all" />
                        </FormControl>
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <FormField control={form.control} name="priority" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/70 text-sm font-medium">Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-purple-500/50 h-11">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[#120a28] border-white/10 text-white rounded-xl">
                              <SelectItem value="low" className="focus:bg-white/10 focus:text-white">Low</SelectItem>
                              <SelectItem value="medium" className="focus:bg-white/10 focus:text-white">Medium</SelectItem>
                              <SelectItem value="high" className="focus:bg-white/10 focus:text-white">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="assigneeId" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/70 text-sm font-medium">Assignee</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ?? "none"}>
                            <FormControl>
                              <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-purple-500/50 h-11">
                                <SelectValue placeholder="Unassigned" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[#120a28] border-white/10 text-white rounded-xl max-h-[200px]">
                              <SelectItem value="none" className="focus:bg-white/10 focus:text-white">Unassigned</SelectItem>
                              {members?.map(m => (
                                <SelectItem key={m.userId} value={m.userId.toString()} className="focus:bg-white/10 focus:text-white">
                                  {m.user.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={createMutation.isPending}
                        className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.4)] h-11 px-8 font-medium transition-all">
                        {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {createMutation.isPending ? "Creating..." : "Create Task"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-5 overflow-x-auto overflow-y-auto md:overflow-hidden pb-2">
        {columns.map((col, i) => {
          const colTasks = tasks?.filter(t => t.priority === col.id) ?? [];
          const borderColor = col.id === "high" ? "border-red-500/40" : col.id === "medium" ? "border-orange-500/40" : "border-blue-500/40";
          const headerColor = col.id === "high" ? "text-red-400" : col.id === "medium" ? "text-orange-400" : "text-blue-400";
          const topBar = col.id === "high" ? "from-red-500/70 to-red-500/10" : col.id === "medium" ? "from-orange-500/70 to-orange-500/10" : "from-blue-500/70 to-blue-500/10";
          return (
            <div key={col.id}
              className={`flex flex-col w-full md:flex-1 md:min-w-0 rounded-2xl border ${borderColor} relative overflow-hidden min-h-[300px] md:min-h-0`}
              style={{ background: "rgba(14, 8, 30, 0.8)" }}
              onDrop={(e) => handleDrop(e, col.id)}
              onDragOver={handleDragOver}
            >
              {/* Top color bar */}
              <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${topBar}`} />
              
              {/* Column header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
                <div className={`flex items-center gap-2 font-semibold text-sm ${headerColor}`}>
                  {col.icon} {col.title}
                </div>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white/60 border border-white/15"
                  style={{ background: "rgba(255,255,255,0.06)" }}>
                  {colTasks.length}
                </span>
              </div>

              {/* Task cards */}
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
                {colTasks.length === 0 ? (
                  <div className="text-center py-10 text-white/20 text-xs">No tasks</div>
                ) : (
                  colTasks.map(task => (
                    <div key={task.id}
                      draggable={isAdmin}
                      onDragStart={(e) => {
                        if (!isAdmin) { e.preventDefault(); return; }
                        e.dataTransfer.setData("taskId", task.id.toString());
                      }}
                      className={`group cursor-${isAdmin ? "grab active:cursor-grabbing" : "pointer"} rounded-xl border border-white/8 p-4 transition-all hover:border-purple-500/25 hover:-translate-y-0.5`}
                      style={{ background: "rgba(20, 10, 45, 0.8)" }}
                    >
                      <Link href={`/tasks/${workspaceId}/${task.id}`} className="block">
                        <div className="flex items-start gap-2 mb-3">
                          <GripVertical className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors shrink-0 mt-0.5" />
                          <p className="font-medium text-white/90 text-sm leading-snug break-words flex-1">{task.title}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge className={`text-[10px] h-5 px-2 border rounded font-medium ${
                            task.status === "completed"
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                              : task.status === "in_progress"
                              ? "bg-red-500/15 text-red-300 border-red-500/30"
                              : "bg-blue-500/15 text-blue-300 border-blue-500/30"
                          }`}>
                            {task.status.replace("_", " ")}
                          </Badge>
                          {task.assignee && (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center text-white text-[10px] font-bold shadow-[0_0_8px_rgba(139,92,246,0.4)]">
                              {task.assignee.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

}
