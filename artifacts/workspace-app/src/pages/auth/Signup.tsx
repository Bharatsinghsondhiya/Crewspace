import { useAuth } from "@/context/AuthContext";
import { useSignup } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, Shield, User } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

const roles = [
  {
    value: "member" as const,
    label: "Team Member",
    description: "Join workspaces, manage tasks, collaborate with your team.",
    icon: User,
    color: "text-blue-400",
    border: "border-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    value: "admin" as const,
    label: "Admin",
    description: "Full control — manage users, workspaces, and platform settings.",
    icon: Shield,
    color: "text-violet-400",
    border: "border-violet-500",
    bg: "bg-violet-500/10",
  },
];

export default function Signup() {
  const { login: setAuthContext } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<"member" | "admin">("member");
  const signupMutation = useSignup();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = (data: SignupFormValues) => {
    signupMutation.mutate(
      { data: { ...data, role: selectedRole } as any },
      {
        onSuccess: (response) => {
          toast.success(`Account created as ${selectedRole === "admin" ? "Admin" : "Team Member"}`);
          setAuthContext(response);
          setLocation("/dashboard");
        },
        onError: (error: any) => {
          toast.error(error?.data?.error || "Registration failed");
        },
      }
    );
  };

  return (
    <AuthLayout title="Create Account" subtitle="Choose your role and join Crewspace.">
      <div className="space-y-4">
        {/* Role selector */}
        <div>
          <p className="text-sm font-medium text-foreground mb-1.5">I am joining as</p>
        <div className="grid grid-cols-2 gap-3">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.value;
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl p-5 text-center transition-all border"
                  style={isSelected
                    ? { background: "rgba(139,92,246,0.25)", borderColor: "rgba(139,92,246,0.7)", boxShadow: "0 0 20px rgba(139,92,246,0.2)" }
                    : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)" }
                  }
                >
                  <Icon className={cn("h-6 w-6", isSelected ? "text-purple-300" : "text-white/40")} />
                  <span className={cn("text-sm font-semibold", isSelected ? "text-white" : "text-white/50")}>{role.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                         <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-white/50">
                           <User className="w-4 h-4" />
                         </div>
                         <Input 
                           placeholder="Full Name" 
                           {...field} 
                           className="pl-10 h-12 bg-[#0d0d12] border-white/10 rounded-xl focus-visible:ring-1 focus-visible:ring-purple-500/50"
                         />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                         <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-white/50">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                         </div>
                         <Input 
                           placeholder="Email" 
                           {...field} 
                           className="pl-10 h-12 bg-[#0d0d12] border-white/10 rounded-xl focus-visible:ring-1 focus-visible:ring-purple-500/50"
                         />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-white/50">
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                       </div>
                       <Input 
                         type="password" 
                         placeholder="Password" 
                         {...field} 
                         className="pl-11 h-12 bg-[#0d0d12] border-white/10 rounded-xl focus-visible:ring-1 focus-visible:ring-purple-500/50"
                       />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-3">
              <Button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium h-12 text-base transition-all" disabled={signupMutation.isPending}>
                {signupMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Create {selectedRole === "admin" ? "Admin" : "Member"} Account
              </Button>
            </div>
            
            <div className="text-center text-sm text-white/60 mt-8 pt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                Sign in
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </AuthLayout>
  );
}
