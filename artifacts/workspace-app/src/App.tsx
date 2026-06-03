import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";

import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";

import Dashboard from "@/pages/Dashboard";
import Workspaces from "@/pages/Workspaces";
import WorkspaceDetail from "@/pages/WorkspaceDetail";
import WorkspaceTasks from "@/pages/WorkspaceTasks";
import TaskDetail from "@/pages/TaskDetail";
import Analytics from "@/pages/Analytics";
import Notifications from "@/pages/Notifications";
import Admin from "@/pages/Admin";
import ProjectDetail from "@/pages/ProjectDetail";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import AcceptInvite from "@/pages/AcceptInvite";
import MyTasks from "@/pages/MyTasks";
import Activity from "@/pages/Activity";
import AllTasks from "@/pages/AllTasks";

const queryClient = new QueryClient();

import Landing from "@/pages/Landing";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      
      {/* Auth Routes */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />

      {/* App Routes */}
      <Route path="/dashboard">
        <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/my-tasks">
        <ProtectedRoute><AppLayout><MyTasks /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/activity">
        <ProtectedRoute><AppLayout><Activity /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/all-tasks">
        <ProtectedRoute><AppLayout><AllTasks /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/workspaces">
        <ProtectedRoute><AppLayout><Workspaces /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/workspaces/:id">
        <ProtectedRoute><AppLayout><WorkspaceDetail /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/workspaces/:id/tasks">
        <ProtectedRoute><AppLayout><WorkspaceTasks /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/tasks/:workspaceId/:taskId">
        <ProtectedRoute><AppLayout><TaskDetail /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/analytics/:workspaceId">
        <ProtectedRoute><AppLayout><Analytics /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/notifications">
        <ProtectedRoute><AppLayout><Notifications /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute adminOnly><AppLayout><Admin /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/admin/projects/:id">
        <ProtectedRoute adminOnly><AppLayout><ProjectDetail /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/invites/:token">
        <AcceptInvite />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
        <SonnerToaster position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
