import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Skeleton } from "@/components/ui/skeleton";

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (!session && location.pathname !== "/auth" && location.pathname !== "/") {
          navigate("/");
        } else if (session && location.pathname === "/auth") {
          navigate("/home");
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (!session && location.pathname !== "/auth" && location.pathname !== "/") {
        navigate("/");
      } else if (session && location.pathname === "/auth") {
        navigate("/home");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

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
