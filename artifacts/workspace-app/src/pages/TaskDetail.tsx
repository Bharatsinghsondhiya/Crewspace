import { useGetTask, useUpdateTask, useDeleteTask, useGetWorkspaceMembers, useGetWorkspace, getGetTaskQueryKey, getGetWorkspaceMembersQueryKey, getListWorkspaceTasksQueryKey, getGetWorkspaceQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock, Calendar, CheckCircle2, Trash, Save, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function TaskDetail() {
  const params = useParams<{ workspaceId: string; taskId: string }>();
  const workspaceId = parseInt(params.workspaceId || "0", 10);
  const taskId = parseInt(params.taskId || "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: task, isLoading } = useGetTask(workspaceId, taskId, {
    query: { enabled: !!workspaceId && !!taskId, queryKey: getGetTaskQueryKey(workspaceId, taskId) }
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

  const titleMutation = useUpdateTask();
  const statusMutation = useUpdateTask();
  const priorityMutation = useUpdateTask();
  const assigneeMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [assigneeId, setAssigneeId] = useState<string>("none");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setInitialized(false);
  }, [taskId]);

  useEffect(() => {
    if (task && !initialized) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setAssigneeId(task.assigneeId ? task.assigneeId.toString() : "none");
      setInitialized(true);
    }
  }, [task, initialized]);

  const handleUpdateStatus = (val: "pending" | "in_progress" | "completed") => {
    setStatus(val);
    queryClient.setQueryData(getGetTaskQueryKey(workspaceId, taskId), (old: any) => old ? { ...old, status: val } : old);
    queryClient.setQueryData(getListWorkspaceTasksQueryKey(workspaceId), (old: any) => old ? old.map((t: any) => t.id === taskId ? { ...t, status: val } : t) : old);
    
    statusMutation.mutate({ workspaceId, taskId, data: { status: val } }, {
      onSuccess: () => {
        toast.success("Status updated");
        queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(workspaceId, taskId) });
        queryClient.invalidateQueries({ queryKey: getListWorkspaceTasksQueryKey(workspaceId) });
      },
      onError: () => {
        toast.error("Failed to update status");
        setStatus(task?.status || "");
      }
    });
  };

  const handleUpdatePriority = (val: "low" | "medium" | "high") => {
    setPriority(val);
    queryClient.setQueryData(getGetTaskQueryKey(workspaceId, taskId), (old: any) => old ? { ...old, priority: val } : old);
    queryClient.setQueryData(getListWorkspaceTasksQueryKey(workspaceId), (old: any) => old ? old.map((t: any) => t.id === taskId ? { ...t, priority: val } : t) : old);
    
    priorityMutation.mutate({ workspaceId, taskId, data: { priority: val } }, {
      onSuccess: () => {
        toast.success("Priority updated");
        queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(workspaceId, taskId) });
        queryClient.invalidateQueries({ queryKey: getListWorkspaceTasksQueryKey(workspaceId) });
      },
      onError: () => {
        toast.error("Failed to update priority");
        setPriority(task?.priority || "");
      }
    });
  };

  const handleUpdateAssignee = (val: string) => {
    setAssigneeId(val);
    const parsedId = val === "none" ? null : parseInt(val, 10);
    const assigneeObj = val === "none" ? null : members?.find((m: any) => m.userId === parsedId)?.user;
    
    queryClient.setQueryData(getGetTaskQueryKey(workspaceId, taskId), (old: any) => old ? { ...old, assigneeId: parsedId, assignee: assigneeObj } : old);
    queryClient.setQueryData(getListWorkspaceTasksQueryKey(workspaceId), (old: any) => old ? old.map((t: any) => t.id === taskId ? { ...t, assigneeId: parsedId, assignee: assigneeObj } : t) : old);
    
    assigneeMutation.mutate({ workspaceId, taskId, data: { assigneeId: parsedId } }, {
      onSuccess: () => {
        toast.success("Assignee updated");
        queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(workspaceId, taskId) });
        queryClient.invalidateQueries({ queryKey: getListWorkspaceTasksQueryKey(workspaceId) });
      },
      onError: () => {
        toast.error("Failed to update assignee");
        setAssigneeId(task?.assigneeId ? task.assigneeId.toString() : "none");
      }
    });
  };

  const handleSaveText = () => {
    queryClient.setQueryData(getGetTaskQueryKey(workspaceId, taskId), (old: any) => old ? { ...old, title, description } : old);
    queryClient.setQueryData(getListWorkspaceTasksQueryKey(workspaceId), (old: any) => old ? old.map((t: any) => t.id === taskId ? { ...t, title, description } : t) : old);
    
    titleMutation.mutate({ workspaceId, taskId, data: { title, description } }, {
      onSuccess: () => {
        toast.success("Saved");
        queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(workspaceId, taskId) });
        queryClient.invalidateQueries({ queryKey: getListWorkspaceTasksQueryKey(workspaceId) });
      },
      onError: () => toast.error("Failed to save changes")
    });
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    deleteMutation.mutate({ workspaceId, taskId }, {
      onSuccess: () => {
        toast.success("Task deleted");
        
        queryClient.setQueryData(getListWorkspaceTasksQueryKey(workspaceId), (old: any) => {
          return old ? old.filter((t: any) => t.id !== taskId) : [];
        });
        
        queryClient.invalidateQueries({ queryKey: getListWorkspaceTasksQueryKey(workspaceId) });
        setLocation(`/workspaces/${workspaceId}/tasks`);
      }
    });
  };

  if (isLoading || !task) return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh] animate-in fade-in duration-700">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading task details...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
      <Button variant="ghost" asChild className="-ml-4 mb-2 text-white/80 hover:text-white hover:bg-white/10">
        <Link href={`/workspaces/${workspaceId}/tasks`}><ArrowLeft className="w-4 h-4 mr-2" /> Back to Board</Link>
      </Button>

      <div className="flex flex-col md:flex-row items-start justify-between gap-8">
        <Card className="flex-1 w-full bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/5 p-6 md:p-8">
            <Input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              maxLength={255}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSaveText();
                }
              }}
              className="text-3xl font-bold h-auto py-2 border-transparent hover:border-white/20 focus:border-primary bg-transparent text-white placeholder:text-white/40 shadow-none px-0 rounded-none focus-visible:ring-0"
            />
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-6">
            <Textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              placeholder="Add a detailed description..."
              className="min-h-[250px] border-white/10 hover:border-white/20 focus:border-primary bg-black/20 text-white placeholder:text-white/40 resize-y rounded-xl p-4 text-base"
            />
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSaveText} disabled={titleMutation.isPending} className="rounded-xl px-8 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                {titleMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>} 
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="w-full md:w-[380px] shrink-0 space-y-6">
          <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2rem] hover:shadow-[0_8px_32px_0_rgba(120,119,198,0.2)] transition-all duration-300">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary"/> Status
                </label>
                <Select value={status} onValueChange={handleUpdateStatus}>
                  <SelectTrigger className="bg-black/40 border-white/10 text-white rounded-xl h-12"><SelectValue/></SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/10 text-white rounded-xl">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500"/> Priority
                </label>
                <Select value={priority} onValueChange={handleUpdatePriority}>
                  <SelectTrigger className="bg-black/40 border-white/10 text-white rounded-xl h-12"><SelectValue/></SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/10 text-white rounded-xl">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500"/> Assignee
                </label>
                <Select value={assigneeId} onValueChange={handleUpdateAssignee}>
                  <SelectTrigger className="bg-black/40 border-white/10 text-white rounded-xl h-12"><SelectValue placeholder="Unassigned"/></SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/10 text-white rounded-xl">
                    <SelectItem value="none">Unassigned</SelectItem>
                    {members?.map(m => (
                      <SelectItem key={m.userId} value={m.userId.toString()}>{m.user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-6 mt-6 border-t border-white/10">
                <p className="text-xs text-white/40 leading-relaxed">
                  Created by <span className="text-white/80 font-medium">{task.createdBy?.name}</span> <br/>
                  on {format(new Date(task.createdAt), "MMMM d, yyyy")}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Button variant="destructive" className="w-full rounded-xl h-12 shadow-[0_0_15px_rgba(225,29,72,0.3)] bg-rose-600/90 hover:bg-rose-600 border border-rose-500/50" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash className="w-4 h-4 mr-2" />} 
            Delete Task
          </Button>
        </div>
      </div>
    </div>
  );
}
