import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "wouter";
import { ReactNode, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Briefcase, Bell, Settings, User, Shield, LogOut, ListTodo, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLogout, useGetProjects } from "@workspace/api-client-react";
import { toast } from "sonner";
import { useSidebar } from "@/components/ui/sidebar";

function AppLayoutInner({ children }: { children: ReactNode }) {
  const { user, logout: contextLogout } = useAuth();
  const [location] = useLocation();
  const { data: projects } = useGetProjects({});
  
  const isProjectAdmin = projects?.some(p => p.my_role === "admin" || p.my_role === "owner");
  const showProjectHub = user?.role === "admin" || isProjectAdmin;

  const logoutMutation = useLogout();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        contextLogout();
        toast.success("Logged out successfully");
      },
    });
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <div className="flex h-[100dvh] w-full text-foreground relative overflow-hidden"
        style={{ background: "linear-gradient(-45deg, #06030f, #130a2e, #0d0520, #1a0b3b, #06030f)", backgroundSize: "400% 400%", animation: "gradientBG 20s ease infinite" }}>

        {/* Cosmic purple glow blobs */}
        <div className="absolute top-[-15%] left-[-5%] w-[60%] h-[60%] bg-gradient-to-br from-purple-700/20 via-violet-900/30 to-transparent rounded-[40%_60%_70%_30%] blur-[140px] pointer-events-none z-0" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-gradient-to-tl from-indigo-900/20 via-purple-600/8 to-transparent rounded-full blur-[150px] pointer-events-none z-0" />

        {/* Full-screen app shell */}
        <div className="flex w-full h-full relative z-10">

          <Sidebar className="border-r border-purple-500/10 z-40 transition-all duration-500 overflow-hidden"
            style={{ background: "rgba(8, 4, 22, 0.7)", backdropFilter: "blur(32px)" }}>

            {/* Purple glow inside sidebar */}
            <div className="absolute top-0 left-[-50%] w-[200%] h-[300px] bg-purple-600/15 rounded-full blur-[90px] pointer-events-none z-[-1]" />

            <SidebarHeader className="p-6 border-b border-purple-500/10">
              <div className="flex items-center gap-3 text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-fuchsia-400 tracking-tighter">
                <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-violet-700 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.6)] border border-purple-400/30">
                  <span className="text-white text-base font-black leading-none drop-shadow-md">C</span>
                </div>
                Crewspace
              </div>
            </SidebarHeader>

            <SidebarContent className="p-4 gap-6">
              <SidebarGroup>
                <SidebarGroupLabel className="text-purple-300/50 font-semibold tracking-widest uppercase text-[10px] mb-2 px-2">Overview</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1">
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location === "/dashboard"} className="h-10 rounded-xl data-[active=true]:bg-purple-500/15 data-[active=true]:text-purple-300 data-[active=true]:border-l-2 data-[active=true]:border-purple-400 data-[active=true]:font-semibold text-white/60 hover:text-white hover:bg-purple-500/8 transition-all pl-3">
                        <Link href="/dashboard" onClick={handleLinkClick}>
                          <LayoutDashboard className="w-4 h-4" />
                          <span className="text-sm">Dashboard</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {showProjectHub && (
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.startsWith("/admin")} className="h-10 rounded-xl data-[active=true]:bg-purple-500/15 data-[active=true]:text-purple-300 data-[active=true]:border-l-2 data-[active=true]:border-purple-400 data-[active=true]:font-semibold text-white/60 hover:text-white hover:bg-purple-500/8 transition-all pl-3">
                          <Link href="/admin" onClick={handleLinkClick}>
                            <Shield className="w-4 h-4" />
                            <span className="text-sm">Project Hub</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location === "/activity"} className="h-10 rounded-xl data-[active=true]:bg-purple-500/15 data-[active=true]:text-purple-300 data-[active=true]:border-l-2 data-[active=true]:border-purple-400 data-[active=true]:font-semibold text-white/60 hover:text-white hover:bg-purple-500/8 transition-all pl-3">
                        <Link href="/activity" onClick={handleLinkClick}>
                          <Activity className="w-4 h-4" />
                          <span className="text-sm">Activity</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel className="text-purple-300/50 font-semibold tracking-widest uppercase text-[10px] mb-2 px-2">Work</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1">
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location.startsWith("/workspaces") && !location.startsWith("/tasks")} className="h-10 rounded-xl data-[active=true]:bg-purple-500/15 data-[active=true]:text-purple-300 data-[active=true]:border-l-2 data-[active=true]:border-purple-400 data-[active=true]:font-semibold text-white/60 hover:text-white hover:bg-purple-500/8 transition-all pl-3">
                        <Link href="/workspaces" onClick={handleLinkClick}>
                          <Briefcase className="w-4 h-4" />
                          <span className="text-sm">Workspaces</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location === "/all-tasks"} className="h-10 rounded-xl data-[active=true]:bg-purple-500/15 data-[active=true]:text-purple-300 data-[active=true]:border-l-2 data-[active=true]:border-purple-400 data-[active=true]:font-semibold text-white/60 hover:text-white hover:bg-purple-500/8 transition-all pl-3">
                        <Link href="/all-tasks" onClick={handleLinkClick}>
                          <ListTodo className="w-4 h-4" />
                          <span className="text-sm">All Tasks</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location === "/my-tasks"} className="h-10 rounded-xl data-[active=true]:bg-purple-500/15 data-[active=true]:text-purple-300 data-[active=true]:border-l-2 data-[active=true]:border-purple-400 data-[active=true]:font-semibold text-white/60 hover:text-white hover:bg-purple-500/8 transition-all pl-3">
                        <Link href="/my-tasks" onClick={handleLinkClick}>
                          <ListTodo className="w-4 h-4" />
                          <span className="text-sm">My Tasks</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel className="text-purple-300/50 font-semibold tracking-widest uppercase text-[10px] mb-2 px-2">Others</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1">
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location.startsWith("/notifications")} className="h-10 rounded-xl data-[active=true]:bg-purple-500/15 data-[active=true]:text-purple-300 data-[active=true]:border-l-2 data-[active=true]:border-purple-400 data-[active=true]:font-semibold text-white/60 hover:text-white hover:bg-purple-500/8 transition-all pl-3">
                        <Link href="/notifications" onClick={handleLinkClick}>
                          <Bell className="w-4 h-4" />
                          <span className="text-sm">Notifications</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location === "/settings"} className="h-10 rounded-xl data-[active=true]:bg-purple-500/15 data-[active=true]:text-purple-300 data-[active=true]:border-l-2 data-[active=true]:border-purple-400 data-[active=true]:font-semibold text-white/60 hover:text-white hover:bg-purple-500/8 transition-all pl-3">
                        <Link href="/settings" onClick={handleLinkClick}>
                          <Settings className="w-4 h-4" />
                          <span className="text-sm">Settings</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location === "/profile"} className="h-10 rounded-xl data-[active=true]:bg-purple-500/15 data-[active=true]:text-purple-300 data-[active=true]:border-l-2 data-[active=true]:border-purple-400 data-[active=true]:font-semibold text-white/60 hover:text-white hover:bg-purple-500/8 transition-all pl-3">
                        <Link href="/profile" onClick={handleLinkClick}>
                          <User className="w-4 h-4" />
                          <span className="text-sm">Profile</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-purple-500/10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-[0_0_12px_rgba(139,92,246,0.4)]">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium leading-none text-white/90 truncate">{user?.name}</span>
                    <span className="mt-1">
                      {user?.role === "admin" ? (
                        <Badge className="text-[10px] h-4 px-1.5 bg-violet-500/20 border border-violet-500/40 hover:bg-violet-500/30 text-violet-300 gap-1 rounded font-medium">
                          <Shield className="h-2 w-2" /> Admin
                        </Badge>
                      ) : (
                        <Badge className="text-[10px] h-4 px-1.5 bg-purple-500/20 border border-purple-500/40 hover:bg-purple-500/30 text-purple-300 gap-1 rounded font-medium">
                          <User className="h-2 w-2" /> Member
                        </Badge>
                      )}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl shrink-0 h-9 w-9">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>

          {/* Main Content — full height, no inner margins */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10"
            style={{ background: "rgba(8, 4, 20, 0.0)" }}>
            <header className="h-14 border-b border-purple-500/10 flex items-center px-5 md:hidden sticky top-0 z-50"
              style={{ background: "rgba(10, 5, 24, 0.85)", backdropFilter: "blur(20px)" }}>
              <SidebarTrigger className="text-purple-400" />
              <div className="ml-4 font-extrabold text-base text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">Crewspace</div>
            </header>
            <div className="flex-1 overflow-auto custom-scrollbar scroll-smooth">
              {children}
            </div>
          </main>

        </div>
      </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </SidebarProvider>
  );
}
