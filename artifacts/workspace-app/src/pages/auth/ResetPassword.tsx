import { useResetPassword } from "@workspace/api-client-react";
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
import { useEffect } from "react";

const resetSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  token: z.string().min(1, "Token is missing"),
});

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const resetMutation = useResetPassword();

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: "",
      token: "",
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      form.setValue("token", token);
    }
  }, [form]);

  const onSubmit = (data: ResetFormValues) => {
    resetMutation.mutate(
      { data },
      {
        onSuccess: () => {
          toast.success("Password reset successfully");
          setLocation("/login");
        },
        onError: (error) => {
          toast.error(error.data?.error || "Failed to reset password");
        },
      }
    );
  };

  return (
    <AuthLayout title="Set New Password" subtitle="Enter your new password below.">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
               <FormItem>
                 <FormLabel>New Password</FormLabel>
                 <FormControl>
                   <Input type="password" placeholder="••••••••" {...field} />
                 </FormControl>
                 <FormMessage />
               </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={resetMutation.isPending}>
            {resetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset Password
          </Button>
          <div className="text-center text-sm text-muted-foreground mt-4">
            <Link href="/login" className="text-primary hover:underline">
              Back to Sign in
            </Link>
          </div>
        </form>
      </Form>
    </AuthLayout>
  );
}
