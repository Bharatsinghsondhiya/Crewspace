import { useAuth } from "@/context/AuthContext";
import { useListWorkspaces, useGetDashboardSummary, useGetAdminStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, Layout, Shield, Users, Briefcase, BarChart3, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

function AdminDashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const isLoading = summaryLoading || statsLoading;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <Badge className="bg-violet-600 hover:bg-violet-600 text-white gap-1 shrink-0">
              <Shield className="h-3 w-3" /> Admin
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">Here is what's happening across the platform today.</p>
        </div>
        <Button asChild variant="outline" className="border-violet-500 text-violet-400 hover:bg-violet-500/10">
          <Link href="/admin">
            <Shield className="mr-2 h-4 w-4" />
            Manage Users
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center min-h-[40vh] animate-in fade-in duration-700">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium animate-pulse">Loading dashboard...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Platform stats */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Platform Overview</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-2xl sm:rounded-[2rem] hover:shadow-[0_8px_32px_0_rgba(120,119,198,0.2)] hover:-translate-y-1 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-violet-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalUsers ?? "—"}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stats?.activeUsers ?? 0} active</p>
                </CardContent>
              </Card>
              <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-2xl sm:rounded-[2rem] hover:shadow-[0_8px_32px_0_rgba(120,119,198,0.2)] hover:-translate-y-1 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Workspaces</CardTitle>
                  <Briefcase className="h-4 w-4 text-violet-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalWorkspaces ?? "—"}</div>
                </CardContent>
              </Card>
              <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-2xl sm:rounded-[2rem] hover:shadow-[0_8px_32px_0_rgba(120,119,198,0.2)] hover:-translate-y-1 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
                  <BarChart3 className="h-4 w-4 text-violet-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalTasks ?? "—"}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stats?.completedTasks ?? 0} completed</p>
                </CardContent>
              </Card>
              <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-2xl sm:rounded-[2rem] hover:shadow-[0_8px_32px_0_rgba(120,119,198,0.2)] hover:-translate-y-1 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">My Workspaces</CardTitle>
                  <Layout className="h-4 w-4 text-violet-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.totalWorkspaces ?? "—"}</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Role breakdown */}
          {stats && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">User Roles</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {stats.usersByRole.map((r: { label: string; count: number }) => (
                  <Card key={r.label} className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-2xl sm:rounded-[2rem] hover:border-primary/50 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground capitalize">{r.label}s</CardTitle>
                      {r.label === "admin" ? (
                        <Shield className="h-4 w-4 text-violet-400" />
                      ) : (
                        <Users className="h-4 w-4 text-blue-400" />
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{r.count}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recent activity */}
          <ActivityFeed activities={summary?.recentActivity ?? []} />
        </>
      )}
    </div>
  );
}

function MemberDashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading } = useGetDashboardSummary();

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back, {user?.name}</h1>
            <Badge className="bg-blue-600 hover:bg-blue-600 text-white gap-1 shrink-0">
              <Users className="h-3 w-3" /> Member
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">Here is what's happening across your workspaces today.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/workspaces">
            <Briefcase className="mr-2 h-4 w-4" />
            My Workspaces
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {isLoading || !summary ? (
        <div className="flex-1 flex items-center justify-center min-h-[40vh] animate-in fade-in duration-700">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium animate-pulse">Loading dashboard...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-2xl sm:rounded-[2rem] hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">My Tasks</CardTitle>
                <Layout className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.myTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">assigned to me</p>
              </CardContent>
            </Card>
            <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-2xl sm:rounded-[2rem] hover:border-yellow-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                <Circle className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.myPendingTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">to be done</p>
              </CardContent>
            </Card>
            <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-2xl sm:rounded-[2rem] hover:border-green-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.myCompletedTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">tasks done</p>
              </CardContent>
            </Card>
            <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-2xl sm:rounded-[2rem] hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Workspaces</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalWorkspaces}</div>
                <p className="text-xs text-muted-foreground mt-1">joined</p>
              </CardContent>
            </Card>
          </div>

          <ActivityFeed activities={summary.recentActivity} />
        </>
      )}
    </div>
  );
}

function ActivityFeed({ activities }: { activities: any[] }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
      <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
      <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300">
        <CardContent className="p-0">
          {activities.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No recent activity</div>
          ) : (
            <div className="divide-y divide-border">
              {activities.map((activity) => (
                <div key={activity.id} className="p-4 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 text-sm font-medium">
                    {activity.user?.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      <span className="text-foreground">{activity.user?.name}</span>{" "}
                      <span className="text-muted-foreground">{activity.action}</span>{" "}
                      {activity.description && <span className="text-foreground">{activity.description}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(activity.createdAt), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  return user?.role === "admin" ? <AdminDashboard /> : <MemberDashboard />;
}
