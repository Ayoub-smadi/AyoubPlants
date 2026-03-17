import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/lib/store";
import { useRegister } from "@workspace/api-client-react";
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
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

export default function Register() {
  const { setAuth } = useAuthStore();
  const registerMutation = useRegister();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const { t, lang } = useI18n();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "", phone: "" },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    registerMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        setAuth(res.token, res.user);
        toast({ title: "Account created!" });
        setLocation('/');
      },
      onError: (err) => {
        toast({
          title: "Registration failed",
          description: err.message || "Something went wrong",
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
          <h1 className="text-3xl font-bold text-center mb-2">{t('register')}</h1>
          <p className="text-center text-muted-foreground mb-8">
            {lang === 'ar' ? 'أنشئ حساباً جديداً للبدء' : 'Create a new account to get started'}
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fullName')}</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" className="h-12 rounded-xl" {...field} />
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
                      <Input placeholder="you@example.com" className="h-12 rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('phone')} (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+971..." className="h-12 rounded-xl" dir="ltr" {...field} />
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
              <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold mt-6" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "..." : t('register')}
              </Button>
            </form>
          </Form>

          <p className="text-center mt-8 text-muted-foreground">
            {lang === 'ar' ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
            <Link href="/login" className="text-primary font-bold hover:underline">
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
