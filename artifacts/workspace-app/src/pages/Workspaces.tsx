import { useListWorkspaces, useCreateWorkspace, getListWorkspacesQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Users, LayoutList, Briefcase, Loader2, MoreVertical, CheckCircle, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const createSchema = z.object({
  name: z.string().min(1, "Workspace name is required"),
  description: z.string().optional(),
});

type CreateFormValues = z.infer<typeof createSchema>;

const ICON_COLORS = [
  { bg: "bg-blue-500/25", text: "text-blue-400", glow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]" },
  { bg: "bg-purple-500/25", text: "text-purple-400", glow: "shadow-[0_0_15px_rgba(139,92,246,0.3)]" },
  { bg: "bg-pink-500/25", text: "text-pink-400", glow: "shadow-[0_0_15px_rgba(236,72,153,0.3)]" },
  { bg: "bg-orange-500/25", text: "text-orange-400", glow: "shadow-[0_0_15px_rgba(249,115,22,0.3)]" },
  { bg: "bg-emerald-500/25", text: "text-emerald-400", glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]" },
];

export default function Workspaces() {
  const { data: workspaces, isLoading } = useListWorkspaces();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const createMutation = useCreateWorkspace();

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", description: "" },
  });

  const onSubmit = (data: CreateFormValues) => {
    createMutation.mutate({ data }, {
      onSuccess: (newWorkspace) => {
        queryClient.invalidateQueries({ queryKey: getListWorkspacesQueryKey() });
        setOpen(false);
        toast.success("Workspace created");
        form.reset();
        if (newWorkspace?.id) setLocation(`/workspaces/${newWorkspace.id}/tasks`);
      },
      onError: () => toast.error("Failed to create workspace"),
    });
  };

  return (
    <div className="p-5 md:p-7 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Workspaces</h1>
          <p className="text-white/45 mt-1 text-sm">Manage your teams and projects.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white border-0 shadow-[0_0_20px_rgba(139,92,246,0.3)] rounded-xl font-semibold px-4 md:px-5">
              <Plus className="mr-2 h-4 w-4" /> New Workspace
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95%] sm:max-w-[425px] border-white/10 rounded-3xl p-6 md:p-8"
            style={{ background: "rgba(15, 8, 35, 0.95)", backdropFilter: "blur(40px)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(139, 92, 246, 0.15)" }}>
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl text-white font-bold tracking-tight">Create Workspace</DialogTitle>
              <DialogDescription className="text-white/50 text-sm mt-1">Set up a new collaborative environment.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70 text-sm font-medium">Workspace Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Engineering Team" {...field} className="bg-white/5 border-white/10 text-white rounded-xl focus-visible:ring-purple-500/50 h-11 px-4 placeholder:text-white/20 transition-all" />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70 text-sm font-medium">Description <span className="text-white/30 font-normal">(Optional)</span></FormLabel>
                    <FormControl>
                      <Textarea placeholder="What is this workspace for?" {...field} className="bg-white/5 border-white/10 text-white rounded-xl focus-visible:ring-purple-500/50 min-h-[100px] p-4 resize-none placeholder:text-white/20 transition-all" />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )} />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.4)] h-11 px-8 font-medium transition-all">
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {createMutation.isPending ? "Creating..." : "Create Workspace"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
            <p className="text-white/50 text-sm animate-pulse">Loading workspaces...</p>
          </div>
        </div>
      ) : workspaces && workspaces.length > 0 ? (
        <>
          {/* Promo Banner */}
          <div className="rounded-[2.5rem] border border-fuchsia-500/30 p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden shadow-[0_0_50px_rgba(217,70,239,0.15)] group"
            style={{ background: "linear-gradient(135deg, rgba(20,10,40,0.95) 0%, rgba(40,15,60,0.95) 100%)" }}>
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600/10 to-blue-600/10 pointer-events-none group-hover:from-fuchsia-600/20 group-hover:to-blue-600/20 transition-all duration-700" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="flex-1 z-10 relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-fuchsia-300 text-xs font-semibold mb-4 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" /> Platform Features
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">Powerful collaboration for modern teams</h3>
              <p className="text-white/60 text-base mb-6 max-w-lg leading-relaxed">Organize your work, track progress, and achieve more together in one unified workspace.</p>
              <div className="space-y-3">
                {["Create workspaces for teams or projects", "Assign tasks and track progress", "Stay updated with real-time notifications"].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-white/70 font-medium">
                    <div className="w-6 h-6 rounded-full bg-fuchsia-500/20 flex items-center justify-center shrink-0 border border-fuchsia-500/30">
                      <CheckCircle className="w-3.5 h-3.5 text-fuchsia-400" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden md:flex w-64 h-48 items-center justify-center z-10 relative perspective-[1000px]">
              {/* Abstract illustration */}
              <div className="relative w-full h-full transform-gpu rotate-y-[-10deg] rotate-x-[5deg] group-hover:rotate-y-[-5deg] group-hover:rotate-x-[2deg] transition-all duration-700">
                <div className="absolute inset-0 rounded-2xl border border-fuchsia-500/30 shadow-[0_0_30px_rgba(217,70,239,0.2)] bg-black/40 backdrop-blur-xl" />
                <div className="absolute top-6 left-6 w-32 h-4 rounded-full bg-fuchsia-500/30 shadow-[0_0_10px_rgba(217,70,239,0.4)]" />
                <div className="absolute top-14 left-6 w-20 h-3 rounded-full bg-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.4)]" />
                <div className="absolute top-22 left-6 w-24 h-3 rounded-full bg-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.4)]" />
                
                <div className="absolute bottom-6 right-6 w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/40 shadow-[0_0_20px_rgba(217,70,239,0.4)] flex items-center justify-center animate-bounce" style={{ animationDuration: '3s' }}>
                  <ArrowRight className="w-5 h-5 text-fuchsia-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace, idx) => {
              const color = ICON_COLORS[idx % ICON_COLORS.length];
              return (
                <Link key={workspace.id} href={`/workspaces/${workspace.id}/tasks`}>
                  <div className="group rounded-2xl border border-white/8 p-5 cursor-pointer transition-all hover:-translate-y-1 hover:border-purple-500/25 hover:shadow-[0_8px_32px_rgba(139,92,246,0.12)] relative"
                    style={{ background: "rgba(20, 12, 45, 0.7)" }}>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color.bg} ${color.glow}`}>
                        <Briefcase className={`w-5 h-5 ${color.text}`} />
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                        onClick={(e) => e.preventDefault()}>
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="font-semibold text-white text-base leading-tight">{workspace.name}</h3>
                    <p className="text-white/40 text-xs mt-1 line-clamp-1">{workspace.description || "No description"}</p>
                    <div className="flex items-center gap-4 mt-4 text-xs text-white/40">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {workspace.memberCount} Members
                      </div>
                      <div className="flex items-center gap-1.5">
                        <LayoutList className="h-3.5 w-3.5" />
                        {workspace.taskCount} Tasks
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-20 rounded-2xl border border-white/8" style={{ background: "rgba(20, 12, 45, 0.7)" }}>
          <Briefcase className="mx-auto h-12 w-12 text-purple-400/40 mb-4" />
          <h3 className="text-lg font-semibold text-white">No workspaces yet</h3>
          <p className="mt-2 text-white/40 text-sm">Create your first workspace to get started.</p>
        </div>
      )}
    </div>
  );
}
