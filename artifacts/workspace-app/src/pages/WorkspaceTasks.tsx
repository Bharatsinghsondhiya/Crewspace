import { useListWorkspaceProjects, useCreateProject, useGetWorkspaceMembers, useGetWorkspace, getListWorkspaceProjectsQueryKey, getGetWorkspaceMembersQueryKey, getGetWorkspaceQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, FolderGit2, Users, Settings, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";

const createSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
});

type CreateFormValues = z.infer<typeof createSchema>;

export default function WorkspaceProjects() {
  const params = useParams<{ id: string }>();
  const workspaceId = parseInt(params.id || "0", 10);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Fetch projects directly scoped to this workspace
  const { data: projects = [], isLoading: projectsLoading } = useListWorkspaceProjects(workspaceId, {
    query: { enabled: !!workspaceId, queryKey: getListWorkspaceProjectsQueryKey(workspaceId) }
  });

  const { data: members } = useGetWorkspaceMembers(workspaceId, {
    query: { enabled: !!workspaceId, queryKey: getGetWorkspaceMembersQueryKey(workspaceId) }
  });

  const { data: workspace } = useGetWorkspace(workspaceId, {
    query: { enabled: !!workspaceId, queryKey: getGetWorkspaceQueryKey(workspaceId) },
  });

  const { user } = useAuth();
  const currentMember = members?.find(m => m.userId === user?.id);
  const isAdmin = currentMember?.role === "admin" || workspace?.ownerId === user?.id || user?.isSuperAdmin;

  const createMutation = useCreateProject();

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", description: "" },
  });

  const onSubmit = (data: CreateFormValues) => {
    createMutation.mutate(
      { data: { ...data, workspaceId } },
      {
        onSuccess: () => {
          setOpen(false);
          toast.success("Project created!");
          form.reset();
          queryClient.invalidateQueries({ queryKey: getListWorkspaceProjectsQueryKey(workspaceId) });
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.detail || "Failed to create project");
        }
      }
    );
  };

  if (projectsLoading) {
    return (
      <div className="p-5 md:p-6 max-w-[1600px] mx-auto min-h-screen flex flex-col">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between shrink-0 gap-4 mb-6">
          <div className="space-y-2 animate-pulse">
            <div className="h-8 w-32 bg-white/10 rounded-xl" />
            <div className="h-4 w-56 bg-white/5 rounded-lg" />
          </div>
          <div className="flex items-center gap-3 animate-pulse">
            <div className="h-9 w-28 bg-white/10 rounded-xl" />
          </div>
        </div>
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-2xl border border-white/8 p-5 space-y-4 animate-pulse"
              style={{ background: "rgba(20, 10, 45, 0.4)" }}>
              <div className="h-10 w-10 rounded-xl bg-white/10" />
              <div className="h-5 w-3/4 bg-white/10 rounded-lg" />
              <div className="h-3 w-full bg-white/5 rounded" />
              <div className="h-3 w-2/3 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between shrink-0 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Projects</h1>
          <p className="text-white/45 mt-1 text-sm">
            {workspace?.name ? `Projects inside "${workspace.name}"` : "Manage projects in this workspace."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Settings link */}
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
                  <Plus className="w-4 h-4 mr-2" /> New Project
                </Button>
              </DialogTrigger>
              <DialogContent
                className="w-[95%] sm:max-w-[480px] border-white/10 rounded-3xl p-6 md:p-8"
                style={{ background: "rgba(15, 8, 35, 0.95)", backdropFilter: "blur(40px)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(139, 92, 246, 0.15)" }}
              >
                <DialogHeader className="mb-2">
                  <DialogTitle className="text-xl text-white font-bold tracking-tight">Create Project</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-sm font-medium">Project Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Website Redesign" className="bg-white/5 border-white/10 text-white rounded-xl focus-visible:ring-purple-500/50 h-11 px-4 placeholder:text-white/20" />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-sm font-medium">Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="What is this project about?" className="bg-white/5 border-white/10 text-white rounded-xl focus-visible:ring-purple-500/50 min-h-[90px] p-4 resize-none placeholder:text-white/20" />
                        </FormControl>
                      </FormItem>
                    )} />
                    <div className="flex justify-end pt-2">
                      <Button type="submit" disabled={createMutation.isPending}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.4)] h-11 px-8 font-medium">
                        {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {createMutation.isPending ? "Creating..." : "Create Project"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Project Cards */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-white/5 border-dashed rounded-3xl"
          style={{ background: "rgba(20, 10, 45, 0.3)" }}>
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
            <FolderGit2 className="w-8 h-8 text-purple-400/50" />
          </div>
          <p className="text-white/50 font-medium">No projects yet</p>
          <p className="text-white/25 text-sm mt-1">
            {isAdmin ? "Create your first project to get started." : "No projects have been created in this workspace yet."}
          </p>
          {isAdmin && (
            <Button onClick={() => setOpen(true)} className="mt-5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project: any) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div
                className="group rounded-2xl border border-white/8 p-5 cursor-pointer transition-all hover:-translate-y-1 hover:border-purple-500/30 hover:shadow-[0_8px_32px_rgba(139,92,246,0.12)]"
                style={{ background: "rgba(20, 12, 45, 0.7)" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
                    <FolderGit2 className="w-5 h-5 text-purple-400" />
                  </div>
                  <Badge className="text-[10px] bg-purple-500/10 text-purple-300 border-purple-500/20 border">
                    {project.myRole ?? "member"}
                  </Badge>
                </div>

                <h3 className="font-semibold text-white text-base mb-1 leading-snug line-clamp-1">
                  {project.name}
                </h3>
                <p className="text-white/40 text-xs line-clamp-2 leading-relaxed mb-4">
                  {project.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-[10px] text-white/25">
                    {format(new Date(project.createdAt), "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-purple-400 group-hover:text-purple-300 font-medium transition-colors">
                    Open <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
