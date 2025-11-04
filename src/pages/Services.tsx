import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Star, Briefcase, Play, Image as ImageIcon, TrendingUp, Calendar, Users, User, Mail, Phone, Lock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, doc, getDoc, runTransaction, where } from "firebase/firestore";
import { ReviewModal } from "@/components/ReviewModal";
import { Reviews } from "@/components/Reviews";
import { Rating } from "@/components/ui/rating";
import { useAuthState } from "react-firebase-hooks/auth";
import { useAuth } from "@/contexts/AuthContext";
import PremiumPaymentModal from "@/components/PremiumPaymentModal";

const SERVICE_CATEGORIES = ["Tutoring", "Design", "Writing", "Programming", "Event Planning", "Photography", "Music", "Fitness", "Other"];

interface Service {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhotoURL?: string;
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
  averageRating: number;
  ratingCount: number;
  createdAt: any;
}

const Services = () => {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const [user] = useAuthState(auth);
  const { userData } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [userProfileOpen, setUserProfileOpen] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (highlightId && services.length > 0) {
      const service = services.find(s => s.id === highlightId);
      if (service) {
        setSelectedService(service);
        setDetailsOpen(true);
      }
    }
  }, [highlightId, services]);

  const loadServices = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "services"));
      const servicesData = await Promise.all(
        querySnapshot.docs.map(async (serviceDoc) => {
          const serviceData = { id: serviceDoc.id, ...serviceDoc.data() } as Service;
          
          // Fetch user profile data
          if (serviceData.userId) {
            try {
              const userDoc = await getDoc(doc(db, "users", serviceData.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                serviceData.userPhotoURL = userData.photoURL;
              }
            } catch (error) {
              console.error("Error fetching user data:", error);
            }
          }
          
          return serviceData;
        })
      );
      const sortedServices = servicesData.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      setServices(sortedServices);
    } catch (error) {
      console.error("Error loading services:", error);
      toast.error("Error loading services");
    }
  };

  const showUserProfile = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        setSelectedUserProfile(userDoc.data());
        setUserProfileOpen(true);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      toast.error("Error loading user profile");
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
        averageRating: 0,
        ratingCount: 0,
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

  const handleAddReview = async (rating: number) => {
    if (!user || !selectedService) {
      toast.error("You must be logged in to leave a review.");
      return;
    }

    const serviceRef = doc(db, "services", selectedService.id);
    const reviewRef = collection(serviceRef, "reviews");

    // Check if the user has already reviewed this service
    const q = query(reviewRef, where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      toast.error("You have already reviewed this service.");
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const serviceDoc = await transaction.get(serviceRef);
        if (!serviceDoc.exists()) {
          throw "Service does not exist!";
        }

        const newRatingCount = (serviceDoc.data().ratingCount || 0) + 1;
        const oldRatingTotal = (serviceDoc.data().averageRating || 0) * (serviceDoc.data().ratingCount || 0);
        const newAverageRating = (oldRatingTotal + rating) / newRatingCount;

        transaction.update(serviceRef, {
          ratingCount: newRatingCount,
          averageRating: newAverageRating,
        });

        transaction.set(doc(reviewRef), {
          userId: user.uid,
          userName: user.displayName,
          userPhotoURL: user.photoURL,
          rating,
          createdAt: new Date(),
        });
      });

      toast.success("Review submitted successfully!");
      loadServices();
    } catch (error) {
      console.error("Error submitting review: ", error);
      toast.error("Error submitting review.");
    }
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
                      <Label htmlFor="price">Price (ETB)</Label>
                      <Input 
                        id="price" 
                        name="price" 
                        type="number" 
                        step="0.01"
                        placeholder="500.00"
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
                    <div className="flex items-center gap-3">
                      <Avatar 
                        className="w-10 h-10 cursor-pointer border-2 border-primary/20 hover:border-primary/40 transition-colors"
                        onClick={() => showUserProfile(service.userId)}
                      >
                        <AvatarImage src={service.userPhotoURL} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs font-bold">
                          {service.userName?.[0] || service.userEmail?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {service.price} ETB
                    </span>
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                    <span className="inline-flex items-center rounded-full glass px-2.5 py-0.5 text-xs font-medium border border-primary/20">
                      {service.category}
                    </span>
                    <span className="text-xs text-muted-foreground">by {service.userName || service.userEmail?.split('@')[0]}</span>
                    {service.averageRating > 0 && (
                      <div className="flex items-center gap-1">
                        <Rating rating={service.averageRating} size={12} />
                        <span className="text-xs text-muted-foreground">({service.ratingCount})</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {userData?.isPremium ? service.description : "Upgrade to premium to view service details and contact providers."}
                  </p>
                  
                  {!userData?.isPremium && (
                    <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                      <Lock className="w-4 h-4 text-primary" />
                      <span className="text-sm text-primary font-medium">Premium Required</span>
                    </div>
                  )}
                  
                  {userData?.isPremium && service.skills && service.skills.length > 0 && (
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

                  {!userData?.isPremium && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        Premium Required
                      </span>
                    </div>
                  )}

                  {userData?.isPremium && (service.images?.length > 0 || service.videos?.length > 0) && (
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
                    {userData?.isPremium && service.availability && (
                      <p className="text-xs text-muted-foreground">Available: {service.availability}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full glass hover:bg-primary/10"
                    onClick={() => {
                      if (!userData?.isPremium) {
                        setPaymentModalOpen(true);
                        return;
                      }
                      setSelectedService(service);
                      setDetailsOpen(true);
                    }}
                  >
                    {userData?.isPremium ? "View Details" : "Upgrade to View"}
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
          <DialogContent className="max-w-[95vw] sm:max-w-7xl glass border-0 bg-gradient-to-br from-background/95 via-primary/5 to-secondary/5 backdrop-blur-2xl shadow-2xl mx-2 sm:mx-auto overflow-hidden">
            {selectedService && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="max-h-[90vh] overflow-y-auto custom-scrollbar"
              >
                {/* Ultra Hero Section */}
                <div className="relative -m-6 mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 animate-pulse" />
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent" />
                  
                  <motion.div 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8, type: "spring", stiffness: 100 }}
                    className="relative z-10 p-8 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.4, duration: 0.8, type: "spring", stiffness: 200 }}
                      className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-2xl relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                      <Briefcase className="w-12 h-12 text-white relative z-10" />
                    </motion.div>
                    
                    <motion.h1
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.6 }}
                      className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight"
                    >
                      {selectedService.title}
                    </motion.h1>
                    
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring", stiffness: 300 }}
                      className="flex flex-col sm:flex-row items-center justify-center gap-4 text-lg"
                    >
                      <motion.span 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="inline-flex items-center rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 border-2 border-primary/30 px-6 py-3 text-sm font-bold backdrop-blur-sm shadow-lg"
                      >
                        ✨ {selectedService.category}
                      </motion.span>
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1, type: "spring", stiffness: 400 }}
                        className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent drop-shadow-lg"
                      >
                        {selectedService.price} ETB
                      </motion.span>
                    </motion.div>
                  </motion.div>
                </div>

                <div className="space-y-10">
                  {/* Ultra Images Gallery */}
                  {selectedService.images && selectedService.images.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.8 }}
                      className="space-y-6"
                    >
                      <motion.div 
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="flex items-center gap-4"
                      >
                        <motion.div 
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-xl"
                        >
                          <ImageIcon className="w-6 h-6 text-white" />
                        </motion.div>
                        <div>
                          <h3 className="text-3xl font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                            Portfolio Gallery
                          </h3>
                          <p className="text-muted-foreground">Showcase of amazing work</p>
                        </div>
                      </motion.div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {selectedService.images.map((image, index) => (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
                            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                            transition={{ 
                              delay: 0.5 + (index * 0.1), 
                              duration: 0.8,
                              type: "spring",
                              stiffness: 100
                            }}
                            whileHover={{ 
                              scale: 1.1, 
                              rotateY: 15,
                              z: 50,
                              transition: { duration: 0.3 }
                            }}
                            className="group relative aspect-square rounded-2xl overflow-hidden shadow-2xl hover:shadow-primary/50"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 z-10" />
                            <img 
                              src={image} 
                              alt={`Portfolio ${index + 1}`}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 z-20" />
                            <motion.button
                              whileHover={{ scale: 1.2, rotate: 360 }}
                              whileTap={{ scale: 0.8 }}
                              onClick={() => window.open(image, '_blank')}
                              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-30"
                            >
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl flex items-center justify-center border border-white/30">
                                <ImageIcon className="w-8 h-8 text-white" />
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
                      {selectedService.averageRating > 0 && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-muted-foreground">Rating</p>
                          <div className="flex items-center gap-2">
                            <Rating rating={selectedService.averageRating} />
                            <span className="font-semibold">{selectedService.averageRating.toFixed(1)} ({selectedService.ratingCount} reviews)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <Reviews itemId={selectedService.id} itemType="service" />
                  </motion.div>

                  {/* Ultra Contact Options */}
                  <Button onClick={() => setReviewModalOpen(true)}>Leave a Review</Button>

                  <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.8, type: "spring", stiffness: 100 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-3xl blur-xl" />
                    <div className="relative glass rounded-3xl p-8 border border-primary/30 shadow-2xl">
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.4, type: "spring", stiffness: 200 }}
                        className="flex items-center gap-4 mb-8"
                      >
                        <motion.div 
                          whileHover={{ rotate: 360, scale: 1.2 }}
                          transition={{ duration: 0.6 }}
                          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-2xl"
                        >
                          <Users className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                          <h3 className="text-3xl font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                            Connect Now
                          </h3>
                          <p className="text-muted-foreground">Choose your preferred way to connect</p>
                        </div>
                      </motion.div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                        {/* Email */}
                        <motion.a
                          href={`mailto:${selectedService.contactInfo}`}
                          initial={{ opacity: 0, y: 50, rotateX: 90 }}
                          animate={{ opacity: 1, y: 0, rotateX: 0 }}
                          transition={{ delay: 1.5, duration: 0.6 }}
                          whileHover={{ 
                            scale: 1.1, 
                            rotateY: 15,
                            boxShadow: "0 20px 40px rgba(59, 130, 246, 0.5)"
                          }}
                          whileTap={{ scale: 0.95 }}
                          className="group relative flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 hover:border-blue-400/60 transition-all duration-500 backdrop-blur-sm"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <motion.div 
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.8 }}
                            className="text-5xl mb-3 group-hover:scale-125 transition-transform duration-500"
                          >
                            📧
                          </motion.div>
                          <span className="text-sm font-bold text-blue-300 group-hover:text-blue-200 transition-colors">Email</span>
                        </motion.a>

                        {/* Phone */}
                        {selectedService.phone && (
                          <motion.a
                            href={`tel:${selectedService.phone}`}
                            initial={{ opacity: 0, y: 50, rotateX: 90 }}
                            animate={{ opacity: 1, y: 0, rotateX: 0 }}
                            transition={{ delay: 1.6, duration: 0.6 }}
                            whileHover={{ 
                              scale: 1.1, 
                              rotateY: 15,
                              boxShadow: "0 20px 40px rgba(34, 197, 94, 0.5)"
                            }}
                            whileTap={{ scale: 0.95 }}
                            className="group relative flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 hover:border-green-400/60 transition-all duration-500 backdrop-blur-sm"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-emerald-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <motion.div 
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.8 }}
                              className="text-5xl mb-3 group-hover:scale-125 transition-transform duration-500"
                            >
                              📞
                            </motion.div>
                            <span className="text-sm font-bold text-green-300 group-hover:text-green-200 transition-colors">Call</span>
                          </motion.a>
                        )}
                        
                        {/* WhatsApp */}
                        {selectedService.whatsapp && (
                          <motion.a
                            href={`https://wa.me/${selectedService.whatsapp.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 50, rotateX: 90 }}
                            animate={{ opacity: 1, y: 0, rotateX: 0 }}
                            transition={{ delay: 1.7, duration: 0.6 }}
                            whileHover={{ 
                              scale: 1.1, 
                              rotateY: 15,
                              boxShadow: "0 20px 40px rgba(34, 197, 94, 0.5)"
                            }}
                            whileTap={{ scale: 0.95 }}
                            className="group relative flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-lime-500/20 border border-green-400/30 hover:border-green-400/60 transition-all duration-500 backdrop-blur-sm"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-lime-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <motion.div 
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.8 }}
                              className="text-5xl mb-3 group-hover:scale-125 transition-transform duration-500"
                            >
                              💬
                            </motion.div>
                            <span className="text-sm font-bold text-green-300 group-hover:text-green-200 transition-colors">WhatsApp</span>
                          </motion.a>
                        )}
                        
                        {/* Telegram */}
                        {selectedService.telegram && (
                          <motion.a
                            href={`https://t.me/${selectedService.telegram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 50, rotateX: 90 }}
                            animate={{ opacity: 1, y: 0, rotateX: 0 }}
                            transition={{ delay: 1.8, duration: 0.6 }}
                            whileHover={{ 
                              scale: 1.1, 
                              rotateY: 15,
                              boxShadow: "0 20px 40px rgba(59, 130, 246, 0.5)"
                            }}
                            whileTap={{ scale: 0.95 }}
                            className="group relative flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-sky-500/20 border border-blue-400/30 hover:border-blue-400/60 transition-all duration-500 backdrop-blur-sm"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-sky-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <motion.div 
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.8 }}
                              className="text-5xl mb-3 group-hover:scale-125 transition-transform duration-500"
                            >
                              ✈️
                            </motion.div>
                            <span className="text-sm font-bold text-blue-300 group-hover:text-blue-200 transition-colors">Telegram</span>
                          </motion.a>
                        )}
                        
                        {/* Instagram */}
                        {selectedService.instagram && (
                          <motion.a
                            href={`https://instagram.com/${selectedService.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 50, rotateX: 90 }}
                            animate={{ opacity: 1, y: 0, rotateX: 0 }}
                            transition={{ delay: 1.9, duration: 0.6 }}
                            whileHover={{ 
                              scale: 1.1, 
                              rotateY: 15,
                              boxShadow: "0 20px 40px rgba(236, 72, 153, 0.5)"
                            }}
                            whileTap={{ scale: 0.95 }}
                            className="group relative flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-400/30 hover:border-pink-400/60 transition-all duration-500 backdrop-blur-sm"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/10 to-rose-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <motion.div 
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.8 }}
                              className="text-5xl mb-3 group-hover:scale-125 transition-transform duration-500"
                            >
                              📷
                            </motion.div>
                            <span className="text-sm font-bold text-pink-300 group-hover:text-pink-200 transition-colors">Instagram</span>
                          </motion.a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </DialogContent>
        </Dialog>

        {/* User Profile Popup */}
        <Dialog open={userProfileOpen} onOpenChange={setUserProfileOpen}>
          <DialogContent className="glass max-w-md">
            <DialogHeader>
              <DialogTitle className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                User Profile
              </DialogTitle>
            </DialogHeader>
            {selectedUserProfile && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 border-2 border-primary/20">
                    <AvatarImage src={selectedUserProfile.photoURL} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-lg font-bold">
                      {selectedUserProfile.displayName?.[0] || selectedUserProfile.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedUserProfile.displayName || selectedUserProfile.email?.split('@')[0]}</h3>
                    <p className="text-sm text-muted-foreground">{selectedUserProfile.email}</p>
                  </div>
                </div>
                
                {selectedUserProfile.bio && (
                  <div>
                    <h4 className="font-medium mb-1">Bio</h4>
                    <p className="text-sm text-muted-foreground">{selectedUserProfile.bio}</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  {selectedUserProfile.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary" />
                      <span className="text-sm">{selectedUserProfile.phone}</span>
                    </div>
                  )}
                  {selectedUserProfile.location && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      <span className="text-sm">{selectedUserProfile.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    <span className="text-sm">{selectedUserProfile.email}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Premium Payment Modal */}
        <PremiumPaymentModal 
          open={paymentModalOpen} 
          onOpenChange={setPaymentModalOpen} 
        />

        {selectedService && (
          <ReviewModal
            open={reviewModalOpen}
            onOpenChange={setReviewModalOpen}
            onSubmit={handleAddReview}
            productName={selectedService.title}
          />
        )}
        </div>
      </div>
    </div>
  );
};

export default Services;
