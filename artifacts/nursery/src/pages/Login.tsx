import { useState } from "react";
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
import { Leaf, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Login() {
  const { setAuth } = useAuthStore();
  const loginMutation = useLogin();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const { t, lang } = useI18n();
  const [showPassword, setShowPassword] = useState(false);

  const formSchema = z.object({
    email: z.string().email(
      lang === "ar" ? "البريد الإلكتروني غير صالح" : "Invalid email address"
    ),
    password: z.string().min(6,
      lang === "ar" ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters"
    ),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        setAuth(res.token, res.user);
        toast({
          title: lang === "ar" ? "مرحباً بعودتك!" : "Welcome back!",
          description: lang === "ar" ? "تم تسجيل الدخول بنجاح" : "Logged in successfully",
        });
        setLocation("/");
      },
      onError: (err: any) => {
        const status = err?.status || err?.response?.status;
        let title = lang === "ar" ? "فشل تسجيل الدخول" : "Login failed";
        let description = "";

        if (status === 401) {
          description = lang === "ar"
            ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
            : "Incorrect email or password";
        } else if (status === 502 || status === 503 || !status) {
          description = lang === "ar"
            ? "الخادم غير متاح حالياً، حاول مجدداً بعد لحظة"
            : "Server unavailable, please try again shortly";
        } else {
          description = lang === "ar"
            ? "حدث خطأ ما، يرجى المحاولة مجدداً"
            : "Something went wrong, please try again";
        }

        toast({ title, description, variant: "destructive" });
      },
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
          <h1 className="text-3xl font-bold text-center mb-2">{t("login")}</h1>
          <p className="text-center text-muted-foreground mb-8">
            {lang === "ar" ? "سجل دخولك للوصول إلى حسابك" : "Sign in to access your account"}
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{lang === "ar" ? "البريد الإلكتروني" : "Email"}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute ltr:left-3 rtl:right-3 top-3.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="you@example.com"
                          className="h-12 rounded-xl ltr:pl-10 rtl:pr-10"
                          type="email"
                          autoComplete="email"
                          {...field}
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
                    <FormLabel>{lang === "ar" ? "كلمة المرور" : "Password"}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute ltr:left-3 rtl:right-3 top-3.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="h-12 rounded-xl ltr:pl-10 rtl:pr-10 ltr:pr-12 rtl:pl-12"
                          autoComplete="current-password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute ltr:right-3 rtl:left-3 top-3.5 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-lg font-bold mt-4"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending
                  ? (lang === "ar" ? "جارٍ تسجيل الدخول..." : "Signing in...")
                  : t("login")}
              </Button>
            </form>
          </Form>

          <p className="text-center mt-8 text-muted-foreground">
            {lang === "ar" ? "ليس لديك حساب؟ " : "Don't have an account? "}
            <Link href="/register" className="text-primary font-bold hover:underline">
              {lang === "ar" ? "حساب جديد" : t("register")}
            </Link>
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
