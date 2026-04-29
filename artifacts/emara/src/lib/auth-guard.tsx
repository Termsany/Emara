import { useLocation } from "wouter";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useEffect, ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading, error } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
    },
  });

  useEffect(() => {
    if (!isLoading && (error || !user)) {
      setLocation("/login");
      return;
    }
    if (!isLoading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      if (user.role === "client") {
        setLocation("/portal");
      } else {
        setLocation("/");
      }
    }
  }, [user, isLoading, error, setLocation, allowedRoles]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        جارٍ التحميل...
      </div>
    );
  }
  if (!user) return null;
  return <>{children}</>;
}
