import { useGetTask, useUpdateTask, useDeleteTask, useGetProjectMembers, getGetTaskQueryKey, getListProjectTasksQueryKey, getGetProjectQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Calendar, CheckCircle2, Trash, Save, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function TaskDetail() {
  // Route: /tasks/:projectId/:taskId
  const params = useParams<{ workspaceId: string; taskId: string }>();
  const projectId = parseInt(params.workspaceId || "0", 10); // param name kept as workspaceId due to App.tsx route
  const taskId = parseInt(params.taskId || "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: task, isLoading } = useGetTask(projectId, taskId);

  const { data: members } = useGetProjectMembers(projectId);

  const { user } = useAuth();
  const currentMember = members?.find(m => m.userId === user?.id);
  const isAdmin = currentMember?.role === "admin" || user?.isSuperAdmin;

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

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setInitialized(false);
  }, [taskId]);

  useEffect(() => {
    if (task && !initialized) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setAssigneeId(task.assigneeId ? task.assigneeId.toString() : "none");
      setInitialized(true);
    }
  }, [task, initialized]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(100, textareaRef.current.scrollHeight)}px`;
    }
  }, [description]);

  const taskQueryKey = getGetTaskQueryKey(projectId, taskId);
  const tasksListQueryKey = getListProjectTasksQueryKey(projectId);

  const handleUpdateStatus = (val: "pending" | "in_progress" | "completed") => {
    setStatus(val);
    queryClient.setQueryData(taskQueryKey, (old: any) => old ? { ...old, status: val } : old);
    queryClient.setQueryData(tasksListQueryKey, (old: any) => old ? old.map((t: any) => t.id === taskId ? { ...t, status: val } : t) : old);

    statusMutation.mutate({ projectId, taskId, data: { status: val } }, {
      onSuccess: () => {
        toast.success("Status updated");
        queryClient.invalidateQueries({ queryKey: taskQueryKey });
        queryClient.invalidateQueries({ queryKey: tasksListQueryKey });
      },
      onError: () => {
        toast.error("Failed to update status");
        setStatus(task?.status || "");
      }
    });
  };

  const handleUpdatePriority = (val: "low" | "medium" | "high") => {
    setPriority(val);
    queryClient.setQueryData(taskQueryKey, (old: any) => old ? { ...old, priority: val } : old);
    queryClient.setQueryData(tasksListQueryKey, (old: any) => old ? old.map((t: any) => t.id === taskId ? { ...t, priority: val } : t) : old);

    priorityMutation.mutate({ projectId, taskId, data: { priority: val } }, {
      onSuccess: () => {
        toast.success("Priority updated");
        queryClient.invalidateQueries({ queryKey: taskQueryKey });
        queryClient.invalidateQueries({ queryKey: tasksListQueryKey });
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

    queryClient.setQueryData(taskQueryKey, (old: any) => old ? { ...old, assigneeId: parsedId, assignee: assigneeObj } : old);
    queryClient.setQueryData(tasksListQueryKey, (old: any) => old ? old.map((t: any) => t.id === taskId ? { ...t, assigneeId: parsedId, assignee: assigneeObj } : t) : old);

    assigneeMutation.mutate({ projectId, taskId, data: { assigneeId: parsedId } }, {
      onSuccess: () => {
        toast.success("Assignee updated");
        queryClient.invalidateQueries({ queryKey: taskQueryKey });
        queryClient.invalidateQueries({ queryKey: tasksListQueryKey });
      },
      onError: () => {
        toast.error("Failed to update assignee");
        setAssigneeId(task?.assigneeId ? task.assigneeId.toString() : "none");
      }
    });
  };

  const handleSaveText = () => {
    queryClient.setQueryData(taskQueryKey, (old: any) => old ? { ...old, title, description } : old);
    queryClient.setQueryData(tasksListQueryKey, (old: any) => old ? old.map((t: any) => t.id === taskId ? { ...t, title, description } : t) : old);

    titleMutation.mutate({ projectId, taskId, data: { title, description } }, {
      onSuccess: () => {
        toast.success("Saved");
        queryClient.invalidateQueries({ queryKey: taskQueryKey });
        queryClient.invalidateQueries({ queryKey: tasksListQueryKey });
      },
      onError: () => toast.error("Failed to save changes")
    });
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    deleteMutation.mutate({ projectId, taskId }, {
      onSuccess: () => {
        toast.success("Task deleted");
        queryClient.setQueryData(tasksListQueryKey, (old: any) => old ? old.filter((t: any) => t.id !== taskId) : []);
        queryClient.invalidateQueries({ queryKey: tasksListQueryKey });
        setLocation(`/projects/${projectId}`);
      }
    });
  };

  if (isLoading || !task) return (
    <div className="p-5 md:p-8 space-y-8 max-w-7xl mx-auto animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-9 w-28 bg-white/5 rounded-xl" />
        <div className="h-7 w-24 bg-white/5 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-black/40 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
          <div className="h-10 bg-white/10 rounded-xl w-3/4" />
          <div className="h-40 bg-white/5 rounded-2xl p-6" />
          <div className="flex justify-end pt-2">
            <div className="h-12 w-36 bg-white/10 rounded-xl" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-8 space-y-8">
            <div className="h-6 bg-white/10 rounded-lg w-1/3 mb-6" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-white/5 rounded-lg w-1/4" />
                <div className="h-12 bg-white/5 rounded-xl" />
              </div>
            ))}
          </div>
          <div className="h-14 bg-white/5 rounded-2xl" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-5 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
      <div className="flex items-center justify-between mb-2">
        <Button variant="ghost" asChild className="-ml-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all">
          <Link href={`/projects/${projectId}`}><ArrowLeft className="w-4 h-4 mr-2" /> Back to Project</Link>
        </Button>
        <div className="flex items-center gap-3">
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 px-3 py-1 font-medium tracking-wide">
            Task #{taskId}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] rounded-[2.5rem] overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700" />
          <CardHeader className="border-b border-white/5 p-8 relative z-10 space-y-2">
            <Textarea
              value={title}
              onChange={e => {
                if (e.target.value.length <= 150) {
                  setTitle(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }
              }}
              maxLength={150}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveText();
                }
              }}
              className="text-3xl md:text-4xl font-extrabold tracking-tight h-auto py-2 border-transparent hover:border-white/10 focus:border-purple-500/50 bg-transparent text-white placeholder:text-white/30 shadow-none px-2 rounded-xl focus-visible:ring-0 focus-visible:bg-white/5 transition-all resize-none overflow-hidden"
            />
            <div className="flex justify-end px-2">
              <span className={`text-xs font-medium ${title.length >= 150 ? "text-red-400" : "text-white/30"}`}>
                {title.length} / 150
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6 relative z-10">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={description}
                onChange={e => {
                  if (e.target.value.length <= 2000) setDescription(e.target.value);
                }}
                maxLength={2000}
                placeholder="Add a detailed description..."
                className="min-h-[100px] border-white/10 hover:border-white/20 focus:border-purple-500/50 bg-white/5 text-white placeholder:text-white/30 resize-none rounded-2xl p-6 pb-8 text-base leading-relaxed focus-visible:ring-0 transition-all overflow-hidden"
              />
              <div className="absolute bottom-3 right-4">
                <span className={`text-xs font-medium ${description.length >= 2000 ? "text-red-400" : "text-white/30"}`}>
                  {description.length} / 2000
                </span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveText} disabled={titleMutation.isPending || !title.trim()}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl px-10 h-12 shadow-[0_0_20px_rgba(139,92,246,0.4)] font-medium text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {titleMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-fuchsia-500/20 transition-all duration-700" />
            <CardHeader className="border-b border-white/5 pb-6 pt-8 px-8">
              <CardTitle className="text-white text-lg font-semibold tracking-tight">Task Properties</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8 relative z-10">
              <div className="space-y-3">
                <label className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Status
                </label>
                <Select value={status} onValueChange={handleUpdateStatus}>
                  <SelectTrigger className="bg-white/5 border-white/10 hover:border-white/20 text-white rounded-xl h-12 px-4 transition-all focus:ring-purple-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#110826] border-white/10 text-white rounded-xl shadow-2xl">
                    <SelectItem value="pending" className="focus:bg-white/10 focus:text-white py-2">Pending</SelectItem>
                    <SelectItem value="in_progress" className="focus:bg-white/10 focus:text-white py-2">In Progress</SelectItem>
                    <SelectItem value="completed" className="focus:bg-white/10 focus:text-white py-2">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-400" /> Priority
                </label>
                <Select value={priority} onValueChange={handleUpdatePriority}>
                  <SelectTrigger className="bg-white/5 border-white/10 hover:border-white/20 text-white rounded-xl h-12 px-4 transition-all focus:ring-purple-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#110826] border-white/10 text-white rounded-xl shadow-2xl">
                    <SelectItem value="low" className="focus:bg-white/10 focus:text-white py-2">Low</SelectItem>
                    <SelectItem value="medium" className="focus:bg-white/10 focus:text-white py-2">Medium</SelectItem>
                    <SelectItem value="high" className="focus:bg-white/10 focus:text-white py-2">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" /> Assignee
                </label>
                <Select value={assigneeId} onValueChange={handleUpdateAssignee}>
                  <SelectTrigger className="bg-white/5 border-white/10 hover:border-white/20 text-white rounded-xl h-12 px-4 transition-all focus:ring-purple-500/50">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#110826] border-white/10 text-white rounded-xl shadow-2xl">
                    <SelectItem value="none" className="focus:bg-white/10 focus:text-white py-2">Unassigned</SelectItem>
                    {members?.map(m => (
                      <SelectItem key={m.userId} value={m.userId.toString()} className="focus:bg-white/10 focus:text-white py-2">
                        {m.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-6 mt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Created by</span>
                  <span className="text-white/90 font-medium bg-white/5 px-2 py-1 rounded-lg border border-white/5">{task.createdBy?.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-3">
                  <span className="text-white/40">Created on</span>
                  <span className="text-white/70">{format(new Date(task.createdAt), "MMM d, yyyy")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Button variant="destructive" className="w-full rounded-2xl h-14 shadow-[0_0_20px_rgba(225,29,72,0.4)] bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 border-0 text-white font-semibold text-base transition-all" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Trash className="w-5 h-5 mr-2" />}
              Delete Task
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
