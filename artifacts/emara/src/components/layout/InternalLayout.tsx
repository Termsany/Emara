import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { AuthGuard } from "@/lib/auth-guard";

interface InternalLayoutProps {
  children: ReactNode;
}

export default function InternalLayout({ children }: InternalLayoutProps) {
  return (
    <AuthGuard allowedRoles={["admin", "sales", "designer", "draftsman", "qs", "accountant"]}>
      <div className="flex min-h-screen bg-background text-foreground" dir="rtl">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
