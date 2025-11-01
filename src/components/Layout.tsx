import { useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    console.log("🔄 Layout: Auth state changed", { currentUser: currentUser?.email, pathname: location.pathname, loading });
    
    if (!loading) {
      if (!currentUser && location.pathname !== "/auth" && location.pathname !== "/") {
        console.log("🔄 Layout: No user, redirecting to auth");
        navigate("/auth");
      } else if (currentUser && location.pathname === "/auth") {
        console.log("🔄 Layout: User logged in, redirecting to dashboard");
        navigate("/dashboard");
      }
    }
  }, [currentUser, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-pulse"></div>
          </div>
          <p className="text-muted-foreground animate-pulse">Loading your experience...</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
