import { useLogin, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";

const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const demoUsers = [
  { email: "admin@emara.com", label: "مدير" },
  { email: "sales@emara.com", label: "مبيعات" },
  { email: "designer@emara.com", label: "مصمم" },
  { email: "draftsman@emara.com", label: "رسام" },
  { email: "qs@emara.com", label: "حصر كميات" },
  { email: "accountant@emara.com", label: "محاسب" },
  { email: "ahmed.client@example.com", label: "عميل" },
];

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const loginMutation = useLogin();
  const { data: me } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false },
  });

  useEffect(() => {
    if (me) {
      setLocation(me.role === "client" ? "/portal" : "/");
    }
  }, [me, setLocation]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          toast.success("تم تسجيل الدخول بنجاح");
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          setLocation(res.role === "client" ? "/portal" : "/");
        },
        onError: () => {
          toast.error("بيانات الدخول غير صحيحة");
        },
      },
    );
  };

  const fillDemo = (email: string) => {
    form.setValue("email", email);
    form.setValue("password", "password123");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/30"
      dir="rtl"
    >
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            EMARA <span className="text-foreground">|</span> عمارة
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            منصة إدارة مشاريع التصميم الداخلي والمعماري
          </p>
        </div>

        <Card className="border-card-border shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">تسجيل الدخول</CardTitle>
            <CardDescription className="text-center">
              أدخل بياناتك للوصول إلى لوحة التحكم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.com" {...field} dir="ltr" />
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
                      <FormLabel>كلمة المرور</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} dir="ltr" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "جارٍ التحقق..." : "تسجيل الدخول"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  حسابات تجريبية (password123)
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 w-full">
              {demoUsers.map((u) => (
                <Button
                  key={u.email}
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => fillDemo(u.email)}
                  className="text-xs h-8"
                >
                  {u.label}
                </Button>
              ))}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
