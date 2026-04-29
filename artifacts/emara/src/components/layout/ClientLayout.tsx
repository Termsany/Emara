import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogout, useGetMe } from "@workspace/api-client-react";
import { AuthGuard } from "@/lib/auth-guard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const navItems = [
  { label: "نظرة عامة", icon: LayoutDashboard, href: "/portal" },
];

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const { data: user } = useGetMe();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("تم تسجيل الخروج");
        setLocation("/login");
      },
    });
  };

  return (
    <AuthGuard allowedRoles={["client"]}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30" dir="rtl">
        <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-30">
          <div className="container mx-auto h-16 px-4 flex items-center justify-between">
            <Link href="/portal">
              <a className="text-xl font-bold text-primary">
                EMARA <span className="text-foreground">|</span> عمارة
              </a>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive =
                  location === item.href ||
                  (item.href !== "/portal" && location.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href}>
                    <a
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </a>
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-3">
              <div className="text-end hidden sm:block">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs text-muted-foreground">عميل</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                title="تسجيل الخروج"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
        <main className="container mx-auto p-4 md:p-8">{children}</main>
      </div>
    </AuthGuard>
  );
}
