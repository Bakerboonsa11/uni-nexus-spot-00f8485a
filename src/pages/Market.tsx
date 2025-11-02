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
import { Plus, Search, Package, MapPin, Calendar, Image as ImageIcon, User, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { uploadToCloudinary, validateFile } from "@/lib/cloudinary";

const PRODUCT_CATEGORIES = ["Books", "Electronics", "Clothing", "Furniture", "Sports Equipment", "Stationery", "Other"];
const PRODUCT_CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];

interface Product {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhotoURL?: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  originalPrice?: number;
  contactInfo: string;
  images: string[];
  location: string;
  negotiable: boolean;
  createdAt: any;
}

const Market = () => {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const [user] = useAuthState(auth);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [userProfileOpen, setUserProfileOpen] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (highlightId && products.length > 0) {
      const product = products.find(p => p.id === highlightId);
      if (product) {
        setSelectedProduct(product);
        setDetailsOpen(true);
      }
    }
  }, [highlightId, products]);

  const loadProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const productsData = await Promise.all(
        querySnapshot.docs.map(async (productDoc) => {
          const productData = { id: productDoc.id, ...productDoc.data() } as Product;
          
          // Fetch user profile data
          if (productData.userId) {
            try {
              const userDoc = await getDoc(doc(db, "users", productData.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                productData.userPhotoURL = userData.photoURL;
              }
            } catch (error) {
              console.error("Error fetching user data:", error);
            }
          }
          
          return productData;
        })
      );
      setProducts(productsData);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Error loading products");
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

  const seedMockData = async () => {
    if (!user) return;
    
    const mockProducts = [
      {
        userId: user.uid,
        userName: "John Smith",
        userEmail: "john.s@university.edu",
        title: "iPhone 13 Pro Max - 256GB",
        description: "Excellent condition iPhone 13 Pro Max in Pacific Blue.",
        category: "Electronics",
        condition: "Like New",
        price: 850,
        originalPrice: 1099,
        contactInfo: "john.s@university.edu",
        images: ["https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500"],
        location: "Campus Dorm A",
        negotiable: true,
        createdAt: new Date()
      }
    ];

    try {
      for (const product of mockProducts) {
        await addDoc(collection(db, "products"), product);
      }
      toast.success("Mock products seeded successfully!");
      loadProducts();
    } catch (error) {
      console.error("Error seeding data:", error);
      toast.error("Error seeding data");
    }
  };

  const handleFileUpload = async (files: FileList, type: 'image' | 'video'): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validationError = validateFile(file, type);
      
      if (validationError) {
        toast.error(`${file.name}: ${validationError}`);
        continue;
      }

      try {
        setUploadingFiles(prev => [...prev, file.name]);
        const url = await uploadToCloudinary(file, type);
        uploadedUrls.push(url);
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        console.error(`Upload failed for ${file.name}:`, error);
        toast.error(`Failed to upload ${file.name}`);
      } finally {
        setUploadingFiles(prev => prev.filter(name => name !== file.name));
      }
    }

    return uploadedUrls;
  };

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      await addDoc(collection(db, "products"), {
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
        images: (formData.get("images") as string).split(",").filter(url => url.trim()),
        location: formData.get("location") as string,
        negotiable: formData.get("negotiable") === "on",
        createdAt: new Date()
      });

      toast.success("Product listed successfully!");
      setOpen(false);
      loadProducts();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Error creating product");
    }

    setLoading(false);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "New": return "bg-green-100 text-green-800 border-green-200";
      case "Like New": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Good": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Fair": return "bg-orange-100 text-orange-800 border-orange-200";
      case "Poor": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

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
              Marketplace
            </h1>
            <p className="text-base lg:text-lg text-muted-foreground">Buy and sell items within your university community</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity glow w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  List Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-3xl glass max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
                <DialogHeader>
                  <DialogTitle>List New Product</DialogTitle>
                  <DialogDescription>Sell your items to fellow students</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProduct} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Product Title</Label>
                      <Input id="title" name="title" placeholder="e.g., iPhone 13 Pro Max" required className="glass" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select name="category" required>
                        <SelectTrigger className="glass">
                          <SelectValue placeholder="Select a category" />
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
                    <Textarea 
                      id="description" 
                      name="description" 
                      placeholder="Describe your product in detail..."
                      rows={4}
                      required 
                      className="glass resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition</Label>
                      <Select name="condition" required>
                        <SelectTrigger className="glass">
                          <SelectValue placeholder="Select condition" />
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
                      <Input 
                        id="price" 
                        name="price" 
                        type="number" 
                        step="0.01"
                        placeholder="3750.00"
                        required 
                        className="glass"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="originalPrice">Original Price (ETB)</Label>
                      <Input 
                        id="originalPrice" 
                        name="originalPrice" 
                        type="number" 
                        step="0.01"
                        placeholder="5000.00"
                        className="glass"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input 
                        id="location" 
                        name="location" 
                        placeholder="e.g., Campus Dorm A, Room 205"
                        required 
                        className="glass"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact">Contact Information</Label>
                      <Input 
                        id="contact" 
                        name="contact" 
                        placeholder="email@university.edu"
                        required 
                        className="glass"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="images">Product Images</Label>
                    <Input id="product-images" type="file" multiple accept="image/*" className="glass" />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="negotiable" name="negotiable" className="rounded" />
                    <Label htmlFor="negotiable">Price is negotiable</Label>
                  </div>

                  {uploadingFiles.length > 0 && (
                    <div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded">
                      Uploading: {uploadingFiles.join(", ")}...
                    </div>
                  )}

                  <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90" disabled={loading || uploadingFiles.length > 0}>
                    {loading ? "Listing..." : "List Product"}
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
              placeholder="Search products..."
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
              {PRODUCT_CATEGORIES.map((cat) => (
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
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Card className="glass border hover:border-primary/40 transition-all duration-300 h-full hover:shadow-lg hover:shadow-primary/20 group">
                {/* Thumbnail Image */}
                {product.images && product.images.length > 0 && (
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <img 
                      src={product.images[0]} 
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                      {product.images.length} {product.images.length === 1 ? 'image' : 'images'}
                    </div>
                    {product.negotiable && (
                      <div className="absolute top-2 left-2 bg-green-500/90 text-white px-2 py-1 rounded-full text-xs">
                        Negotiable
                      </div>
                    )}
                  </div>
                )}
                
                <CardHeader className={product.images && product.images.length > 0 ? "pb-2" : ""}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        className="w-10 h-10 cursor-pointer border-2 border-primary/20 hover:border-primary/40 transition-colors"
                        onClick={() => showUserProfile(product.userId)}
                      >
                        <AvatarImage src={product.userPhotoURL} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs font-bold">
                          {product.userName?.[0] || product.userEmail?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        {product.price} ETB
                      </span>
                      {product.originalPrice && (
                        <p className="text-sm text-muted-foreground line-through">
                          {product.originalPrice} ETB
                        </p>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{product.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center rounded-full glass px-2.5 py-0.5 text-xs font-medium border border-primary/20">
                      {product.category}
                    </span>
                    <span className="text-xs text-muted-foreground">by {product.userName || product.userEmail?.split('@')[0]}</span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${getConditionColor(product.condition)}`}>
                      {product.condition}
                    </span>
                    {product.negotiable && (
                      <span className="text-xs text-green-600 font-medium">Negotiable</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">{product.description}</p>
                  
                  {product.images?.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ImageIcon className="h-3 w-3" />
                      {product.images.length} images
                    </div>
                  )}

                  <div className="pt-2 border-t border-border/50 space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground text-xs">{product.location}</span>
                    </div>
                    <p className="text-sm font-medium">Seller: {product.userName}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {product.createdAt?.toDate?.()?.toLocaleDateString() || "Recently"}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full glass hover:bg-primary/10"
                    onClick={() => {
                      setSelectedProduct(product);
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

        {filteredProducts.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">No products found matching your criteria</p>
          </motion.div>
        )}

        {/* Product Details Modal */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl glass max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
            {selectedProduct && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl sm:text-2xl">{selectedProduct.title}</DialogTitle>
                  <DialogDescription className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center rounded-full glass px-3 py-1 text-sm font-medium border border-primary/20">
                      {selectedProduct.category}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border ${getConditionColor(selectedProduct.condition)}`}>
                      {selectedProduct.condition}
                    </span>
                    {selectedProduct.negotiable && (
                      <span className="text-sm text-green-600 font-medium">Negotiable</span>
                    )}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Price Section */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <span className="text-2xl sm:text-3xl font-bold text-primary">{selectedProduct.price} ETB</span>
                    {selectedProduct.originalPrice && (
                      <span className="text-lg text-muted-foreground line-through">
                        {selectedProduct.originalPrice} ETB
                      </span>
                    )}
                  </div>

                  {/* Images Gallery */}
                  {selectedProduct.images && selectedProduct.images.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Product Images</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        {selectedProduct.images.map((image, index) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden border">
                            <img 
                              src={image} 
                              alt={`Product ${index + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                              onClick={() => window.open(image, '_blank')}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Description</h3>
                    <p className="text-muted-foreground">{selectedProduct.description}</p>
                  </div>

                  {/* Product Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Product Details</h3>
                      <div className="space-y-1">
                        <p><span className="font-medium">Category:</span> {selectedProduct.category}</p>
                        <p><span className="font-medium">Condition:</span> {selectedProduct.condition}</p>
                        <p><span className="font-medium">Location:</span> {selectedProduct.location}</p>
                        <p><span className="font-medium">Negotiable:</span> {selectedProduct.negotiable ? 'Yes' : 'No'}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Seller Information</h3>
                      <div className="space-y-1">
                        <p><span className="font-medium">Seller:</span> {selectedProduct.userName}</p>
                        <p><span className="font-medium">Contact:</span> {selectedProduct.contactInfo}</p>
                        <p><span className="font-medium">Listed:</span> {selectedProduct.createdAt?.toDate?.()?.toLocaleDateString() || "Recently"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Options */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Contact Seller
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Email */}
                      <a
                        href={`mailto:${selectedProduct.contactInfo}`}
                        className="flex flex-col items-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors group"
                      >
                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📧</div>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Email</span>
                      </a>

                      {/* Phone */}
                      {selectedProduct.phone && (
                        <a
                          href={`tel:${selectedProduct.phone}`}
                          className="flex flex-col items-center p-4 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors group"
                        >
                          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📞</div>
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">Call</span>
                        </a>
                      )}
                      
                      {/* WhatsApp */}
                      {selectedProduct.whatsapp && (
                        <a
                          href={`https://wa.me/${selectedProduct.whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center p-4 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors group"
                        >
                          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">💬</div>
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">WhatsApp</span>
                        </a>
                      )}
                      
                      {/* Telegram */}
                      {selectedProduct.telegram && (
                        <a
                          href={`https://t.me/${selectedProduct.telegram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors group"
                        >
                          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">✈️</div>
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Telegram</span>
                        </a>
                      )}
                      
                      {/* Instagram */}
                      {selectedProduct.instagram && (
                        <a
                          href={`https://instagram.com/${selectedProduct.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 hover:bg-pink-500/20 transition-colors group"
                        >
                          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📷</div>
                          <span className="text-sm font-medium text-pink-700 dark:text-pink-300">Instagram</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </>
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
        </div>
      </div>
    </div>
  );
};

export default Market;
