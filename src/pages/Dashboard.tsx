import { useEffect, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, ShoppingBag, Plus, Upload, X, Play, Image as ImageIcon } from "lucide-react";
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

const Dashboard = () => {
  const [user] = useAuthState(auth);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <TopNav />
      
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              My Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">Manage your services and products</p>
          </div>

          <div className="flex gap-2">
            <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-primary to-secondary">
                  <Plus className="h-4 w-4" />
                  Create Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl glass max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Service</DialogTitle>
                  <DialogDescription>Share your skills with the community</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateService} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price ($)</Label>
                      <Input id="price" name="price" type="number" step="0.01" required className="glass" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact">Contact Info</Label>
                      <Input id="contact" name="contact" required className="glass" />
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

                  <div className="grid grid-cols-2 gap-4">
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
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  List Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl glass max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>List New Product</DialogTitle>
                  <DialogDescription>Sell items to fellow students</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProduct} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-3 gap-4">
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
                      <Label htmlFor="price">Price ($)</Label>
                      <Input id="price" name="price" type="number" step="0.01" required className="glass" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="originalPrice">Original Price ($)</Label>
                      <Input id="originalPrice" name="originalPrice" type="number" step="0.01" className="glass" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" name="location" required className="glass" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact">Contact Info</Label>
                      <Input id="contact" name="contact" required className="glass" />
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
              <CardTitle>Total Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{services.length + products.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Listings Tabs */}
        <Tabs defaultValue="services" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="services">My Services</TabsTrigger>
            <TabsTrigger value="products">My Products</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <Card key={service.id} className="glass">
                  <CardHeader>
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                    <CardDescription>{service.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-bold">${service.price}</span>
                      <div className="flex gap-1 text-xs text-muted-foreground">
                        {service.images?.length > 0 && (
                          <span className="flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" />
                            {service.images.length}
                          </span>
                        )}
                        {service.videos?.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Play className="h-3 w-3" />
                            {service.videos.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Card key={product.id} className="glass">
                  <CardHeader>
                    <CardTitle className="text-lg">{product.title}</CardTitle>
                    <CardDescription>{product.category} • {product.condition}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-bold">${product.price}</span>
                      {product.images?.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ImageIcon className="h-3 w-3" />
                          {product.images.length}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
