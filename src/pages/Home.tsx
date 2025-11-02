import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Briefcase, ShoppingBag, TrendingUp, Sparkles, ArrowRight, Users, Zap, Wrench } from "lucide-react";
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

  const services = [
    {
      title: "Premium Products",
      description: "Quality items from trusted student sellers",
      image: "/product1.jpg",
      gradient: "from-primary to-secondary",
      onClick: () => navigate("/market")
    },
    {
      title: "Expert Services", 
      description: "Professional services by skilled students",
      image: "/services1.jpg",
      gradient: "from-secondary to-accent",
      onClick: () => navigate("/services")
    },
    {
      title: "Business Solutions",
      description: "Entrepreneurial opportunities and partnerships", 
      image: "/buisness1.jpg",
      gradient: "from-accent to-primary",
      onClick: () => navigate("/jobs")
    }
  ];

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
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              NEXUS SPOT
            </span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <Button 
              variant="ghost" 
              onClick={() => navigate("/auth")}
              className="hover:bg-primary/10"
            >
              Login
            </Button>
            <Button 
              onClick={() => navigate("/auth")}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
            >
              Get Started
            </Button>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section with Haramaya University Background */}
      <div 
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: "url('/haramaya.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed"
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
        
        {/* Animated floating elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 left-10 w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 blur-xl"
          />
          <motion.div
            animate={{ 
              y: [0, 30, 0],
              rotate: [0, -5, 0]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute top-40 right-20 w-32 h-32 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 blur-xl"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="inline-block mb-6">
              <div className="px-6 py-3 rounded-full glass border border-primary/30 inline-flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                <span className="text-white/90 font-medium">Haramaya University Official Platform</span>
              </div>
            </div>
            
            <motion.h1 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-7xl md:text-8xl lg:text-9xl font-black mb-8 leading-none"
            >
              <span className="block bg-gradient-to-r from-white via-primary to-secondary bg-clip-text text-transparent animate-pulse">
                NEXUS
              </span>
              <span className="block bg-gradient-to-r from-secondary via-accent to-primary bg-clip-text text-transparent">
                SPOT
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl md:text-3xl text-white/80 max-w-4xl mx-auto mb-12 font-light"
            >
              The Ultimate Hub for <span className="text-primary font-semibold">Products</span>, 
              <span className="text-secondary font-semibold"> Services</span>, and 
              <span className="text-accent font-semibold"> Business</span> at Haramaya University
            </motion.p>

            {/* Dynamic Glass-morphism stats cards */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12"
            >
              {[
                { number: `${stats.users}+`, label: "Active Students", icon: Users },
                { number: `${stats.services}+`, label: "Services Posted", icon: Wrench },
                { number: `${stats.products}+`, label: "Products Sold", icon: ShoppingBag }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="glass rounded-2xl p-6 border border-white/20 hover:border-primary/40 transition-all duration-300 group"
                >
                  <stat.icon className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <p className="text-white/70 text-sm">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <Button 
                size="lg"
                onClick={() => navigate("/auth")}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 text-xl px-12 py-8 glow hover:scale-105 transform"
              >
                Join NEXUS SPOT
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="text-xl px-12 py-8 glass hover:bg-white/10 border-white/30 text-white hover:scale-105 transform transition-all duration-300"
              >
                Explore Platform
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Services Showcase Section */}
        <div className="py-32 px-6 bg-gradient-to-br from-background to-primary/5">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Discover Our Services
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Everything you need for your university journey in one powerful platform
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  onClick={service.onClick}
                  className="group cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-3xl glass border hover:border-primary/40 transition-all duration-500 h-96">
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: `url('${service.image}')` }}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-80 group-hover:opacity-90 transition-opacity duration-300`} />
                    <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                      >
                        <h3 className="text-3xl font-bold text-white mb-3 group-hover:scale-105 transition-transform duration-300">
                          {service.title}
                        </h3>
                        <p className="text-white/90 text-lg mb-6">
                          {service.description}
                        </p>
                        <Button 
                          variant="secondary"
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm group-hover:scale-105 transition-all duration-300"
                        >
                          Explore Now
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

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

        {/* University Map Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <Card className="glass p-6 border hover:border-primary/40 transition-all duration-300">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Haramaya University Campus
              </h2>
              <p className="text-muted-foreground">Explore our beautiful campus in satellite view</p>
            </div>
            
            <div className="relative rounded-xl overflow-hidden border-2 border-primary/20 shadow-lg">
              <iframe
                id="campus-map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15707.234567890123!2d42.0302!3d9.4102!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1631b8b8b8b8b8b8%3A0x1234567890abcdef!2sHaramaya%20University!5e1!3m2!1sen!2set!4v1699999999999!5m2!1sen!2set"
                width="100%"
                height="500"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full"
              />
              <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-medium">Satellite View</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <button 
                onClick={() => {
                  const iframe = document.getElementById('campus-map') as HTMLIFrameElement;
                  iframe.src = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3926.8!2d42.0302!3d9.4102!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwMjQnMzYuNyJOIDQywrAwMScxMC43IkU!5e1!3m2!1sen!2set!4v1699999999999!5m2!1sen!2set";
                }}
                className="text-center p-3 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors cursor-pointer group"
              >
                <div className="text-2xl font-bold text-primary group-hover:scale-110 transition-transform">🏛️</div>
                <div className="text-sm font-medium">Main Campus</div>
              </button>
              
              <button 
                onClick={() => {
                  const iframe = document.getElementById('campus-map') as HTMLIFrameElement;
                  iframe.src = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3926.8!2d42.0312!3d9.4112!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwMjQnNDAuMyJOIDQywrAwMScxNi4zIkU!5e1!3m2!1sen!2set!4v1699999999999!5m2!1sen!2set";
                }}
                className="text-center p-3 rounded-lg bg-secondary/5 border border-secondary/10 hover:bg-secondary/10 transition-colors cursor-pointer group"
              >
                <div className="text-2xl font-bold text-secondary group-hover:scale-110 transition-transform">📚</div>
                <div className="text-sm font-medium">Library</div>
              </button>
              
              <button 
                onClick={() => {
                  const iframe = document.getElementById('campus-map') as HTMLIFrameElement;
                  iframe.src = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3926.8!2d42.0322!3d9.4122!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwMjQnNDMuOSJOIDQywrAwMScxOS45IkU!5e1!3m2!1sen!2set!4v1699999999999!5m2!1sen!2set";
                }}
                className="text-center p-3 rounded-lg bg-accent/5 border border-accent/10 hover:bg-accent/10 transition-colors cursor-pointer group"
              >
                <div className="text-2xl font-bold text-accent group-hover:scale-110 transition-transform">🏠</div>
                <div className="text-sm font-medium">Dormitories</div>
              </button>
              
              <button 
                onClick={() => {
                  const iframe = document.getElementById('campus-map') as HTMLIFrameElement;
                  iframe.src = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3926.8!2d42.0332!3d9.4132!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwMjQnNDcuNSJOIDQywrAwMScyMy41IkU!5e1!3m2!1sen!2set!4v1699999999999!5m2!1sen!2set";
                }}
                className="text-center p-3 rounded-lg bg-green-500/5 border border-green-500/10 hover:bg-green-500/10 transition-colors cursor-pointer group"
              >
                <div className="text-2xl font-bold text-green-600 group-hover:scale-110 transition-transform">🍽️</div>
                <div className="text-sm font-medium">Cafeteria</div>
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Click on the buttons above to navigate to specific campus locations
              </p>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t glass">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                NEXUS SPOT
              </span>
            </div>
            <p className="text-muted-foreground mb-2">
              © 2024 NEXUS SPOT - Haramaya University. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Empowering students, connecting communities, building futures.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
