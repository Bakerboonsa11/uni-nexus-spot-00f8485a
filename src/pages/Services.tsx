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
import { Plus, Search, Star, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const SERVICE_CATEGORIES = ["Tutoring", "Design", "Writing", "Programming", "Event Planning", "Other"];

const Services = () => {
  const [services, setServices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    let query = supabase
      .from("services")
      .select(`
        *,
        profiles (full_name, email)
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      toast.error("Error loading services");
    } else {
      setServices(data || []);
    }
  };

  const handleCreateService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("You must be logged in");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("services").insert({
      user_id: user.id,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      price: parseFloat(formData.get("price") as string),
      contact_info: formData.get("contact") as string,
    });

    if (error) {
      toast.error("Error creating service");
    } else {
      toast.success("Service created successfully!");
      setOpen(false);
      loadServices();
      (e.target as HTMLFormElement).reset();
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
      
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Services
            </h1>
            <p className="text-lg text-muted-foreground">Find or offer services within your university community</p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity glow">
                <Plus className="h-4 w-4" />
                Post Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl glass">
              <DialogHeader>
                <DialogTitle>Create New Service</DialogTitle>
                <DialogDescription>Share your skills and help fellow students</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateService} className="space-y-4">
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

                <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90" disabled={loading}>
                  {loading ? "Creating..." : "Create Service"}
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

        {/* Services Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Card className="glass border hover:border-primary/40 transition-all duration-300 h-full hover:shadow-lg hover:shadow-primary/20">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      ${service.price}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full glass px-2.5 py-0.5 text-xs font-medium border border-primary/20">
                      {service.category}
                    </span>
                    {service.rating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {service.rating}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">{service.description}</p>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-sm font-medium">Offered by: {service.profiles?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{service.views || 0} views</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full glass hover:bg-primary/10">
                    Contact Provider
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
      </div>
    </div>
  );
};

export default Services;
