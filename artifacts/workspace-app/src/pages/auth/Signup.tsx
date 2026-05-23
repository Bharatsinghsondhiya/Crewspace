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
          <div className="grid grid-cols-2 gap-2">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.value;
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-all",
                    isSelected
                      ? `${role.border} ${role.bg} shadow-[0_0_15px_rgba(var(--primary),0.2)]`
                      : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 backdrop-blur-md"
                  )}
                >
                  <Icon className={cn("h-6 w-6", isSelected ? role.color : "text-muted-foreground")} />
                  <span className="text-sm font-semibold text-white/90">{role.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@company.com" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={signupMutation.isPending}>
              {signupMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create {selectedRole === "admin" ? "Admin" : "Member"} Account
            </Button>
            <div className="text-center text-sm text-white/60 mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:text-primary/80 hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </AuthLayout>
  );
}
