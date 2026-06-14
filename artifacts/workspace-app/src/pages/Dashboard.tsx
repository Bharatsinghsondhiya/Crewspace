import { useAuth } from "@/context/AuthContext";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Layout, Shield, Users, Briefcase, BarChart3, Bell, Loader2, AlertCircle, Clock, FolderGit2, type LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

// Colored icon box matching the screenshot
function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor }: {
  label: string; value: number | string; sub: string;
  icon: LucideIcon; iconBg: string; iconColor: string;
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
          <p className="text-white/45 mt-1 text-sm">Here is an overview of what is happening across your workspaces today.</p>
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
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mb-3 border border-purple-500/20">
                      <Clock className="w-5 h-5 text-purple-400/50" />
                    </div>
                    <p className="text-white/70 text-sm font-medium">No recent activity</p>
                    <p className="text-white/40 text-xs mt-1">Actions taken by you or your team will appear here.</p>
                  </div>
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

import { useGetProjects, useGetAdminStats } from "@workspace/api-client-react";

function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: projects, isLoading: projectsLoading } = useGetProjects({});
  
  const isLoading = statsLoading || projectsLoading;

  return (
    <div className="p-5 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-fuchsia-400">
              Admin Dashboard
            </h1>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 gap-1 text-xs px-2 py-1 uppercase tracking-widest">
              <Shield className="h-3 w-3" /> Platform Admin
            </Badge>
          </div>
          <p className="text-white/50 text-sm md:text-base">Orchestrate your high-level projects, workspaces, and team members across the platform.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-purple-500/40 transition-colors">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-all" />
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-800 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.4)] mb-4">
                <FolderGit2 className="w-6 h-6 text-white" />
              </div>
              <div className="text-4xl font-black text-white">{projects?.length || 0}</div>
              <div className="text-sm text-white/50 font-medium mt-1 uppercase tracking-wider">Active Projects</div>
            </div>

            <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-pink-500/40 transition-colors">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl group-hover:bg-pink-500/30 transition-all" />
              <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-rose-800 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.4)] mb-4">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div className="text-4xl font-black text-white">{stats?.totalWorkspaces || 0}</div>
              <div className="text-sm text-white/50 font-medium mt-1 uppercase tracking-wider">Workspaces</div>
            </div>

            <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-blue-500/40 transition-colors">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all" />
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.4)] mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-4xl font-black text-white">{stats?.totalUsers || 0}</div>
              <div className="text-sm text-white/50 font-medium mt-1 uppercase tracking-wider">Users</div>
            </div>

            <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-all" />
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-800 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)] mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="text-4xl font-black text-white">{stats?.totalTasks || 0}</div>
              <div className="text-sm text-white/50 font-medium mt-1 uppercase tracking-wider">Tasks</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Recent Projects</h2>
                <Link href="/admin">
                  <Button variant="ghost" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20">
                    View All
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                {projects?.slice(0, 3).map((project: any) => (
                  <div key={project.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <FolderGit2 className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{project.name}</div>
                        <div className="text-xs text-white/50 line-clamp-1">{project.description || "No briefing provided"}</div>
                      </div>
                    </div>
                    <Link href={`/admin/projects/${project.id}`}>
                      <Button size="sm" variant="outline" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20">
                        Manage
                      </Button>
                    </Link>
                  </div>
                ))}
                {projects?.length === 0 && (
                  <div className="text-center p-8 text-white/40">No projects deployed yet.</div>
                )}
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
              <h2 className="text-xl font-bold text-white mb-6">Command Center</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <h3 className="text-sm font-semibold text-white mb-1">Architecture Shift</h3>
                  <p className="text-xs text-white/50 leading-relaxed">
                    You are now operating under the Project Admin architecture. Use the Project Hub to create overarching projects and invite collaborators.
                  </p>
                </div>
                <Link href="/admin">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.3)] mt-2">
                    Open Project Hub
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  return user?.isSuperAdmin ? <AdminDashboard /> : <MemberDashboard />;
}
