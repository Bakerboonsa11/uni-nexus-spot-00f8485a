import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TopNav } from "@/components/TopNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Briefcase, ShoppingBag, TrendingUp, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 dark:from-background dark:via-background dark:to-accent/10">
      <TopNav />
      
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-5xl font-bold mb-2">
            Welcome back, <span className="bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text text-transparent">
              {profile?.full_name}!
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">Here's what's happening with your account</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass border hover:border-accent/40 transition-all duration-300 hover:shadow-lg hover:shadow-accent/20">
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-4 border-accent/20">
                <AvatarFallback className="bg-gradient-to-br from-accent to-primary text-white text-2xl">
                  {profile?.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-2xl font-semibold">{profile?.full_name}</h3>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                {profile?.university_id && (
                  <p className="text-sm text-muted-foreground">ID: {profile.university_id}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 md:grid-cols-3"
        >
          <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -5 }}>
            <Card className="glass border hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Services</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {stats.services}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Active service listings</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -5 }}>
            <Card className="glass border hover:border-secondary/40 transition-all duration-300 hover:shadow-lg hover:shadow-secondary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Products</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                  {stats.products}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Listed on marketplace</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -5 }}>
            <Card className="glass border hover:border-accent/40 transition-all duration-300 hover:shadow-lg hover:shadow-accent/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                  {stats.views}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Across all listings</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Action Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 md:grid-cols-2"
        >
          <motion.div variants={itemVariants}>
            <Card className="glass border hover:border-primary/40 transition-all duration-300 h-full">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get started with these common tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <motion.div 
                  whileHover={{ x: 5 }}
                  onClick={() => navigate("/services")}
                  className="group cursor-pointer p-4 rounded-xl glass border border-border/50 hover:border-primary/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium group-hover:text-primary transition-colors">Browse Services</div>
                      <div className="text-sm text-muted-foreground">Find tutoring, design help, and more</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </motion.div>
                <motion.div 
                  whileHover={{ x: 5 }}
                  onClick={() => navigate("/market")}
                  className="group cursor-pointer p-4 rounded-xl glass border border-border/50 hover:border-secondary/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium group-hover:text-secondary transition-colors">Explore Marketplace</div>
                      <div className="text-sm text-muted-foreground">Buy or sell books, electronics, and goods</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-secondary transition-colors" />
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glass border hover:border-accent/40 transition-all duration-300 h-full">
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>Tips to make the most of University Hub</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 rounded-xl glass border border-accent/20">
                  <div className="font-medium">Complete your profile</div>
                  <div className="text-sm text-muted-foreground">Add a bio and avatar to stand out</div>
                </div>
                <div className="p-4 rounded-xl glass border border-accent/20">
                  <div className="font-medium">Post your first service</div>
                  <div className="text-sm text-muted-foreground">Share your skills with the community</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
