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
import { Leaf, User, Mail, Lock, Phone, Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";

export default function Register() {
  const { setAuth } = useAuthStore();
  const registerMutation = useRegister();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const { t, lang } = useI18n();
  const isRtl = lang === "ar";
  const [showPassword, setShowPassword] = useState(false);

  const formSchema = z.object({
    name: z.string().min(2, lang === "ar" ? "الاسم يجب أن يكون حرفين على الأقل" : "Name must be at least 2 characters"),
    email: z.string().email(lang === "ar" ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email"),
    password: z.string().min(6, lang === "ar" ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters"),
    phone: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "", phone: "" },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    registerMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        setAuth(res.token, res.user);
        toast({
          title: lang === "ar" ? "تم إنشاء الحساب بنجاح! 🎉" : "Account created! 🎉",
          description: lang === "ar" ? `مرحباً ${res.user.name}` : `Welcome ${res.user.name}`,
        });
        setLocation("/");
      },
      onError: (err: any) => {
        const status = err?.status;
        let title = lang === "ar" ? "فشل إنشاء الحساب" : "Registration failed";
        let description = "";

        if (status === 409) {
          title = lang === "ar" ? "البريد الإلكتروني مستخدم مسبقاً" : "Email already registered";
          description = lang === "ar"
            ? "هذا البريد الإلكتروني مسجّل مسبقاً. هل تريد تسجيل الدخول؟"
            : "This email is already registered. Would you like to sign in?";
        } else if (status === 400) {
          title = lang === "ar" ? "بيانات غير صحيحة" : "Invalid data";
          description = lang === "ar" ? "يرجى التحقق من جميع الحقول" : "Please check all fields";
        } else {
          description = lang === "ar" ? "حدث خطأ ما، يرجى المحاولة مجدداً" : "Something went wrong, please try again";
        }

        toast({ title, description, variant: "destructive" });
      },
    });
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[85vh]">
        <div className="w-full max-w-md" dir={isRtl ? "rtl" : "ltr"}>
          {/* Card */}
          <div className="bg-card p-8 rounded-3xl shadow-xl border border-border/50">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="bg-primary/10 p-4 rounded-2xl mb-4">
                <Leaf className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-center">
                {lang === "ar" ? "إنشاء حساب جديد" : "Create New Account"}
              </h1>
              <p className="text-muted-foreground text-sm text-center mt-1">
                {lang === "ar" ? "انضم إلينا وابدأ تجربتك" : "Join us and start your experience"}
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">
                        {lang === "ar" ? "الاسم الكامل" : "Full Name"}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={lang === "ar" ? "أدخل اسمك الكامل" : "Enter your full name"}
                            className="h-12 rounded-xl ps-9"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">
                        {lang === "ar" ? "البريد الإلكتروني" : "Email Address"}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="example@email.com"
                            type="email"
                            className="h-12 rounded-xl ps-9"
                            dir="ltr"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">
                        {lang === "ar" ? "رقم الهاتف (اختياري)" : "Phone Number (Optional)"}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="05XXXXXXXX"
                            type="tel"
                            className="h-12 rounded-xl ps-9"
                            dir="ltr"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">
                        {lang === "ar" ? "كلمة المرور" : "Password"}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder={lang === "ar" ? "6 أحرف على الأقل" : "At least 6 characters"}
                            className="h-12 rounded-xl ps-9 pe-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-base font-bold mt-2"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending
                    ? (lang === "ar" ? "جارٍ إنشاء الحساب..." : "Creating account...")
                    : (lang === "ar" ? "إنشاء الحساب" : "Create Account")}
                </Button>
              </form>
            </Form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-3 text-muted-foreground">
                  {lang === "ar" ? "لديك حساب بالفعل؟" : "Already have an account?"}
                </span>
              </div>
            </div>

            <Link href="/login">
              <Button variant="outline" className="w-full h-12 rounded-xl font-semibold">
                {lang === "ar" ? "تسجيل الدخول" : "Sign In"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
