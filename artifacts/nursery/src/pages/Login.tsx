import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/lib/store";
import { useLogin } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Leaf } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function Login() {
  const { setAuth } = useAuthStore();
  const loginMutation = useLogin();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const { t, lang } = useI18n();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        setAuth(res.token, res.user);
        toast({ title: "Welcome back!" });
        setLocation('/');
      },
      onError: (err) => {
        toast({
          title: "Login failed",
          description: err.message || "Invalid credentials",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-24 flex justify-center items-center min-h-[80vh]">
        <div className="w-full max-w-md bg-card p-8 rounded-3xl shadow-xl border border-border/50">
          <div className="flex justify-center mb-6">
             <div className="bg-primary/10 p-4 rounded-2xl">
              <Leaf className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-2">{t('login')}</h1>
          <p className="text-center text-muted-foreground mb-8">
            {lang === 'ar' ? 'سجل دخولك للوصول إلى حسابك' : 'Sign in to access your account'}
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" className="h-12 rounded-xl" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="h-12 rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold mt-4" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "..." : t('login')}
              </Button>
            </form>
          </Form>

          <p className="text-center mt-8 text-muted-foreground">
            {lang === 'ar' ? 'ليس لديك حساب؟ ' : 'Don\'t have an account? '}
            <Link href="/register" className="text-primary font-bold hover:underline">
              {t('register')}
            </Link>
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
