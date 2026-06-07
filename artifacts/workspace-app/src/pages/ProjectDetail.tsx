import { useGetProject, useGetProjectMembers, useAddProjectMember, useRemoveProjectMember, useListProjectTasks, useCreateTask, useUpdateProject, getGetProjectMembersQueryKey, getListProjectTasksQueryKey, getGetProjectQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Users, ShieldAlert, Shield, Briefcase, Trash, UserPlus, Settings2, BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";

const workspaceSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
});
type WorkspaceFormValues = z.infer<typeof workspaceSchema>;

const memberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "collaborator", "guest"]).default("collaborator"),
});
type MemberFormValues = z.infer<typeof memberSchema>;

const settingsSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
});
type SettingsFormValues = z.infer<typeof settingsSchema>;

function InviteProjectModalContent({ projectId, members, setInviteOpen }: { projectId: number, members: any[], setInviteOpen: (open: boolean) => void }) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("member");
  const [invitingEmail, setInvitingEmail] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const inviteMutation = useAddProjectMember();

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ["users", search],
    queryFn: async () => {
      const token = localStorage.getItem("accessToken");
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${baseUrl}/api/users?query=${encodeURIComponent(search)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to search users");
      return res.json();
    }
  });

  const onInvite = (email: string) => {
    setInvitingEmail(email);
    inviteMutation.mutate(
      { projectId, data: { email, role: role as any } },
      {
        onSuccess: () => {
          toast.success("Invitation sent to user!");
          setInvitingEmail(null);
          queryClient.invalidateQueries({ queryKey: ["users"] });
          queryClient.invalidateQueries({ queryKey: getGetProjectMembersQueryKey(projectId) });
        },
        onError: (err: any) => {
          setInvitingEmail(null);
          toast.error(err?.response?.data?.detail || "Failed to invite member.");
        },
      }
    );
  };

  return (
    <div className="space-y-5 pt-4">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
        <div className="space-y-2 flex-1 min-w-0">
          <label className="text-sm font-medium text-white/70">Search Users</label>
          <Input 
            placeholder="Search by name or email..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/5 border-white/10 text-white rounded-xl focus-visible:ring-purple-500/50"
          />
        </div>
        <div className="space-y-2 w-full sm:w-[150px] shrink-0">
          <label className="text-sm font-medium text-white/70">Role</label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-purple-500/50"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#0a0518] border-white/10 text-white">
              <SelectItem value="admin" className="focus:bg-white/10 focus:text-white">Admin</SelectItem>
              <SelectItem value="member" className="focus:bg-white/10 focus:text-white">Member</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 border border-white/10 rounded-xl p-3 h-[250px] overflow-y-auto bg-black/40 backdrop-blur-xl custom-scrollbar">
        <h4 className="text-sm font-medium text-white/50 mb-3 px-1">Platform Users</h4>
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>
        ) : isError ? (
          <div className="text-center p-4 text-sm text-red-400 bg-red-500/10 rounded-lg">Error loading users. Backend might be restarting.</div>
        ) : (!users || users.length === 0) ? (
          <div className="text-center p-8 text-sm text-white/30 border border-white/5 border-dashed rounded-lg">User not found on platform</div>
        ) : (
          <div className="space-y-2">
            {users.map((u: any) => {
              const isMember = members.some((m: any) => m.userId === u.id);
              return (
                <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all">
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-white truncate">{u.name}</div>
                    <div className="text-xs text-white/50 truncate">{u.email}</div>
                  </div>
                  <div className="shrink-0 flex justify-end">
                    {isMember ? (
                      <Badge variant="outline" className="border-white/10 text-white/40 bg-white/5 whitespace-nowrap">Already in project</Badge>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => onInvite(u.email)}
                        disabled={inviteMutation.isPending}
                        className="bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-[0_0_10px_rgba(168,85,247,0.3)] w-full sm:w-auto"
                      >
                        {invitingEmail === u.email ? (
                          <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Inviting...</>
                        ) : "Invite"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const projectId = Number(params?.id);
  const queryClient = useQueryClient();

  const [createWsOpen, setCreateWsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const { data: project, isLoading: isProjectLoading } = useGetProject(projectId);
  const { data: members, isLoading: isMembersLoading } = useGetProjectMembers(projectId);
  const { data: allWorkspaces, isLoading: isWorkspacesLoading } = useListProjectTasks(projectId, {});
  
  const projectTasks = allWorkspaces || [];

  const createTaskMutation = useCreateTask();
  const inviteMutation = useAddProjectMember();
  const removeMemberMutation = useRemoveProjectMember();

  const updateMutation = useUpdateProject();

  const taskForm = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: "", description: "" },
  });

  const memberForm = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: { email: "", role: "collaborator" },
  });

  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    values: {
      name: project?.name || "",
      description: project?.description || "",
    }
  });

  const onWsSubmit = (data: WorkspaceFormValues) => {
    createTaskMutation.mutate({ data: { ...data, projectId } }, {
      onSuccess: () => {
        toast.success("Task created successfully!");
        setCreateWsOpen(false);
        taskForm.reset();
        queryClient.invalidateQueries({ queryKey: getListProjectTasksQueryKey(projectId) });
      }
    });
  };

  const onInviteSubmit = (data: MemberFormValues) => {
    inviteMutation.mutate({ projectId, data: { email: data.email, role: data.role } }, {
      onSuccess: () => {
        toast.success("Member invited successfully!");
        setInviteOpen(false);
        memberForm.reset();
        queryClient.invalidateQueries({ queryKey: getGetProjectMembersQueryKey(projectId) });
      },
      onError: (err: any) => toast.error(err.response?.data?.detail || "Failed to invite member")
    });
  };

  const onSettingsSubmit = (data: SettingsFormValues) => {
    updateMutation.mutate({ projectId, data }, {
      onSuccess: () => {
        toast.success("Project settings updated");
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
      }
    });
  };

  const onRemoveMember = (userId: number) => {
    if (!confirm("Remove this member from the project?")) return;
    removeMemberMutation.mutate({ projectId, userId }, {
      onSuccess: () => {
        toast.success("Member removed");
        queryClient.invalidateQueries({ queryKey: getGetProjectMembersQueryKey(projectId) });
      }
    });
  };

  if (isProjectLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>;
  }

  if (!project) return <div className="text-center p-8 text-white">Project not found.</div>;

  return (
    <div className="p-5 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 break-words">{project.name}</h1>
        <div className="text-white/60 break-words">
          <p className={isDescExpanded ? "" : "line-clamp-3"}>
            {project.description || "No briefing provided."}
          </p>
          {project.description && project.description.length > 150 && (
            <button onClick={() => setIsDescExpanded(!isDescExpanded)} className="text-purple-400 hover:text-purple-300 text-sm mt-1 transition-colors font-medium">
              {isDescExpanded ? "Read less" : "Read more"}
            </button>
          )}
        </div>
        <div className="flex gap-4 mt-6">
          <div className="bg-white/5 rounded-xl px-4 py-2 border border-white/10 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-purple-400" />
            <span className="text-white text-sm">{projectTasks.length} Tasks</span>
          </div>
          <div className="bg-white/5 rounded-xl px-4 py-2 border border-white/10 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-white text-sm">{members?.length || 0} Members</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-black/40 border border-white/10 p-1.5 rounded-2xl h-auto w-full flex justify-start overflow-x-auto custom-scrollbar flex-nowrap sm:flex-wrap gap-1">
          <TabsTrigger value="overview" className="rounded-xl text-white/70 data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all h-10 px-4 sm:px-6 whitespace-nowrap shrink-0"><BarChart2 className="w-4 h-4 mr-2 shrink-0" /> Overview</TabsTrigger>
          <TabsTrigger value="workshops" className="rounded-xl text-white/70 data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all h-10 px-4 sm:px-6 whitespace-nowrap shrink-0"><Briefcase className="w-4 h-4 mr-2 shrink-0" /> Tasks</TabsTrigger>
          <TabsTrigger value="members" className="rounded-xl text-white/70 data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all h-10 px-4 sm:px-6 whitespace-nowrap shrink-0"><Users className="w-4 h-4 mr-2 shrink-0" /> Members</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl text-white/70 data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all h-10 px-4 sm:px-6 whitespace-nowrap shrink-0"><Settings2 className="w-4 h-4 mr-2 shrink-0" /> Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-xl font-bold text-white mb-4">Project Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-black/40 border-white/10">
              <CardHeader className="pb-2">
                <CardDescription className="text-white/50 uppercase tracking-widest text-xs font-semibold">Total Tasks</CardDescription>
                <CardTitle className="text-4xl text-white font-black">{projectTasks.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-black/40 border-white/10">
              <CardHeader className="pb-2">
                <CardDescription className="text-white/50 uppercase tracking-widest text-xs font-semibold">Total Collaborators</CardDescription>
                <CardTitle className="text-4xl text-white font-black">{members?.length || 0}</CardTitle>
              </CardHeader>
            </Card>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-white/40 mt-8">
            Detailed project-level analytics pipeline is currently deploying. Check back later for task completion rates.
          </div>
        </TabsContent>
        
        <TabsContent value="workshops" className="mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Project Tasks</h2>
            <Dialog open={createWsOpen} onOpenChange={setCreateWsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                  <Plus className="w-4 h-4 mr-2" /> Initialize Task
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0a0518] border-white/10 text-white rounded-2xl sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>New Task</DialogTitle>
                </DialogHeader>
                <Form {...taskForm}>
                  <form onSubmit={taskForm.handleSubmit(onWsSubmit)} className="space-y-4 pt-4">
                    <FormField control={taskForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70">Task Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Design Team" {...field} className="bg-white/5 border-white/10 text-white rounded-xl" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )} />
                    <FormField control={taskForm.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70">Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Purpose..." {...field} className="bg-white/5 border-white/10 text-white rounded-xl resize-none h-24" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )} />
                    <Button type="submit" disabled={createTaskMutation.isPending} className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-xl mt-2 h-11">
                      {createTaskMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Create Task"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {isWorkspacesLoading ? (
            <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>
          ) : projectTasks.length === 0 ? (
            <div className="text-center p-12 border border-white/5 border-dashed rounded-3xl bg-white/[0.02]">
              <p className="text-white/40">No workshops exist in this project yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projectTasks.map((ws: any) => (
                <Link key={ws.id} href={`/workspaces/${ws.id}`}>
                  <Card className="bg-black/40 border-white/10 rounded-2xl flex flex-col hover:border-purple-500/40 hover:bg-white/[0.02] transition-colors cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">{ws.name}</CardTitle>
                      <CardDescription className="text-white/40 line-clamp-2">{ws.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto border-t border-white/5 pt-4">
                      <div className="text-xs text-white/30">Created {format(new Date(ws.createdAt), "MMM d, yyyy")}</div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Project Roster</h2>
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl">
                  <UserPlus className="w-4 h-4 mr-2" /> Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0a0518] border-white/10 text-white rounded-2xl sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Invite to Project</DialogTitle>
                </DialogHeader>
                <InviteProjectModalContent projectId={projectId} members={members || []} setInviteOpen={setInviteOpen} />
              </DialogContent>
            </Dialog>
          </div>

          {isMembersLoading ? (
            <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>
          ) : (
            <div className="grid gap-4">
              {members?.map((m: any) => (
                <div key={m.userId} className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex shrink-0 items-center justify-center border border-purple-500/30 text-purple-300 font-bold">
                      {m.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-white truncate">{m.user?.name}</div>
                      <div className="text-xs text-white/50 truncate">{m.user?.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <Badge variant="outline" className="border-purple-500/30 text-purple-300 bg-purple-500/10 shrink-0">
                      {m.role === "owner" ? <ShieldAlert className="w-3 h-3 mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
                      {m.role}
                    </Badge>
                    {m.role !== "owner" && (
                      <Button variant="ghost" size="icon" onClick={() => onRemoveMember(m.userId)} className="text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg shrink-0 h-8 w-8">
                        <Trash className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-xl font-bold text-white mb-4">Project Configuration</h2>
          <Card className="bg-black/40 border-white/10 max-w-2xl">
            <CardHeader>
              <CardTitle className="text-white">General Settings</CardTitle>
              <CardDescription className="text-white/40">Update core project details.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-4">
                  <FormField control={settingsForm.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Project Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-white/5 border-white/10 text-white rounded-xl" />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )} />
                  <FormField control={settingsForm.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="bg-white/5 border-white/10 text-white rounded-xl resize-none h-24" />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )} />
                  <Button type="submit" disabled={updateMutation.isPending} className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl mt-2">
                    {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
