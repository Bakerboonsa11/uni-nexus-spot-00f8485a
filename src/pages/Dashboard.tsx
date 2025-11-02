import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, ShoppingBag, Plus, Upload, X, Play, Image as ImageIcon, Eye, Users } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { uploadToCloudinary, validateFile } from "@/lib/cloudinary";

const SERVICE_CATEGORIES = ["Tutoring", "Design", "Writing", "Programming", "Event Planning", "Photography", "Music", "Fitness", "Other"];
const PRODUCT_CATEGORIES = ["Books", "Electronics", "Clothing", "Furniture", "Sports Equipment", "Stationery", "Other"];
const PRODUCT_CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  images: string[];
  videos: string[];
  skills: string[];
  createdAt: any;
}

interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  images: string[];
  createdAt: any;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  benefits: string[];
  deadline: string;
  contactEmail: string;
  remote: boolean;
  experience: string;
  category: string;
  userId: string;
  userEmail: string;
  createdAt: any;
}

interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  phone: string;
  coverLetter: string;
  appliedAt: any;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  // Social media and profile info
  linkedin?: string;
  telegram?: string;
  whatsapp?: string;
  instagram?: string;
  github?: string;
  portfolio?: string;
  experience?: string;
  skills?: string;
  education?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [applicationDetailsOpen, setApplicationDetailsOpen] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      console.log("Loading user data for:", user.uid);
      
      // Load all services and filter client-side to avoid index requirement
      const servicesSnapshot = await getDocs(collection(db, "services"));
      const allServices = servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
      
      // Filter user's services
      const userServices = allServices.filter(service => service.userId === user.uid);
      setServices(userServices);
      console.log("Loaded services:", userServices.length);

      // Load all products and filter client-side
      const productsSnapshot = await getDocs(collection(db, "products"));
      const allProducts = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      // Filter user's products
      const userProducts = allProducts.filter(product => product.userId === user.uid);
      setProducts(userProducts);
      console.log("Loaded products:", userProducts.length);

      // Load all jobs and filter client-side
      const jobsSnapshot = await getDocs(collection(db, "jobs"));
      const allJobs = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Job[];
      
      // Filter user's jobs
      const userJobs = allJobs.filter(job => job.userId === user.uid);
      setJobs(userJobs);
      console.log("Loaded jobs:", userJobs.length);

      // Load applications for user's jobs
      const applicationsSnapshot = await getDocs(collection(db, "jobApplications"));
      const allApplications = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as JobApplication[];
      
      // Filter applications for user's jobs
      const userJobIds = userJobs.map(job => job.id);
      const userJobApplications = allApplications.filter(app => userJobIds.includes(app.jobId));
      setApplications(userJobApplications);
      console.log("Loaded applications:", userJobApplications.length);
      
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleFileUpload = async (files: FileList, type: 'image' | 'video'): Promise<string[]> => {
    console.log(`Starting upload of ${files.length} ${type} files`);
    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`);
      
      const validationError = validateFile(file, type);
      
      if (validationError) {
        console.error(`Validation failed for ${file.name}:`, validationError);
        toast.error(`${file.name}: ${validationError}`);
        continue;
      }

      try {
        setUploadingFiles(prev => [...prev, file.name]);
        console.log(`Uploading ${file.name} to Cloudinary...`);
        
        const url = await uploadToCloudinary(file, type);
        uploadedUrls.push(url);
        
        console.log(`Successfully uploaded ${file.name}, URL:`, url);
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        console.error(`Upload failed for ${file.name}:`, error);
        toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setUploadingFiles(prev => prev.filter(name => name !== file.name));
      }
    }

    console.log(`Upload complete. ${uploadedUrls.length}/${files.length} files uploaded successfully`);
    return uploadedUrls;
  };

  const handleCreateService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    console.log("Starting service creation...");
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      // Handle image uploads
      const imageFiles = (e.currentTarget.querySelector('#service-images') as HTMLInputElement)?.files;
      const videoFiles = (e.currentTarget.querySelector('#service-videos') as HTMLInputElement)?.files;

      console.log(`Found ${imageFiles?.length || 0} image files and ${videoFiles?.length || 0} video files`);

      let imageUrls: string[] = [];
      let videoUrls: string[] = [];

      // Upload images if any
      if (imageFiles && imageFiles.length > 0) {
        console.log("Uploading images...");
        imageUrls = await handleFileUpload(imageFiles, 'image');
        console.log("Image upload complete:", imageUrls);
      }

      // Upload videos if any
      if (videoFiles && videoFiles.length > 0) {
        console.log("Uploading videos...");
        videoUrls = await handleFileUpload(videoFiles, 'video');
        console.log("Video upload complete:", videoUrls);
      }

      // Create service data
      const serviceData = {
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userEmail: user.email,
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        category: formData.get("category") as string,
        price: parseFloat(formData.get("price") as string),
        contactInfo: formData.get("contact") as string,
        phone: formData.get("phone") as string,
        telegram: formData.get("telegram") as string,
        whatsapp: formData.get("whatsapp") as string,
        instagram: formData.get("instagram") as string,
        images: imageUrls,
        videos: videoUrls,
        skills: (formData.get("skills") as string).split(",").filter(skill => skill.trim()),
        experience: formData.get("experience") as string,
        availability: formData.get("availability") as string,
        rating: 0,
        reviews: 0,
        createdAt: new Date()
      };

      console.log("Creating service with data:", serviceData);

      await addDoc(collection(db, "services"), serviceData);

      console.log("Service created successfully");
      toast.success("Service created successfully!");
      setServiceDialogOpen(false);
      loadUserData();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Error creating service:", error);
      toast.error(`Error creating service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setLoading(false);
  };

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    console.log("Starting product creation...");
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      // Handle image uploads
      const imageFiles = (e.currentTarget.querySelector('#product-images') as HTMLInputElement)?.files;

      console.log(`Found ${imageFiles?.length || 0} image files`);

      let imageUrls: string[] = [];

      // Upload images if any
      if (imageFiles && imageFiles.length > 0) {
        console.log("Uploading product images...");
        imageUrls = await handleFileUpload(imageFiles, 'image');
        console.log("Product image upload complete:", imageUrls);
      }

      // Create product data
      const productData = {
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userEmail: user.email,
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        category: formData.get("category") as string,
        condition: formData.get("condition") as string,
        price: parseFloat(formData.get("price") as string),
        originalPrice: formData.get("originalPrice") ? parseFloat(formData.get("originalPrice") as string) : undefined,
        contactInfo: formData.get("contact") as string,
        phone: formData.get("phone") as string,
        telegram: formData.get("telegram") as string,
        whatsapp: formData.get("whatsapp") as string,
        instagram: formData.get("instagram") as string,
        images: imageUrls,
        location: formData.get("location") as string,
        negotiable: formData.get("negotiable") === "on",
        createdAt: new Date()
      };

      console.log("Creating product with data:", productData);

      await addDoc(collection(db, "products"), productData);

      console.log("Product created successfully");
      toast.success("Product listed successfully!");
      setProductDialogOpen(false);
      loadUserData();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error(`Error creating product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setLoading(false);
  };

  const handleCreateJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const jobData = {
        userId: user.uid,
        userEmail: user.email,
        title: formData.get("title") as string,
        company: formData.get("company") as string,
        location: formData.get("location") as string,
        type: formData.get("type") as string,
        salary: formData.get("salary") as string,
        description: formData.get("description") as string,
        requirements: (formData.get("requirements") as string).split(',').map(r => r.trim()),
        benefits: (formData.get("benefits") as string).split(',').map(b => b.trim()),
        deadline: formData.get("deadline") as string,
        contactEmail: formData.get("contactEmail") as string,
        remote: formData.get("remote") === "on",
        experience: formData.get("experience") as string,
        category: formData.get("category") as string,
        createdAt: new Date()
      };

      await addDoc(collection(db, "jobs"), jobData);
      toast.success("Job posted successfully!");
      setJobDialogOpen(false);
      loadUserData();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Error creating job:", error);
      toast.error(`Error creating job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <TopNav />
      
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              My Dashboard
            </h1>
            <p className="text-base lg:text-lg text-muted-foreground">Manage your services and products</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-primary to-secondary w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Create Service</span>
                  <span className="sm:hidden">Service</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-3xl glass max-h-[90vh] overflow-y-auto mx-4">
                <DialogHeader>
                  <DialogTitle>Create New Service</DialogTitle>
                  <DialogDescription>Share your skills with the community</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateService} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Service Title</Label>
                      <Input id="title" name="title" required className="glass" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select name="category" required>
                        <SelectTrigger className="glass">
                          <SelectValue />
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
                    <Textarea id="description" name="description" required className="glass" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (ETB)</Label>
                      <Input id="price" name="price" type="number" step="0.01" required className="glass" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact">Email</Label>
                      <Input id="contact" name="contact" type="email" placeholder="email@university.edu" required className="glass" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" type="tel" placeholder="+251912345678" className="glass" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telegram">Telegram</Label>
                      <Input id="telegram" name="telegram" placeholder="@username" className="glass" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input id="whatsapp" name="whatsapp" type="tel" placeholder="+251912345678" className="glass" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input id="instagram" name="instagram" placeholder="@username" className="glass" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skills">Skills (comma-separated)</Label>
                    <Input id="skills" name="skills" className="glass" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience</Label>
                    <Textarea id="experience" name="experience" className="glass" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="availability">Availability</Label>
                    <Input id="availability" name="availability" className="glass" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="service-images">Images</Label>
                      <Input id="service-images" type="file" multiple accept="image/*" className="glass" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="service-videos">Videos (MP4, max 2GB each)</Label>
                      <Input id="service-videos" type="file" multiple accept="video/mp4" className="glass" />
                    </div>
                  </div>

                  {uploadingFiles.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Uploading: {uploadingFiles.join(", ")}...
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading || uploadingFiles.length > 0}>
                    {loading ? "Creating..." : "Create Service"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">List Product</span>
                  <span className="sm:hidden">Product</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-3xl glass max-h-[90vh] overflow-y-auto mx-4">
                <DialogHeader>
                  <DialogTitle>List New Product</DialogTitle>
                  <DialogDescription>Sell items to fellow students</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProduct} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Product Title</Label>
                      <Input id="title" name="title" required className="glass" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select name="category" required>
                        <SelectTrigger className="glass">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRODUCT_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" required className="glass" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition</Label>
                      <Select name="condition" required>
                        <SelectTrigger className="glass">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRODUCT_CONDITIONS.map((condition) => (
                            <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (ETB)</Label>
                      <Input id="price" name="price" type="number" step="0.01" required className="glass" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="originalPrice">Original Price (ETB)</Label>
                      <Input id="originalPrice" name="originalPrice" type="number" step="0.01" className="glass" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" name="location" required className="glass" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact">Email</Label>
                      <Input id="contact" name="contact" type="email" placeholder="email@university.edu" required className="glass" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" type="tel" placeholder="+251912345678" className="glass" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telegram">Telegram</Label>
                      <Input id="telegram" name="telegram" placeholder="@username" className="glass" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input id="whatsapp" name="whatsapp" type="tel" placeholder="+251912345678" className="glass" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input id="instagram" name="instagram" placeholder="@username" className="glass" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product-images">Product Images</Label>
                    <Input id="product-images" type="file" multiple accept="image/*" className="glass" />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="negotiable" name="negotiable" />
                    <Label htmlFor="negotiable">Price is negotiable</Label>
                  </div>

                  {uploadingFiles.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Uploading: {uploadingFiles.join(", ")}...
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading || uploadingFiles.length > 0}>
                    {loading ? "Listing..." : "List Product"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                My Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{services.length}</div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                My Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{products.length}</div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                My Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{jobs.length}</div>
                <Button
                  onClick={() => setJobDialogOpen(true)}
                  size="sm"
                  className="bg-gradient-to-r from-accent to-primary hover:opacity-90"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Post Job
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Total Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{services.length + products.length + jobs.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Listings Tabs */}
        <Tabs defaultValue="services" className="space-y-6">
          <TabsList className="glass w-full grid grid-cols-2 lg:grid-cols-4 h-auto p-1">
            <TabsTrigger value="services" className="text-xs sm:text-sm">My Services</TabsTrigger>
            <TabsTrigger value="products" className="text-xs sm:text-sm">My Products</TabsTrigger>
            <TabsTrigger value="jobs" className="text-xs sm:text-sm">My Jobs</TabsTrigger>
            <TabsTrigger value="applications" className="text-xs sm:text-sm">Apps ({applications.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-4">
            <div className="space-y-2">
              {services.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-muted-foreground"
                >
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No services yet. Create your first service!</p>
                </motion.div>
              ) : (
                services.map((service, index) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => navigate(`/services?highlight=${service.id}`)}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-background/50 via-primary/5 to-secondary/5 border border-primary/10 hover:border-primary/30 transition-all duration-300 backdrop-blur-sm cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-primary/20 flex-shrink-0"
                        >
                          <Briefcase className="w-6 h-6 text-primary" />
                        </motion.div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                            {service.title}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 sm:truncate">
                            {service.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {service.category}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {service.images?.length || 0} images • {service.videos?.length || 0} videos
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-4">
                        <div className="text-left sm:text-right">
                          <div className="text-xl sm:text-2xl font-black bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                            {service.price} ETB
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {service.availability || 'Available'}
                          </div>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => navigate(`/services?highlight=${service.id}`)}
                          className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors flex-shrink-0"
                        >
                          <Eye className="w-4 h-4 text-primary" />
                        </motion.button>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <div className="space-y-2">
              {products.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-muted-foreground"
                >
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No products yet. List your first product!</p>
                </motion.div>
              ) : (
                products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => navigate(`/market?highlight=${product.id}`)}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-background/50 via-secondary/5 to-accent/5 border border-secondary/10 hover:border-secondary/30 transition-all duration-300 backdrop-blur-sm cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4 flex-1">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center border border-secondary/20"
                        >
                          <ShoppingBag className="w-6 h-6 text-secondary" />
                        </motion.div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-lg truncate group-hover:text-secondary transition-colors">
                            {product.title}
                          </h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {product.description}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                              {product.category}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
                              {product.condition}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {product.images?.length || 0} images
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-2xl font-black bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                            {product.price} ETB
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {product.location || 'Location not set'}
                          </div>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => navigate(`/market?highlight=${product.id}`)}
                          className="w-8 h-8 rounded-lg bg-secondary/10 hover:bg-secondary/20 flex items-center justify-center transition-colors"
                        >
                          <Eye className="w-4 h-4 text-secondary" />
                        </motion.button>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <div className="space-y-2">
              {jobs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-muted-foreground"
                >
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No jobs yet. Post your first job!</p>
                </motion.div>
              ) : (
                jobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => navigate(`/jobs?highlight=${job.id}`)}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-background/50 via-accent/5 to-primary/5 border border-accent/10 hover:border-accent/30 transition-all duration-300 backdrop-blur-sm cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4 flex-1">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center border border-accent/20"
                        >
                          <Briefcase className="w-6 h-6 text-accent" />
                        </motion.div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-lg truncate group-hover:text-accent transition-colors">
                            {job.title}
                          </h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {job.company} • {job.location}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
                              {job.type}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {job.category}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Deadline: {job.deadline}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-2xl font-black bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                            {job.salary}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {job.remote ? 'Remote' : 'On-site'}
                          </div>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => navigate(`/jobs?highlight=${job.id}`)}
                          className="w-8 h-8 rounded-lg bg-accent/10 hover:bg-accent/20 flex items-center justify-center transition-colors"
                        >
                          <Eye className="w-4 h-4 text-accent" />
                        </motion.button>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            <div className="space-y-2">
              {applications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-muted-foreground"
                >
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No applications yet. Post jobs to receive applications!</p>
                </motion.div>
              ) : (
                applications.map((application, index) => (
                  <motion.div
                    key={application.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-background/50 via-blue-500/5 to-purple-500/5 border border-blue-500/10 hover:border-blue-500/30 transition-all duration-300 backdrop-blur-sm"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4 flex-1">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/20"
                        >
                          <Users className="w-6 h-6 text-blue-500" />
                        </motion.div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-lg truncate group-hover:text-blue-500 transition-colors">
                            {application.applicantName}
                          </h4>
                          <p className="text-sm font-medium text-blue-600 truncate">
                            Applied for: {application.jobTitle}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              application.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' :
                              application.status === 'reviewed' ? 'bg-blue-500/10 text-blue-600' :
                              application.status === 'accepted' ? 'bg-green-500/10 text-green-600' :
                              'bg-red-500/10 text-red-600'
                            }`}>
                              {application.status.toUpperCase()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              📧 {application.applicantEmail}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              📱 {application.phone}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-muted-foreground">
                            Applied on
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {application.appliedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                          </div>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setSelectedApplication(application);
                            setApplicationDetailsOpen(true);
                          }}
                          className="w-8 h-8 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 flex items-center justify-center transition-colors"
                        >
                          <Eye className="w-4 h-4 text-blue-500" />
                        </motion.button>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Job Creation Dialog */}
      <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
        <DialogContent className="glass max-w-2xl">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Post a Job
            </DialogTitle>
            <DialogDescription>Share job opportunities with the community</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateJob} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input id="title" name="title" placeholder="Frontend Developer" required className="glass" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" name="company" placeholder="TechCorp Ethiopia" required className="glass" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" placeholder="Addis Ababa" required className="glass" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Job Type</Label>
                <select id="type" name="type" required className="w-full px-3 py-2 rounded-md glass border border-input">
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary">Salary Range</Label>
                <Input id="salary" name="salary" placeholder="25,000 - 35,000 ETB" required className="glass" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select id="category" name="category" required className="w-full px-3 py-2 rounded-md glass border border-input">
                  <option value="Technology">Technology</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Design">Design</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Business">Business</option>
                  <option value="Education">Education</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea id="description" name="description" placeholder="Describe the role and responsibilities..." required className="glass min-h-[100px]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements (comma-separated)</Label>
                <Textarea id="requirements" name="requirements" placeholder="React.js, TypeScript, 3+ years experience" required className="glass" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="benefits">Benefits (comma-separated)</Label>
                <Textarea id="benefits" name="benefits" placeholder="Health Insurance, Flexible Hours, Remote Work" className="glass" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadline">Application Deadline</Label>
                <Input id="deadline" name="deadline" type="date" required className="glass" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input id="contactEmail" name="contactEmail" type="email" placeholder="hr@company.com" required className="glass" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience">Experience Level</Label>
                <select id="experience" name="experience" required className="w-full px-3 py-2 rounded-md glass border border-input">
                  <option value="Entry-level">Entry-level</option>
                  <option value="Mid-level">Mid-level</option>
                  <option value="Senior-level">Senior-level</option>
                </select>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input type="checkbox" id="remote" name="remote" className="rounded" />
                <Label htmlFor="remote">Remote work available</Label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setJobDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-primary to-secondary">
                {loading ? "Posting..." : "Post Job"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Applicant Profile Dialog */}
      <Dialog open={applicationDetailsOpen} onOpenChange={setApplicationDetailsOpen}>
        <DialogContent className="max-w-4xl glass border-0 bg-gradient-to-br from-background/95 via-blue-500/5 to-purple-500/5 backdrop-blur-2xl">
          {selectedApplication && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                      {selectedApplication.applicantName}
                    </DialogTitle>
                    <DialogDescription className="text-lg font-medium text-blue-600">
                      Applied for: {selectedApplication.jobTitle}
                    </DialogDescription>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>📅 {selectedApplication.appliedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedApplication.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' :
                        selectedApplication.status === 'reviewed' ? 'bg-blue-500/10 text-blue-600' :
                        selectedApplication.status === 'accepted' ? 'bg-green-500/10 text-green-600' :
                        'bg-red-500/10 text-red-600'
                      }`}>
                        {selectedApplication.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3 text-blue-600">📞 Contact Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">📧 Email:</span>
                        <a href={`mailto:${selectedApplication.applicantEmail}`} className="text-blue-600 hover:underline">
                          {selectedApplication.applicantEmail}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">📱 Phone:</span>
                        <a href={`tel:${selectedApplication.phone}`} className="text-blue-600 hover:underline">
                          {selectedApplication.phone}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 text-purple-600">🌐 Social Media & Links</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedApplication.linkedin && (
                        <a href={selectedApplication.linkedin} target="_blank" rel="noopener noreferrer" 
                           className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors">
                          <span className="text-blue-600">💼</span>
                          <span className="text-sm">LinkedIn</span>
                        </a>
                      )}
                      {selectedApplication.github && (
                        <a href={selectedApplication.github} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-2 p-2 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 transition-colors">
                          <span>🐙</span>
                          <span className="text-sm">GitHub</span>
                        </a>
                      )}
                      {selectedApplication.portfolio && (
                        <a href={selectedApplication.portfolio} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors">
                          <span className="text-green-600">🌐</span>
                          <span className="text-sm">Portfolio</span>
                        </a>
                      )}
                      {selectedApplication.telegram && (
                        <a href={`https://t.me/${selectedApplication.telegram}`} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-2 p-2 rounded-lg bg-blue-400/10 hover:bg-blue-400/20 transition-colors">
                          <span className="text-blue-400">✈️</span>
                          <span className="text-sm">Telegram</span>
                        </a>
                      )}
                      {selectedApplication.whatsapp && (
                        <a href={`https://wa.me/${selectedApplication.whatsapp}`} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors">
                          <span className="text-green-500">📱</span>
                          <span className="text-sm">WhatsApp</span>
                        </a>
                      )}
                      {selectedApplication.instagram && (
                        <a href={`https://instagram.com/${selectedApplication.instagram}`} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-2 p-2 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 transition-colors">
                          <span className="text-pink-500">📷</span>
                          <span className="text-sm">Instagram</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3 text-green-600">🎓 Professional Info</h3>
                    <div className="space-y-3">
                      {selectedApplication.education && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Education:</span>
                          <p className="text-sm">{selectedApplication.education}</p>
                        </div>
                      )}
                      {selectedApplication.experience && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Experience:</span>
                          <p className="text-sm">{selectedApplication.experience}</p>
                        </div>
                      )}
                      {selectedApplication.skills && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Skills:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedApplication.skills.split(',').map((skill, i) => (
                              <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                                {skill.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 text-orange-600">📝 Cover Letter</h3>
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <p className="text-sm whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setApplicationDetailsOpen(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => window.open(`mailto:${selectedApplication.applicantEmail}?subject=Regarding your application for ${selectedApplication.jobTitle}`)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  📧 Send Email
                </Button>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
