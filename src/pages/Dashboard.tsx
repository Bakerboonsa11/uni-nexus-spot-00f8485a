import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Briefcase, ShoppingBag, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    services: 0,
    products: 0,
    views: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        setProfile(profileData);

        const { count: servicesCount } = await supabase
          .from("services")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        const { count: productsCount } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        const { data: servicesData } = await supabase
          .from("services")
          .select("views")
          .eq("user_id", user.id);

        const { data: productsData } = await supabase
          .from("products")
          .select("views")
          .eq("user_id", user.id);

        const totalViews = 
          (servicesData?.reduce((acc, s) => acc + (s.views || 0), 0) || 0) +
          (productsData?.reduce((acc, p) => acc + (p.views || 0), 0) || 0);

        setStats({
          services: servicesCount || 0,
          products: productsCount || 0,
          views: totalViews,
        });
      }
    };

    loadData();
  }, []);

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Welcome back, {profile?.full_name}!</h1>
        <p className="text-muted-foreground">Here's what's happening with your account</p>
      </div>

      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {profile?.full_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-semibold">{profile?.full_name}</h3>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            {profile?.university_id && (
              <p className="text-sm text-muted-foreground">ID: {profile.university_id}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Services</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.services}</div>
            <p className="text-xs text-muted-foreground">Active service listings</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Products</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.products}</div>
            <p className="text-xs text-muted-foreground">Listed on marketplace</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.views}</div>
            <p className="text-xs text-muted-foreground">Across all listings</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with these common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="/services" className="block p-3 rounded-lg border hover:bg-muted transition-colors">
              <div className="font-medium">Browse Services</div>
              <div className="text-sm text-muted-foreground">Find tutoring, design help, and more</div>
            </a>
            <a href="/market" className="block p-3 rounded-lg border hover:bg-muted transition-colors">
              <div className="font-medium">Explore Marketplace</div>
              <div className="text-sm text-muted-foreground">Buy or sell books, electronics, and goods</div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Tips to make the most of University Hub</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="font-medium">Complete your profile</div>
              <div className="text-sm text-muted-foreground">Add a bio and avatar to stand out</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="font-medium">Post your first service</div>
              <div className="text-sm text-muted-foreground">Share your skills with the community</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
