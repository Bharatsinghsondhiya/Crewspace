import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "wouter";
import { ReactNode } from "react";
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
import { LayoutDashboard, Briefcase, Bell, Settings, User, Shield, LogOut, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLogout } from "@workspace/api-client-react";
import { toast } from "sonner";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout: contextLogout } = useAuth();
  const [location] = useLocation();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        contextLogout();
        toast.success("Logged out successfully");
      },
    });
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-transparent text-foreground relative overflow-hidden">
        {/* Deep, rich global glow for the dashboard */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-tr from-primary/20 via-fuchsia-900/30 to-transparent rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-bl from-indigo-900/30 via-violet-600/20 to-transparent rounded-full blur-[120px] pointer-events-none z-0" />
        
        <Sidebar className="border-r border-white/10 bg-black/40 backdrop-blur-2xl z-40 transition-all duration-300 relative overflow-hidden">
          {/* Subtle glow inside the sidebar itself */}
          <div className="absolute top-0 left-[-50%] w-[200%] h-[300px] bg-primary/20 rounded-full blur-[80px] pointer-events-none z-[-1]" />
          
          <SidebarHeader className="p-6 border-b border-white/5">
            <div className="flex items-center gap-3 text-2xl font-bold text-white tracking-tight">
              <div className="w-8 h-8 bg-gradient-to-tr from-primary to-violet-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary),0.5)]">
                <span className="text-white text-sm font-black leading-none">C</span>
              </div>
              Crewspace
            </div>
          </SidebarHeader>
          <SidebarContent className="p-4 gap-6">
            <SidebarGroup>
              <SidebarGroupLabel className="text-white/40 font-semibold tracking-widest uppercase text-[10px] mb-2 px-2">Platform</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-2">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/dashboard"} className="h-11 rounded-xl data-[active=true]:bg-white/10 data-[active=true]:text-primary data-[active=true]:shadow-[inset_4px_0_0_0_hsl(var(--primary))] data-[active=true]:font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all">
                      <Link href="/dashboard">
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="text-sm">Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.startsWith("/workspaces") || location.startsWith("/tasks")} className="h-11 rounded-xl data-[active=true]:bg-white/10 data-[active=true]:text-primary data-[active=true]:shadow-[inset_4px_0_0_0_hsl(var(--primary))] data-[active=true]:font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all">
                      <Link href="/workspaces">
                        <Briefcase className="w-5 h-5" />
                        <span className="text-sm">Workspaces</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.startsWith("/notifications")} className="h-11 rounded-xl data-[active=true]:bg-white/10 data-[active=true]:text-primary data-[active=true]:shadow-[inset_4px_0_0_0_hsl(var(--primary))] data-[active=true]:font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all">
                      <Link href="/notifications">
                        <Bell className="w-5 h-5" />
                        <span className="text-sm">Notifications</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-white/40 font-semibold tracking-widest uppercase text-[10px] mb-2 px-2">Account</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-2">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/profile"} className="h-11 rounded-xl data-[active=true]:bg-white/10 data-[active=true]:text-primary data-[active=true]:shadow-[inset_4px_0_0_0_hsl(var(--primary))] data-[active=true]:font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all">
                      <Link href="/profile">
                        <User className="w-5 h-5" />
                        <span className="text-sm">Profile</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === "/settings"} className="h-11 rounded-xl data-[active=true]:bg-white/10 data-[active=true]:text-primary data-[active=true]:shadow-[inset_4px_0_0_0_hsl(var(--primary))] data-[active=true]:font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all">
                      <Link href="/settings">
                        <Settings className="w-5 h-5" />
                        <span className="text-sm">Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {user?.role === "admin" && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location.startsWith("/admin")} className="h-11 rounded-xl data-[active=true]:bg-white/10 data-[active=true]:text-primary data-[active=true]:shadow-[inset_4px_0_0_0_hsl(var(--primary))] data-[active=true]:font-bold text-white/70 hover:text-white hover:bg-white/5 transition-all">
                        <Link href="/admin">
                          <Shield className="w-5 h-5" />
                          <span className="text-sm">Admin</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-sidebar-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground font-semibold shrink-0">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium leading-none text-sidebar-foreground truncate">{user?.name}</span>
                  <span className="mt-1">
                    {user?.role === "admin" ? (
                      <Badge className="text-[10px] h-4 px-1.5 bg-violet-600 hover:bg-violet-600 text-white gap-0.5">
                        <Shield className="h-2.5 w-2.5" /> Admin
                      </Badge>
                    ) : (
                      <Badge className="text-[10px] h-4 px-1.5 bg-blue-600 hover:bg-blue-600 text-white gap-0.5">
                        <User className="h-2.5 w-2.5" /> Member
                      </Badge>
                    )}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground shrink-0">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
          <header className="h-16 border-b border-white/10 flex items-center px-4 md:hidden bg-black/40 backdrop-blur-xl sticky top-0 z-50">
            <SidebarTrigger />
            <div className="ml-4 font-bold text-primary">Crewspace</div>
          </header>
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
