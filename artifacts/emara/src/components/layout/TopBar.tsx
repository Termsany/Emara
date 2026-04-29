import { Bell, User as UserIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGetMe,
  useLogout,
  useGetPendingApprovals,
} from "@workspace/api-client-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { roleLabels } from "@/lib/format";

export default function TopBar() {
  const { data: user } = useGetMe();
  const { data: approvals } = useGetPendingApprovals();
  const logoutMutation = useLogout();
  const [, setLocation] = useLocation();

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("تم تسجيل الخروج");
        setLocation("/login");
      },
    });
  };

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-30 px-4 md:px-8 flex items-center justify-end gap-4">
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        {approvals && approvals.length > 0 && (
          <span className="absolute top-2 end-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-background" />
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-3 p-1 h-auto">
            <div className="text-end hidden sm:block">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {user?.role ? roleLabels[user.role] : ""}
              </p>
            </div>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user?.name ? getInitials(user.name) : <UserIcon className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setLocation("/settings")}>
            الإعدادات
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4 me-2" /> تسجيل الخروج
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
