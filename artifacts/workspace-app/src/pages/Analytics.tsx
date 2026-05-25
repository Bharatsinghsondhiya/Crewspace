import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, CheckCircle2, Clock, ListTodo, Users, Target } from "lucide-react";

const PRIORITY_COLORS = {
  high: "#f43f5e",   // rose-500
  medium: "#f59e0b", // amber-500
  low: "#3b82f6",    // blue-500
};

const STATUS_COLORS = {
  Completed: "#10b981",  // emerald-500
  "In Progress": "#8b5cf6", // violet-500
  Pending: "#f59e0b",    // amber-500
};

export default function Analytics() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = parseInt(params.workspaceId || "0", 10);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["workspaceAnalytics", workspaceId],
    queryFn: async () => {
      const token = localStorage.getItem("accessToken");
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${baseUrl}/api/workspaces/${workspaceId}/analytics`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    enabled: !!workspaceId
  });

  if (isLoading) return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-[2rem] bg-white/5" />)}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[400px] w-full rounded-[2rem] bg-white/5" />
        <Skeleton className="h-[400px] w-full rounded-[2rem] bg-white/5" />
      </div>
    </div>
  );
  if (!analytics) return null;

  const pieData = analytics.tasksByPriority.map((p: any) => ({
    name: p.label.charAt(0).toUpperCase() + p.label.slice(1),
    value: p.count,
    color: PRIORITY_COLORS[p.label as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.low
  }));

  const statusData = [
    { name: "Completed", value: analytics.completedTasks || 0, color: STATUS_COLORS.Completed },
    { name: "In Progress", value: analytics.inProgressTasks || 0, color: STATUS_COLORS["In Progress"] },
    { name: "Pending", value: analytics.pendingTasks || 0, color: STATUS_COLORS.Pending },
  ].filter(d => d.value > 0);

  return (
    <div className="p-5 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border border-white/10 shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            Workspace Analytics
          </h1>
          <p className="text-white/50 mt-2 text-sm md:text-base">Deep dive into productivity metrics and task distributions.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2rem] hover:bg-white/[0.02] transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/50 flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-blue-400" /> Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-4xl font-black text-white">{analytics.totalTasks}</div></CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2rem] hover:bg-white/[0.02] transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/50 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" /> Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-white flex items-end gap-1">
              {Math.round(analytics.completionRate || 0)}<span className="text-xl text-white/50 mb-1">%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2rem] hover:bg-white/[0.02] transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/50 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" /> Pending / In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-white">
              {analytics.pendingTasks} <span className="text-white/20 text-2xl">/</span> <span className="text-purple-300">{analytics.inProgressTasks}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2rem] hover:bg-white/[0.02] transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-all" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/50 flex items-center gap-2">
              <Users className="w-4 h-4 text-pink-400" /> Members
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-4xl font-black text-white">{analytics.memberCount}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2rem] lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Member Productivity</CardTitle>
            <CardDescription className="text-white/40">Tasks assigned vs completed per member</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.tasksByMember} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'rgba(15,8,35,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                <Bar dataKey="completedTasks" name="Completed" fill="url(#colorCompleted)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="totalTasks" name="Assigned" fill="url(#colorAssigned)" radius={[6, 6, 0, 0]} />

                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="colorAssigned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2rem]">
            <CardHeader className="pb-0">
              <CardTitle className="text-white">Task Status</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                    {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(15,8,35,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 text-xs mt-2">
                {statusData.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-white/70">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} /> {s.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2rem]">
            <CardHeader className="pb-0">
              <CardTitle className="text-white">Priority Spread</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(15,8,35,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 text-xs mt-2">
                {pieData.map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 text-white/70">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} /> {s.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
