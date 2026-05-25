import { useAuth } from "@/context/AuthContext";
import { useGetDashboardSummary, useGetAdminStats } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Layout, Shield, Users, Briefcase, BarChart3, Bell, Loader2, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

// Colored icon box matching the screenshot
function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor }: {
  label: string; value: number | string; sub: string;
  icon: any; iconBg: string; iconColor: string;
}) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3 border border-white/8 transition-all hover:-translate-y-0.5 hover:border-purple-500/20"
      style={{ background: "rgba(20, 12, 45, 0.7)" }}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-sm text-white/50 mt-0.5">{label}</div>
        <div className="text-xs text-white/35 mt-1">{sub}</div>
      </div>
    </div>
  );
}

function MemberDashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading } = useGetDashboardSummary();

  return (
    <div className="p-5 md:p-7 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-white break-words">
            Welcome back, {user?.name} 👋
          </h1>
          <p className="text-white/45 mt-1 text-sm">Here's what's happening across your workspaces today.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 mt-1">
          <Link href="/notifications">
            <button className="relative w-9 h-9 rounded-full flex items-center justify-center border border-white/10 hover:border-purple-500/30 transition-all"
              style={{ background: "rgba(20,12,45,0.7)" }}>
              <Bell className="w-4 h-4 text-white/70" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">!</span>
            </button>
          </Link>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_12px_rgba(139,92,246,0.4)]">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {isLoading || !summary ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
            <p className="text-white/50 text-sm animate-pulse">Loading dashboard...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Overview</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="My Tasks" value={summary.myTasks} sub="Assigned to me" icon={Layout}
                iconBg="bg-pink-500/20" iconColor="text-pink-400" />
              <StatCard label="Pending" value={summary.myPendingTasks} sub="To be done" icon={Clock}
                iconBg="bg-orange-500/20" iconColor="text-orange-400" />
              <StatCard label="Completed" value={summary.myCompletedTasks} sub="Tasks done" icon={CheckCircle2}
                iconBg="bg-emerald-500/20" iconColor="text-emerald-400" />
              <StatCard label="Workspaces" value={summary.totalWorkspaces} sub="Joined" icon={Briefcase}
                iconBg="bg-blue-500/20" iconColor="text-blue-400" />
            </div>
          </div>

          {/* Two column lower section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Task Overview */}
            <div className="rounded-2xl border border-white/8 p-5" style={{ background: "rgba(20, 12, 45, 0.7)" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">Task Overview</h2>
                <Link href="/workspaces" className="text-xs text-purple-400 hover:text-purple-300">View all</Link>
              </div>
              <div className="space-y-3">
                {/* High Priority */}
                <div className="rounded-xl p-3 border border-red-500/20" style={{ background: "rgba(239,68,68,0.06)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-red-400 font-medium text-sm">
                      <AlertCircle className="w-4 h-4" /> High Priority
                    </div>
                    <span className="text-xs text-white/40">{summary.tasksByPriority?.high ?? 0}</span>
                  </div>
                  {summary.recentActivity?.slice(0, 1).map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between">
                      <p className="text-xs text-white/70 truncate flex-1">{a.description}</p>
                      <div className="flex items-center gap-2 ml-2">
                        <Badge className="text-[10px] h-4 px-1.5 bg-red-500/20 text-red-300 border-red-500/30 border rounded">In Progress</Badge>
                        <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                          {a.user?.name?.charAt(0)?.toUpperCase() ?? "B"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Medium Priority */}
                <div className="rounded-xl p-3 border border-orange-500/20" style={{ background: "rgba(249,115,22,0.06)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-orange-400 font-medium text-sm">
                      <Circle className="w-4 h-4" /> Medium Priority
                    </div>
                    <span className="text-xs text-white/40">{summary.tasksByPriority?.medium ?? 0}</span>
                  </div>
                  {summary.recentActivity?.slice(1, 2).map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between">
                      <p className="text-xs text-white/70 truncate flex-1">{a.description}</p>
                      <div className="flex items-center gap-2 ml-2">
                        <Badge className="text-[10px] h-4 px-1.5 bg-amber-500/20 text-amber-300 border-amber-500/30 border rounded">Pending</Badge>
                        <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                          {a.user?.name?.charAt(0)?.toUpperCase() ?? "B"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Low Priority */}
                <div className="rounded-xl p-3 border border-blue-500/20" style={{ background: "rgba(59,130,246,0.06)" }}>
                  <div className="flex items-center gap-2 text-blue-400 font-medium text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Low Priority
                    <span className="ml-auto text-xs text-white/40">{summary.tasksByPriority?.low ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-2xl border border-white/8 p-5" style={{ background: "rgba(20, 12, 45, 0.7)" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">Recent Activity</h2>
                <Link href="/notifications" className="text-xs text-purple-400 hover:text-purple-300">View all</Link>
              </div>
              <div className="space-y-3">
                {summary.recentActivity?.length === 0 ? (
                  <p className="text-white/40 text-sm text-center py-8">No recent activity</p>
                ) : (
                  summary.recentActivity?.slice(0, 5).map((activity: any) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-[0_0_8px_rgba(139,92,246,0.3)]">
                        {activity.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/80 leading-relaxed">
                          <span className="font-semibold text-white">{activity.user?.name}</span>{" "}
                          <span className="text-white/50">{activity.action}</span>{" "}
                          {activity.description && <span className="text-white/70">'{activity.description}'</span>}
                        </p>
                        <p className="text-[10px] text-white/30 mt-0.5">
                          {format(new Date(activity.createdAt), "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AdminDashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const isLoading = summaryLoading || statsLoading;

  return (
    <div className="p-5 md:p-7 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
            <Badge className="bg-violet-600 hover:bg-violet-600 text-white gap-1 text-xs">
              <Shield className="h-3 w-3" /> Admin
            </Badge>
          </div>
          <p className="text-white/45 text-sm">Here's what's happening across the platform today.</p>
        </div>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Total Users" value={stats?.totalUsers ?? "—"} sub={`${stats?.activeUsers ?? 0} active`} icon={Users} iconBg="bg-pink-500/20" iconColor="text-pink-400" />
            <StatCard label="Workspaces" value={stats?.totalWorkspaces ?? "—"} sub="Total created" icon={Briefcase} iconBg="bg-orange-500/20" iconColor="text-orange-400" />
            <StatCard label="Total Tasks" value={stats?.totalTasks ?? "—"} sub={`${stats?.completedTasks ?? 0} completed`} icon={BarChart3} iconBg="bg-emerald-500/20" iconColor="text-emerald-400" />
            <StatCard label="My Workspaces" value={summary?.totalWorkspaces ?? "—"} sub="Joined" icon={Layout} iconBg="bg-blue-500/20" iconColor="text-blue-400" />
          </div>
          {summary && (
            <div className="rounded-2xl border border-white/8 p-5" style={{ background: "rgba(20, 12, 45, 0.7)" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">Recent Activity</h2>
              </div>
              <div className="space-y-3">
                {summary.recentActivity?.slice(0, 6).map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {activity.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/80">
                        <span className="font-semibold text-white">{activity.user?.name}</span>{" "}
                        <span className="text-white/50">{activity.action}</span>{" "}
                        {activity.description && <span className="text-white/70">'{activity.description}'</span>}
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5">{format(new Date(activity.createdAt), "MMM d, yyyy h:mm a")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  return user?.role === "admin" ? <AdminDashboard /> : <MemberDashboard />;
}
