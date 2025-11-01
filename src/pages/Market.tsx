import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Package } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const PRODUCT_CATEGORIES = ["Books", "Electronics", "Clothing", "Furniture", "Sports Equipment", "Other"];
const PRODUCT_CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];

const Market = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        profiles (full_name, email)
      `)
      .eq("status", "available")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error loading products");
    } else {
      setProducts(data || []);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("You must be logged in");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("products").insert({
      user_id: user.id,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      price: parseFloat(formData.get("price") as string),
      condition: formData.get("condition") as string,
      image_url: formData.get("imageUrl") as string || null,
    });

    if (error) {
      toast.error("Error creating product listing");
    } else {
      toast.success("Product listed successfully!");
      setOpen(false);
      loadProducts();
      (e.target as HTMLFormElement).reset();
    }

    setLoading(false);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 dark:from-background dark:via-background dark:to-secondary/10">
      <TopNav />
      
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
              Marketplace
            </h1>
            <p className="text-lg text-muted-foreground">Buy and sell goods within your university community</p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 bg-gradient-to-r from-secondary to-accent hover:opacity-90 transition-opacity glow">
                <Plus className="h-4 w-4" />
                List Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl glass">
              <DialogHeader>
                <DialogTitle>Create Product Listing</DialogTitle>
                <DialogDescription>Sell your items to fellow students</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" name="name" placeholder="e.g., Calculus Textbook 10th Edition" required className="glass" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" required>
                      <SelectTrigger className="glass">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition</Label>
                    <Select name="condition" required>
                      <SelectTrigger className="glass">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_CONDITIONS.map((cond) => (
                          <SelectItem key={cond} value={cond}>{cond}</SelectItem>
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
                    placeholder="Describe your product..."
                    rows={4}
                    required 
                    className="glass"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input 
                    id="price" 
                    name="price" 
                    type="number" 
                    step="0.01"
                    placeholder="50.00"
                    required 
                    className="glass"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                  <Input 
                    id="imageUrl" 
                    name="imageUrl" 
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    className="glass"
                  />
                </div>

                <Button type="submit" className="w-full bg-gradient-to-r from-secondary to-accent hover:opacity-90" disabled={loading}>
                  {loading ? "Listing..." : "List Product"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Search and Filter */}
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

        {/* Products Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Card className="glass border hover:border-secondary/40 transition-all duration-300 overflow-hidden h-full hover:shadow-lg hover:shadow-secondary/20">
                {product.image_url ? (
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                    <span className="text-2xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                      ${product.price}
                    </span>
                  </div>
                  <CardDescription className="flex gap-2">
                    <span className="inline-flex items-center rounded-full glass px-2.5 py-0.5 text-xs font-medium border border-secondary/20">
                      {product.category}
                    </span>
                    <span className="inline-flex items-center rounded-full glass px-2.5 py-0.5 text-xs font-medium border border-accent/20">
                      {product.condition}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-sm font-medium">Sold by: {product.profiles?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{product.views || 0} views</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full glass hover:bg-secondary/10">
                    Contact Seller
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
      </div>
    </div>
  );
};

export default Market;
