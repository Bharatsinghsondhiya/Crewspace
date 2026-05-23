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
      const res = await fetch(`/api/users?query=${encodeURIComponent(search)}`, {
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
    <div className="space-y-4 pt-4">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
        <div className="space-y-2 flex-1">
          <Label>Search Users</Label>
          <Input 
            placeholder="Search by name or email..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <div className="space-y-2 w-full sm:w-[150px]">
          <Label>Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 border rounded-md p-2 h-[250px] overflow-y-auto bg-muted/20">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Platform Users</h4>
        {isLoading ? (
          <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : isError ? (
          <div className="text-center p-4 text-sm text-destructive">Error loading users. Backend might be restarting.</div>
        ) : (!users || users.length === 0) ? (
          <div className="text-center p-4 text-sm text-muted-foreground">User not found on platform</div>
        ) : (
          <div className="space-y-2">
            {users.map((u: any) => {
              const isMember = members.some((m: any) => m.userId === u.id);
              return (
                <div key={u.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 border border-transparent hover:border-border transition-colors">
                  <div>
                    <div className="font-medium text-sm">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                  {isMember ? (
                    <Badge variant="secondary">Already in workspace</Badge>
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={() => onInvite(u.email)}
                      disabled={inviteMutation.isPending}
                    >
                      {invitingEmail === u.email ? (
                        <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Inviting...</>
                      ) : "Invite"}
                    </Button>
                  )}
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
  role: z.enum(["manager", "member", "viewer"]).default("member"),
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

  const onUpdateRole = (userId: number, role: "manager" | "member" | "viewer") => {
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
  const isManagerOrOwner = currentMember?.role === "owner" || currentMember?.role === "manager" || workspace.ownerId === user?.id || user?.role === "admin";

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">{workspace.name}</h1>
          <p className="text-muted-foreground mt-2 break-words">{workspace.description || "No description"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/analytics/${id}`}>
            <Button variant="outline">
              <BarChart className="mr-2 h-4 w-4" /> Analytics
            </Button>
          </Link>
          <Link href={`/workspaces/${id}/tasks`}>
            <Button>View Tasks</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card border-border hover:border-primary/50 transition-all duration-500 min-w-0">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Members</span>
              <span className="font-medium">{workspace.memberCount || members?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Tasks</span>
              <span className="font-medium">{workspace.taskCount || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">{format(new Date(workspace.createdAt), "MMM d, yyyy")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border lg:col-span-2 hover:border-primary/50 transition-all duration-500 delay-100 min-w-0">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 items-start">
            <div className="space-y-1">
              <CardTitle>Members</CardTitle>
              <CardDescription>People with access to this workspace</CardDescription>
            </div>
            {isManagerOrOwner && (
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Invite</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Member</DialogTitle>
                  </DialogHeader>
                  <InviteModalContent workspaceId={id} members={members || []} setInviteOpen={setInviteOpen} />
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="rounded-md border border-border overflow-x-auto">
                <Table className="min-w-[500px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      {isManagerOrOwner && <TableHead className="w-[50px]"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members?.map(member => (
                      <TableRow key={member.userId}>
                        <TableCell>
                          <div className="font-medium">{member.user.name}</div>
                          <div className="text-xs text-muted-foreground">{member.user.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.role === "owner" || member.role === "manager" ? "default" : "secondary"}>
                            {member.role === "owner" || member.role === "manager" ? <ShieldAlert className="w-3 h-3 mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
                            {member.role}
                          </Badge>
                        </TableCell>
                        {isManagerOrOwner && (
                          <TableCell>
                            {member.userId !== user?.id && member.role !== "owner" && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => onUpdateRole(member.userId, member.role === "manager" ? "member" : "manager")}>
                                    Make {member.role === "manager" ? "Member" : "Manager"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onRemove(member.userId)} className="text-destructive">
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
