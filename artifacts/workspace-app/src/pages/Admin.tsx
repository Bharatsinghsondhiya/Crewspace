import { useGetProjects, useCreateProject, useDeleteProject, getGetProjectsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FolderGit2, Plus, ArrowRight, Trash, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function Admin() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  
  const { data: projects, isLoading } = useGetProjects({});
  const createMutation = useCreateProject();
  const deleteMutation = useDeleteProject();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", description: "" },
  });

  const onSubmit = (data: ProjectFormValues) => {
    createMutation.mutate({ data }, {
      onSuccess: () => {
        toast.success("Project created successfully!");
        setCreateOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getGetProjectsQueryKey() });
      },
      onError: () => toast.error("Failed to create project")
    });
  };

  const onDelete = (e: React.MouseEvent, projectId: number) => {
    e.preventDefault();
    if (!confirm("Delete project permanently? This will destroy all nested workspaces and tasks. Cannot be undone.")) return;
    deleteMutation.mutate({ projectId }, {
      onSuccess: () => {
        toast.success("Project deleted");
        queryClient.invalidateQueries({ queryKey: getGetProjectsQueryKey() });
      },
      onError: () => toast.error("Failed to delete project")
    });
  };

  return (
    <div className="p-5 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center border border-white/10 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <FolderGit2 className="w-6 h-6 text-white" />
            </div>
            Project Hub
          </h1>
          <p className="text-white/50 mt-2 text-sm md:text-base">Master control. Create high-level projects, spin up workshops, and orchestrate teams.</p>
        </div>
        
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.4)] h-11 px-6">
              <Plus className="mr-2 h-5 w-5" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0a0518] border-white/10 text-white rounded-2xl shadow-2xl sm:max-w-md w-[95%]">
            <DialogHeader>
              <DialogTitle className="text-xl">Initialize Project</DialogTitle>
              <DialogDescription className="text-white/50">Create a new organizational root for workspaces.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Project Designation</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Project Apollo" {...field} className="bg-white/5 border-white/10 text-white rounded-xl focus-visible:ring-purple-500/50" />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">Briefing (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Mission parameters..." {...field} className="bg-white/5 border-white/10 text-white rounded-xl focus-visible:ring-purple-500/50 resize-none h-24" />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )} />
                <Button type="submit" disabled={createMutation.isPending} className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-[0_0_10px_rgba(168,85,247,0.3)] mt-2 h-11">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Deploy Project"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>
      ) : projects?.length === 0 ? (
        <div className="text-center p-12 border border-white/5 border-dashed rounded-3xl bg-white/[0.02]">
          <FolderGit2 className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white/80">No Active Projects</h3>
          <p className="text-white/40 mt-1">Deploy your first project to begin orchestrating workspaces.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects?.map(project => (
            <Link key={project.id} href={`/admin/projects/${project.id}`}>
              <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2rem] hover:bg-white/[0.04] transition-all cursor-pointer relative overflow-hidden group h-full flex flex-col hover:border-purple-500/30">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start gap-4">
                    <CardTitle className="text-xl text-white break-words line-clamp-1">{project.name}</CardTitle>
                    <Button variant="ghost" size="icon" onClick={(e) => onDelete(e, project.id)} className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 rounded-full shrink-0 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardDescription className="text-white/40 line-clamp-2 mt-1 min-h-[40px]">
                    {project.description || "No briefing provided."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="text-sm text-white/50">
                    Deployed <span className="text-white/80">{format(new Date(project.createdAt), "MMM d")}</span>
                  </div>
                  <div className="text-purple-400 group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
