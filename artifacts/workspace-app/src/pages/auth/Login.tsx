import { useAuth } from "@/context/AuthContext";
import { useLogin } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login: setAuthContext } = useAuth();
  const [, setLocation] = useLocation();
  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (response) => {
          toast.success("Logged in successfully");
          setAuthContext(response);
          setLocation("/dashboard");
        },
        onError: (error: any) => {
          toast.error(error?.data?.detail || error?.data?.error || "Login failed");
        },
      }
    );
  };

  return (
    <AuthLayout title="Sign In" subtitle="Enter your credentials to access your workspace.">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
               <FormItem>
                 <FormControl>
                   <div className="relative">
                     <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-white/50">
                       <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                     </div>
                     <Input 
                        placeholder="Email address" 
                        {...field} 
                        className="pl-11 h-12 bg-[#0d0d12] border-white/10 rounded-xl focus-visible:ring-1 focus-visible:ring-purple-500/50"
                     />
                   </div>
                 </FormControl>
                 <FormMessage />
               </FormItem>
            )}
          />
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
                 <div className="flex justify-end pt-1">
                   <Link href="/forgot-password" className="text-sm text-white/60 hover:text-white transition-colors">
                     Forgot password?
                   </Link>
                 </div>
                 <FormMessage />
               </FormItem>
            )}
          />
          
          <div className="pt-2">
            <Button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium h-12 text-base transition-all" disabled={loginMutation.isPending}>
              {loginMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Sign In
            </Button>
          </div>
          
          <div className="text-center text-sm text-white/60 mt-8 pt-4">
            Don't have an account?{" "}
            <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-medium">
              Sign up
            </Link>
          </div>
        </form>
      </Form>
    </AuthLayout>
  );
}
