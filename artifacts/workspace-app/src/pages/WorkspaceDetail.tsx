import { useAuth } from "@/context/AuthContext";
import { useGetWorkspace, useGetWorkspaceMembers, useCreateInvite, useUpdateMemberRole, useRemoveWorkspaceMember, getGetWorkspaceQueryKey, getGetWorkspaceMembersQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Shield, ShieldAlert, Trash, BarChart, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";

function InviteModalContent({ workspaceId, members, setInviteOpen }: { workspaceId: number, members: any[], setInviteOpen: (open: boolean) => void }) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("member");
  const [invitingEmail, setInvitingEmail] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const inviteMutation = useCreateInvite();

  const { data: users, isLoading, isError, error } = useQuery({
    queryKey: ["users", search],
    queryFn: async () => {
      const token = localStorage.getItem("accessToken");
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${baseUrl}/api/users?workspace_id=${workspaceId}&query=${encodeURIComponent(search)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to search users");
      return res.json();
    }
  });

  const onInvite = (email: string) => {
    setInvitingEmail(email);
    inviteMutation.mutate(
      { workspaceId, data: { email, role: role as any } },
      {
        onSuccess: () => {
          toast.success("Invitation sent to user!");
          setInvitingEmail(null);
          queryClient.invalidateQueries({ queryKey: ["users"] });
          queryClient.invalidateQueries({ queryKey: getGetWorkspaceMembersQueryKey(workspaceId) });
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
          <Label className="text-white/70">Search Users</Label>
          <Input 
            placeholder="Search by name or email..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/5 border-white/10 text-white rounded-xl focus-visible:ring-purple-500/50"
          />
        </div>
        <div className="space-y-2 w-full sm:w-[150px] shrink-0">
          <Label className="text-white/70">Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-purple-500/50"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#0a0518] border-white/10 text-white">
              <SelectItem value="admin" className="focus:bg-white/10 focus:text-white">Admin</SelectItem>
              <SelectItem value="member" className="focus:bg-white/10 focus:text-white">Member</SelectItem>
              <SelectItem value="viewer" className="focus:bg-white/10 focus:text-white">Viewer</SelectItem>
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
                      <Badge variant="outline" className="border-white/10 text-white/40 bg-white/5 whitespace-nowrap">Already in workspace</Badge>
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

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member", "viewer"]).default("member"),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export default function WorkspaceDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0", 10);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: workspace, isLoading: wsLoading } = useGetWorkspace(id, {
    query: { enabled: !!id, queryKey: getGetWorkspaceQueryKey(id) },
  });
  
  const { data: members, isLoading: membersLoading } = useGetWorkspaceMembers(id, {
    query: { enabled: !!id, queryKey: getGetWorkspaceMembersQueryKey(id) },
  });

  const inviteMutation = useCreateInvite();
  const updateRoleMutation = useUpdateMemberRole();
  const removeMemberMutation = useRemoveWorkspaceMember();

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const onInvite = (data: InviteFormValues) => {
    inviteMutation.mutate(
      { workspaceId: id, data },
      {
        onSuccess: (response) => {
          const inviteUrl = `${window.location.origin}/invites/${response.token}`;
          toast.success("Invite link generated!", {
            description: inviteUrl,
            action: {
              label: "Copy",
              onClick: () => navigator.clipboard.writeText(inviteUrl)
            },
            duration: 10000
          });
          setInviteOpen(false);
          form.reset();
          queryClient.invalidateQueries({ queryKey: getGetWorkspaceMembersQueryKey(id) });
        },
        onError: () => toast.error("Failed to invite member"),
      }
    );
  };

  const onUpdateRole = (userId: number, role: "admin" | "member" | "viewer") => {
    updateRoleMutation.mutate(
      { workspaceId: id, userId, params: { role } },
      {
        onSuccess: () => {
          toast.success("Role updated");
          queryClient.invalidateQueries({ queryKey: getGetWorkspaceMembersQueryKey(id) });
        },
        onError: () => toast.error("Failed to update role"),
      }
    );
  };

  const onRemove = (userId: number) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    removeMemberMutation.mutate(
      { workspaceId: id, userId },
      {
        onSuccess: () => {
          toast.success("Member removed");
          queryClient.invalidateQueries({ queryKey: getGetWorkspaceMembersQueryKey(id) });
        },
        onError: () => toast.error("Failed to remove member"),
      }
    );
  };

  if (wsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] animate-in fade-in duration-700">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!workspace) return <div className="p-8 text-center">Workspace not found</div>;

  const currentMember = members?.find(m => m.userId === user?.id);
  const isAdminOrOwner = currentMember?.role === "owner" || currentMember?.role === "admin" || workspace.ownerId === user?.id || user?.isSuperAdmin;

  return (
    <div className="p-5 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white break-words">{workspace.name}</h1>
          <p className="text-white/50 mt-2 break-words">{workspace.description || "No description provided."}</p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Link href={`/analytics/${id}`}>
            <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white rounded-xl">
              <BarChart className="mr-2 h-4 w-4 text-purple-400" /> Analytics
            </Button>
          </Link>
          <Link href={`/workspaces/${id}/projects`}>
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.4)]">
              View Projects
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2rem] hover:bg-white/[0.02] transition-colors relative overflow-hidden group min-w-0 md:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
          <CardHeader className="pb-4 border-b border-white/5">
            <CardTitle className="text-white text-xl">Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-6">
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-white/50 text-sm font-medium">Members</span>
              <span className="font-bold text-white text-lg">{workspace.memberCount || members?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-white/50 text-sm font-medium">Tasks</span>
              <span className="font-bold text-white text-lg">{workspace.taskCount || 0}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-white/50 text-sm font-medium">Created</span>
              <span className="font-semibold text-white/90 text-sm">{format(new Date(workspace.createdAt), "MMM d, yyyy")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2rem] md:col-span-2 lg:col-span-3 hover:bg-white/[0.02] transition-colors relative overflow-hidden group min-w-0 flex flex-col">
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 items-start pb-4 border-b border-white/5">
            <div className="space-y-1">
              <CardTitle className="text-white">Members</CardTitle>
              <CardDescription className="text-white/40">People with access to this workspace</CardDescription>
            </div>
            {isAdminOrOwner && (
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.4)] w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Invite</Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0a0518] border-white/10 text-white rounded-2xl shadow-2xl sm:max-w-md w-[95%]">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Invite Member</DialogTitle>
                  </DialogHeader>
                  <InviteModalContent workspaceId={id} members={members || []} setInviteOpen={setInviteOpen} />
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
            {membersLoading ? (
              <div className="flex justify-center items-center p-12 flex-1">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar flex-1">
                <Table className="min-w-[600px] w-full">
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-white/40 font-semibold uppercase tracking-wider text-xs px-6 py-4">User</TableHead>
                      <TableHead className="text-white/40 font-semibold uppercase tracking-wider text-xs px-6 py-4">Role</TableHead>
                      {isAdminOrOwner && <TableHead className="w-[80px] px-6 py-4"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members?.map(member => (
                      <TableRow key={member.userId} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                              <span className="text-sm font-bold text-purple-300">
                                {member.user.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-white truncate text-base">{member.user.name}</div>
                              <div className="text-sm text-white/40 truncate mt-0.5">{member.user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge variant={member.role === "owner" || member.role === "admin" ? "default" : "secondary"} className={member.role === "owner" ? "bg-purple-500/20 text-purple-300 border-purple-500/30" : member.role === "admin" ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" : "bg-white/5 text-white/60 border-white/10"}>
                            {member.role === "owner" || member.role === "admin" ? <ShieldAlert className="w-3 h-3 mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
                            {member.role}
                          </Badge>
                        </TableCell>
                        {isAdminOrOwner && (
                          <TableCell className="px-6 py-4 text-right">
                            {member.userId !== user?.id && member.role !== "owner" && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="text-white/40 hover:text-white hover:bg-white/10 rounded-xl h-8 w-8"><MoreHorizontal className="w-5 h-5" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#0a0518] border-white/10 text-white rounded-xl shadow-2xl min-w-[160px] p-1.5">
                                  <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 focus:text-white cursor-pointer rounded-lg py-2" onClick={() => onUpdateRole(member.userId, member.role === "admin" ? "member" : "admin")}>
                                    Make {member.role === "admin" ? "Member" : "Admin"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-400 cursor-pointer rounded-lg py-2 mt-1" onClick={() => onRemove(member.userId)}>
                                    <Trash className="w-4 h-4 mr-2" /> Remove
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
