import { useEffect, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Star, Briefcase, Play, Image as ImageIcon, TrendingUp, Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

const SERVICE_CATEGORIES = ["Tutoring", "Design", "Writing", "Programming", "Event Planning", "Photography", "Music", "Fitness", "Other"];

interface Service {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  description: string;
  category: string;
  price: number;
  contactInfo: string;
  images: string[];
  videos: string[];
  skills: string[];
  experience: string;
  availability: string;
  rating: number;
  reviews: number;
  createdAt: any;
}

const Services = () => {
  const [user] = useAuthState(auth);
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const q = query(collection(db, "services"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const servicesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
      setServices(servicesData);
    } catch (error) {
      console.error("Error loading services:", error);
      toast.error("Error loading services");
    }
  };

  const seedMockData = async () => {
    if (!user) return;
    
    const mockServices = [
      {
        userId: user.uid,
        userName: "Sarah Johnson",
        userEmail: "sarah.j@university.edu",
        title: "Math Tutoring - Calculus & Statistics",
        description: "Experienced math tutor with 3+ years helping students excel in calculus, statistics, and algebra.",
        category: "Tutoring",
        price: 25,
        contactInfo: "sarah.j@university.edu",
        images: ["https://images.unsplash.com/photo-1509228468518-180dd4864904?w=500"],
        videos: [],
        skills: ["Calculus", "Statistics", "Algebra"],
        experience: "3+ years tutoring experience, Mathematics major with 3.9 GPA",
        availability: "Monday-Friday 3-7 PM",
        rating: 4.8,
        reviews: 23,
        createdAt: new Date()
      },
      {
        userId: user.uid,
        userName: "Alex Chen",
        userEmail: "alex.chen@university.edu",
        title: "Web Development & Programming",
        description: "Full-stack developer offering web development services and programming tutoring.",
        category: "Programming",
        price: 35,
        contactInfo: "alex.chen@university.edu",
        images: ["https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500"],
        videos: [],
        skills: ["React", "Node.js", "Python", "JavaScript"],
        experience: "Computer Science senior, 2 years freelance experience",
        availability: "Evenings and weekends",
        rating: 4.9,
        reviews: 18,
        createdAt: new Date()
      },
      {
        userId: user.uid,
        userName: "Emma Rodriguez",
        userEmail: "emma.r@university.edu",
        title: "Graphic Design & Branding",
        description: "Creative graphic designer specializing in logos, branding, and social media graphics.",
        category: "Design",
        price: 30,
        contactInfo: "emma.r@university.edu",
        images: ["https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500"],
        videos: [],
        skills: ["Photoshop", "Illustrator", "Branding", "Logo Design"],
        experience: "Art & Design major, freelance designer for 2 years",
        availability: "Weekdays after 2 PM",
        rating: 4.7,
        reviews: 31,
        createdAt: new Date()
      }
    ];

    try {
      for (const service of mockServices) {
        await addDoc(collection(db, "services"), service);
      }
      toast.success("Mock data seeded successfully!");
      loadServices();
    } catch (error) {
      console.error("Error seeding data:", error);
      toast.error("Error seeding data");
    }
  };

  const handleCreateService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      await addDoc(collection(db, "services"), {
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userEmail: user.email,
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        category: formData.get("category") as string,
        price: parseFloat(formData.get("price") as string),
        contactInfo: formData.get("contact") as string,
        images: (formData.get("images") as string).split(",").filter(url => url.trim()),
        videos: (formData.get("videos") as string).split(",").filter(url => url.trim()),
        skills: (formData.get("skills") as string).split(",").filter(skill => skill.trim()),
        experience: formData.get("experience") as string,
        availability: formData.get("availability") as string,
        rating: 0,
        reviews: 0,
        createdAt: new Date()
      });

      toast.success("Service created successfully!");
      setOpen(false);
      loadServices();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Error creating service:", error);
      toast.error("Error creating service");
    }

    setLoading(false);
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10">
      <TopNav />
      
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="space-y-6 sm:space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent break-words">
              Services
            </h1>
            <p className="text-base lg:text-lg text-muted-foreground">Find or offer services within your university community</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              onClick={seedMockData}
              variant="outline" 
              size="sm"
              className="gap-2 w-full sm:w-auto"
            >
              Seed Data
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity glow w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Post Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl glass max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Service</DialogTitle>
                  <DialogDescription>Share your skills and help fellow students</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateService} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Service Title</Label>
                      <Input id="title" name="title" placeholder="e.g., Math Tutoring for Calculus" required className="glass" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select name="category" required>
                        <SelectTrigger className="glass">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      name="description" 
                      placeholder="Describe your service in detail..."
                      rows={4}
                      required 
                      className="glass"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price ($)</Label>
                      <Input 
                        id="price" 
                        name="price" 
                        type="number" 
                        step="0.01"
                        placeholder="20.00"
                        required 
                        className="glass"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact">Contact Information</Label>
                      <Input 
                        id="contact" 
                        name="contact" 
                        placeholder="email@university.edu or phone number"
                        required 
                        className="glass"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skills">Skills (comma-separated)</Label>
                    <Input 
                      id="skills" 
                      name="skills" 
                      placeholder="JavaScript, React, Node.js"
                      className="glass"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience</Label>
                    <Textarea 
                      id="experience" 
                      name="experience" 
                      placeholder="Describe your relevant experience..."
                      rows={3}
                      className="glass"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="availability">Availability</Label>
                    <Input 
                      id="availability" 
                      name="availability" 
                      placeholder="e.g., Weekdays 2-6 PM, Weekends flexible"
                      className="glass"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="images">Portfolio Images (comma-separated URLs)</Label>
                    <Input 
                      id="images" 
                      name="images" 
                      placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                      className="glass"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="videos">Portfolio Videos (comma-separated URLs)</Label>
                    <Input 
                      id="videos" 
                      name="videos" 
                      placeholder="https://youtube.com/watch?v=..., https://vimeo.com/..."
                      className="glass"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90" disabled={loading}>
                    {loading ? "Creating..." : "Create Service"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-4 flex-col sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48 glass">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {SERVICE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Card className="glass border hover:border-primary/40 transition-all duration-300 h-full hover:shadow-lg hover:shadow-primary/20 group">
                {/* Thumbnail Image */}
                {service.images && service.images.length > 0 && (
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <img 
                      src={service.images[0]} 
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                      {service.images.length} {service.images.length === 1 ? 'image' : 'images'}
                    </div>
                    {service.videos && service.videos.length > 0 && (
                      <div className="absolute top-2 left-2 bg-red-500/90 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        <Play className="h-3 w-3" />
                        {service.videos.length}
                      </div>
                    )}
                  </div>
                )}
                
                <CardHeader className={service.images && service.images.length > 0 ? "pb-2" : ""}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      ${service.price}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center rounded-full glass px-2.5 py-0.5 text-xs font-medium border border-primary/20">
                      {service.category}
                    </span>
                    {service.rating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {service.rating} ({service.reviews})
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">{service.description}</p>
                  
                  {service.skills && service.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {service.skills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {skill}
                        </span>
                      ))}
                      {service.skills.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{service.skills.length - 3} more</span>
                      )}
                    </div>
                  )}

                  {(service.images?.length > 0 || service.videos?.length > 0) && (
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      {service.images?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" />
                          {service.images.length} images
                        </span>
                      )}
                      {service.videos?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Play className="h-3 w-3" />
                          {service.videos.length} videos
                        </span>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t border-border/50">
                    <p className="text-sm font-medium">By: {service.userName}</p>
                    {service.availability && (
                      <p className="text-xs text-muted-foreground">Available: {service.availability}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full glass hover:bg-primary/10"
                    onClick={() => {
                      setSelectedService(service);
                      setDetailsOpen(true);
                    }}
                  >
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {filteredServices.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">No services found matching your criteria</p>
          </motion.div>
        )}

        {/* Service Details Modal */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-6xl glass border-0 bg-gradient-to-br from-background/95 via-primary/5 to-secondary/5 backdrop-blur-xl shadow-2xl mx-2 sm:mx-auto">
            {selectedService && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="max-h-[85vh] overflow-y-auto custom-scrollbar"
              >
                {/* Hero Section */}
                <div className="relative mb-8 -m-6 p-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-t-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg" />
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative z-10"
                  >
                    <DialogHeader className="text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg"
                      >
                        <Briefcase className="w-10 h-10 text-white" />
                      </motion.div>
                      <DialogTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
                        {selectedService.title}
                      </DialogTitle>
                      <DialogDescription className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-base sm:text-lg">
                        <motion.span 
                          whileHover={{ scale: 1.05 }}
                          className="inline-flex items-center rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 px-3 sm:px-4 py-2 text-sm font-medium backdrop-blur-sm"
                        >
                          {selectedService.category}
                        </motion.span>
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3, type: "spring" }}
                          className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent"
                        >
                          ${selectedService.price}
                        </motion.span>
                      </DialogDescription>
                    </DialogHeader>
                  </motion.div>
                </div>

                <div className="space-y-8">
                  {/* Images Gallery */}
                  {selectedService.images && selectedService.images.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          Portfolio Gallery
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {selectedService.images.map((image, index) => (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 * index, duration: 0.3 }}
                            whileHover={{ scale: 1.05, rotate: 1 }}
                            className="group relative aspect-square rounded-xl overflow-hidden border-2 border-gradient-to-r from-purple-500/30 to-pink-500/30 shadow-lg hover:shadow-purple-500/25"
                          >
                            <img 
                              src={image} 
                              alt={`Portfolio ${index + 1}`}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => window.open(image, '_blank')}
                              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            >
                              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-white" />
                              </div>
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Videos Gallery */}
                  {selectedService.videos && selectedService.videos.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                          <Play className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                          Video Showcase
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {selectedService.videos.map((video, index) => (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index }}
                            whileHover={{ scale: 1.02 }}
                            className="relative aspect-video rounded-xl overflow-hidden border-2 border-gradient-to-r from-red-500/30 to-orange-500/30 shadow-lg hover:shadow-red-500/25"
                          >
                            <video 
                              src={video} 
                              controls
                              className="w-full h-full object-cover rounded-xl"
                              preload="metadata"
                            />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Description */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        About This Service
                      </h3>
                    </div>
                    <div className="p-6 rounded-xl bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200/30 dark:border-blue-800/30">
                      <p className="text-lg leading-relaxed">{selectedService.description}</p>
                    </div>
                  </motion.div>

                  {/* Skills */}
                  {selectedService.skills && selectedService.skills.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                          <Star className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                          Skills & Expertise
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {selectedService.skills.map((skill, index) => (
                          <motion.span 
                            key={index}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 * index }}
                            whileHover={{ scale: 1.1, rotate: 2 }}
                            className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-medium shadow-lg hover:shadow-emerald-500/25"
                          >
                            {skill}
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Experience & Availability */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {selectedService.experience && (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-white" />
                          </div>
                          <h3 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                            Experience
                          </h3>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/30 dark:border-amber-800/30">
                          <p className="leading-relaxed">{selectedService.experience}</p>
                        </div>
                      </motion.div>
                    )}

                    {selectedService.availability && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                          <h3 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                            Availability
                          </h3>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 border border-violet-200/30 dark:border-violet-800/30">
                          <p className="leading-relaxed">{selectedService.availability}</p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Provider Info */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="p-6 rounded-xl bg-gradient-to-r from-slate-50/50 to-gray-50/50 dark:from-slate-950/50 dark:to-gray-950/50 border border-slate-200/30 dark:border-slate-800/30"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-slate-500 to-gray-500 flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-xl font-bold">Provider Information</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Provider</p>
                        <p className="font-semibold text-lg">{selectedService.userName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Contact</p>
                        <p className="font-semibold">{selectedService.contactInfo}</p>
                      </div>
                      {selectedService.rating > 0 && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-muted-foreground">Rating</p>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-5 w-5 ${i < selectedService.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                            <span className="font-semibold">{selectedService.rating} ({selectedService.reviews} reviews)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Contact Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full p-4 rounded-xl bg-gradient-to-r from-primary via-secondary to-accent text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Contact Provider Now
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </div>
  );
};

export default Services;
