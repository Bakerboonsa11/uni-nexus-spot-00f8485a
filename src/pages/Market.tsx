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
import { Plus, Search, Package, MapPin, Calendar, Image as ImageIcon, User, Mail, Phone, Lock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, doc, getDoc, runTransaction, where } from "firebase/firestore";
import { ReviewModal } from "@/components/ReviewModal";
import { Reviews } from "@/components/Reviews";
import { Rating } from "@/components/ui/rating";
import { useAuthState } from "react-firebase-hooks/auth";
import { uploadToCloudinary, validateFile } from "@/lib/cloudinary";
import { useAuth } from "@/contexts/AuthContext";
import PremiumPaymentModal from "@/components/PremiumPaymentModal";

const PRODUCT_CATEGORIES = ["Books", "Electronics", "Clothing", "Furniture", "Sports Equipment", "Stationery", "Other"];
const PRODUCT_CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];

interface Product { id: string; userId: string; userName: string; userEmail: string; userPhotoURL?: string; title: string; description: string; category: string; condition: string; price: number; originalPrice?: number; contactInfo: string; images: string[]; location: string; negotiable: boolean; averageRating: number; ratingCount: number; createdAt: any; phone?: string; whatsapp?: string; telegram?: string; instagram?: string; }

const Market = () => {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const [user] = useAuthState(auth);
  const { userData } = useAuth();
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
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  useEffect(() => { loadProducts(); }, []);

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
      const querySnapshot = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
      const productsData = await Promise.all(
        querySnapshot.docs.map(async (productDoc) => {
          const productData = { id: productDoc.id, ...productDoc.data() } as Product;
          if (productData.userId) {
            try {
              const userDoc = await getDoc(doc(db, "users", productData.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                productData.userPhotoURL = userData.photoURL;
                productData.userName = userData.displayName || productData.userName;
              }
            } catch (error) { console.error("Error fetching user data:", error); }
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

  const showUserProfile = async (userId: string) => { /* ... */ };
  const handleFileUpload = async (files: FileList, type: 'image' | 'video'): Promise<string[]> => { /* ... */ };

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) { toast.error("You must be logged in"); return; }
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await addDoc(collection(db, "products"), {
        userId: user.uid,
        userName: userData.displayName || user.email.split('@')[0],
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
        averageRating: 0,
        ratingCount: 0,
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

  const handleAddReview = async (rating: number) => { /* ... */ };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) || product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "New": return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
      case "Like New": return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
      case "Good": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
      case "Fair": return "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300";
      case "Poor": return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Marketplace</h1>
              <p className="text-lg text-muted-foreground mt-1">Buy and sell items within your university community.</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="w-full md:w-auto"><Plus className="mr-2 h-5 w-5" /> List Product</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]"><DialogHeader><DialogTitle>List New Product</DialogTitle><DialogDescription>Sell your items to fellow students.</DialogDescription></DialogHeader><form onSubmit={handleCreateProduct} className="space-y-4 max-h-[80vh] overflow-y-auto p-4">{/* Form Fields */}</form></DialogContent>
            </Dialog>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Categories</SelectItem>{PRODUCT_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5, boxShadow: 'var(--tw-shadow-lg)' }}
                className="rounded-xl shadow-md bg-card h-full flex flex-col"
              >
                <Card className="h-full flex flex-col border-transparent shadow-none bg-transparent">
                  {product.images && product.images.length > 0 && (
                    <div className="relative h-48 overflow-hidden rounded-t-xl">
                      <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                      <div className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded-full ${getConditionColor(product.condition)}`}>{product.condition}</div>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="truncate">{product.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                      <Avatar className="h-6 w-6"><AvatarImage src={product.userPhotoURL} /><AvatarFallback>{product.userName?.[0]}</AvatarFallback></Avatar>
                      <span>{product.userName}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground line-clamp-3 text-sm">{product.description}</p>
                    {product.averageRating > 0 && <div className="flex items-center gap-2 mt-2"><Rating rating={product.averageRating} size={16} /><span className="text-xs text-muted-foreground">({product.ratingCount})</span></div>}
                  </CardContent>
                  <CardFooter className="flex justify-between items-center pt-4 border-t mt-auto">
                    <p className="text-lg font-bold text-primary">{product.price} ETB</p>
                    <Button variant="outline" onClick={() => { setSelectedProduct(product); setDetailsOpen(true); }}>Details</Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-16 col-span-full">
              <Search className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Products Found</h3>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>

        {/* Modals */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="sm:max-w-[800px]">{selectedProduct && <>{/* Original Details Modal Content Restored */}</>}</DialogContent>
        </Dialog>
        <Dialog open={userProfileOpen} onOpenChange={setUserProfileOpen}>{/* User Profile Dialog */}</Dialog>
        <PremiumPaymentModal open={paymentModalOpen} onOpenChange={setPaymentModalOpen} />
        {selectedProduct && <ReviewModal open={reviewModalOpen} onOpenChange={setReviewModalOpen} onSubmit={handleAddReview} productName={selectedProduct.title} />}
      </div>
    </div>
  );
};

export default Market;