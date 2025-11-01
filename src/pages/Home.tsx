import { useNavigate } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Briefcase, ShoppingBag, TrendingUp, Sparkles, ArrowRight, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    services: 0,
    products: 0,
    users: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      console.log("Users collection size:", usersSnapshot.size);
      console.log("Users docs:", usersSnapshot.docs.map(doc => doc.id));
      
      const servicesSnapshot = await getDocs(collection(db, "services"));
      const productsSnapshot = await getDocs(collection(db, "products"));

      setStats({
        services: servicesSnapshot.size,
        products: productsSnapshot.size,
        users: usersSnapshot.size
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const quickActions = [
    {
      title: "Browse Services",
      description: "Find tutoring, design help, and more",
      icon: Briefcase,
      gradient: "from-primary to-secondary",
      path: "/services"
    },
    {
      title: "Explore Market",
      description: "Shop for textbooks, electronics, and essentials",
      icon: ShoppingBag,
      gradient: "from-secondary to-accent",
      path: "/market"
    },
    {
      title: "My Dashboard",
      description: "Manage your profile and listings",
      icon: TrendingUp,
      gradient: "from-accent to-primary",
      path: "/dashboard"
    }
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10">
      <TopNav />
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 mb-6">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">Welcome back!</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Your Campus
            <br />
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to thrive in your university journey
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          <motion.div variants={itemVariants}>
            <Card className="glass p-6 border hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.services}</p>
                  <p className="text-sm text-muted-foreground">Active Services</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glass p-6 border hover:border-secondary/40 transition-all duration-300 hover:shadow-lg hover:shadow-secondary/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.products}</p>
                  <p className="text-sm text-muted-foreground">Products Listed</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glass p-6 border hover:border-accent/40 transition-all duration-300 hover:shadow-lg hover:shadow-accent/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.users}</p>
                  <p className="text-sm text-muted-foreground">Active Students</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group cursor-pointer"
              onClick={() => navigate(action.path)}
            >
              <Card className="glass p-8 border hover:border-primary/40 transition-all duration-300 h-full">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 glow`}>
                  <action.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{action.title}</h3>
                <p className="text-muted-foreground mb-4">{action.description}</p>
                <div className="flex items-center text-primary group-hover:translate-x-2 transition-transform">
                  <span className="text-sm font-medium">Explore</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Featured Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-3xl p-12 border relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-secondary/20 to-transparent rounded-full blur-3xl" />
          
          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6 glow">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Ready to Make an Impact?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Whether you're offering services or listing products, our platform makes it easy to connect with your campus community.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button 
                size="lg"
                onClick={() => navigate("/services")}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
              >
                Post a Service
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate("/market")}
                className="glass hover:bg-primary/10"
              >
                List a Product
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
