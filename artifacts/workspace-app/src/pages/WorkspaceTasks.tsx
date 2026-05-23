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

  return (
    <div className="p-4 md:p-6 md:pt-4 space-y-4 max-w-[1600px] mx-auto min-h-screen md:h-[calc(100vh-1rem)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between shrink-0 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Board</h1>
          <p className="text-muted-foreground mt-2">Manage tasks for this workspace.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/workspaces/${workspaceId}`}>
            <Button variant="outline"><Settings className="w-4 h-4 mr-2" /> Settings</Button>
          </Link>
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" /> New Task</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
                <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="priority" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="assigneeId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignee</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ?? "none"}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {members?.map(m => (
                            <SelectItem key={m.userId} value={m.userId.toString()}>{m.user.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={createMutation.isPending}>
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

      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4 lg:gap-6 overflow-x-auto overflow-y-auto md:overflow-hidden pb-2 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] mt-4">
        {columns.map((col, i) => (
          <div
            key={col.id}
            className="flex flex-col w-full md:h-full md:flex-1 md:min-w-0 bg-black/20 backdrop-blur-2xl rounded-[2rem] p-4 lg:p-5 border border-white/10 snap-center shadow-xl relative overflow-hidden min-h-[300px] md:min-h-0"
            onDrop={(e) => handleDrop(e, col.id)}
            style={{ animationDelay: `${i * 150}ms` }}
            onDragOver={handleDragOver}
          >
            {/* Subtle priority glow line at the top */}
            <div className={`absolute top-0 left-0 w-full h-1 ${col.id === 'high' ? 'bg-gradient-to-r from-rose-500/80 to-rose-500/20' : col.id === 'medium' ? 'bg-gradient-to-r from-amber-500/80 to-amber-500/20' : 'bg-gradient-to-r from-emerald-500/80 to-emerald-500/20'}`} />
            
            <div className="flex items-center justify-between mb-6 mt-4 font-semibold text-foreground px-1 shrink-0">
              {col.icon} {col.title}
              <Badge variant="secondary" className="ml-auto bg-white/10 text-white hover:bg-white/20 border-0">{tasks?.filter(t => t.priority === col.id).length || 0}</Badge>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-4 pt-2">
              {tasks?.filter(t => t.priority === col.id).map(task => (
                    <div
                      key={task.id}
                      draggable={isAdmin}
                      onDragStart={(e) => {
                        if (!isAdmin) {
                          e.preventDefault();
                          return;
                        }
                        e.dataTransfer.setData("taskId", task.id.toString());
                      }}
                      className={`group cursor-${isAdmin ? 'grab active:cursor-grabbing' : 'pointer'} bg-black/40 backdrop-blur-3xl border border-white/10 hover:border-primary/50 p-4 rounded-[1.5rem] shadow-[0_4px_24px_0_rgba(0,0,0,0.4)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(120,119,198,0.3)] hover:-translate-y-1 relative overflow-hidden`}
                    >
                      <Link href={`/tasks/${workspaceId}/${task.id}`} className="block h-full">
                        <div className="min-h-[100px] flex flex-col justify-between">
                          <div className="flex items-start gap-3">
                            <GripVertical className="w-4 h-4 text-white/30 group-hover:text-white/70 transition-colors shrink-0 mt-0.5 -ml-2" />
                            <div className="min-w-0 flex-1 space-y-4">
                              <p className="font-medium text-sm leading-tight break-words">{task.title}</p>
                              <div className="flex items-center justify-between text-xs">
                                <Badge variant="outline" className={task.status === "completed" ? "text-green-500 border-green-500/20 bg-green-500/10" : "text-slate-500 border-slate-500/20"}>
                                  {task.status.replace("_", " ")}
                                </Badge>
                                {task.assignee && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-medium text-foreground">
                                      {task.assignee.name.charAt(0).toUpperCase()}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
