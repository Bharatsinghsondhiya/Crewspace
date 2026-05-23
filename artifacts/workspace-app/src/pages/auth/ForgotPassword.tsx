import { useForgotPassword } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Link } from "wouter";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const forgotMutation = useForgotPassword();

  const form = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: ForgotFormValues) => {
    forgotMutation.mutate(
      { data },
      {
        onSuccess: () => {
          toast.success("Password reset instructions sent");
          form.reset();
        },
        onError: () => {
          toast.error("Failed to send reset instructions");
        },
      }
    );
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your email to receive reset instructions.">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          <Button type="submit" className="w-full" disabled={forgotMutation.isPending}>
            {forgotMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>
          <div className="text-center text-sm text-muted-foreground mt-4">
            Remember your password?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      </Form>
    </AuthLayout>
  );
}
