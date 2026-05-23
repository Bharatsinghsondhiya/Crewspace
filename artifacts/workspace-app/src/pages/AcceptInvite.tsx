import { useGetInvite, useAcceptInvite } from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function AcceptInvite() {
  const params = useParams<{ token: string }>();
  const token = params.token || "";
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: invite, isLoading, error } = useGetInvite(token, {
    query: { enabled: !!token, retry: false }
  });

  const acceptMutation = useAcceptInvite();

  const handleAccept = () => {
    if (!user) {
      toast.error("Please login first to accept the invitation");
      setLocation("/login");
      return;
    }
    
    acceptMutation.mutate(
      { data: { token } },
      {
        onSuccess: () => {
          toast.success("Successfully joined the workspace!");
          setLocation(`/workspaces/${invite?.workspaceId}`);
        },
        onError: (err: any) => {
          toast.error(err?.data?.detail || "Failed to accept invitation");
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid, expired, or has already been accepted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => setLocation("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Workspace Invitation</CardTitle>
          <CardDescription className="text-base mt-2">
            You have been invited to join a workspace as a <strong>{invite.role}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg text-center border border-border">
            <p className="text-sm text-muted-foreground">Invited email</p>
            <p className="font-medium text-foreground">{invite.email}</p>
          </div>
          
          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleAccept}
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {acceptMutation.isPending ? "Joining..." : "Accept Invitation"}
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={() => setLocation("/dashboard")}
          >
            Decline & Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
