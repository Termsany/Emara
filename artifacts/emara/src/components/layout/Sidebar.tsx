import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  FileText, 
  CheckSquare, 
  Wallet, 
  ListChecks, 
  FolderOpen, 
  UserCog, 
  Settings,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLogout, useGetMe } from "@workspace/api-client-react";
import { toast } from "sonner";

const navItems = [
  { label: "لوحة التحكم", icon: LayoutDashboard, href: "/" },
  { label: "المشاريع", icon: FolderKanban, href: "/projects" },
  { label: "العملاء", icon: Users, href: "/clients" },
  { label: "عروض الأسعار", icon: FileText, href: "/quotations" },
  { label: "الموافقات", icon: CheckSquare, href: "/approvals" },
  { label: "المدفوعات", icon: Wallet, href: "/payments" },
  { label: "جدول الكميات", icon: ListChecks, href: "/boq" },
  { label: "الملفات", icon: FolderOpen, href: "/files" },
  { label: "المستخدمون", icon: UserCog, href: "/users", adminOnly: true },
  { label: "الإعدادات", icon: Settings, href: "/settings" },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const { data: user } = useGetMe();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("تم تسجيل الخروج");
        setLocation("/login");
      }
    });
  };

  return (
    <aside className="w-64 border-e bg-sidebar flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-primary">EMARA | عمارة</Link>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          if (item.adminOnly && user?.role !== "admin") return null;
          
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          
          return (
            <Link key={item.href} href={item.href}>
              <a className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}>
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t mt-auto">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4" />
          <span>تسجيل الخروج</span>
        </Button>
      </div>
    </aside>
  );
}
