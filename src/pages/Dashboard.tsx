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
import { Briefcase, ShoppingBag, Plus, Eye, Users, CreditCard, LucideIcon, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { uploadToCloudinary, validateFile } from "@/lib/cloudinary";
import PremiumPaymentModal from "@/components/PremiumPaymentModal";
import { useAuth } from "@/contexts/AuthContext";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

const SERVICE_CATEGORIES = ["Tutoring", "Design", "Writing", "Programming", "Event Planning", "Photography", "Music", "Fitness", "Other"];
const PRODUCT_CATEGORIES = ["Books", "Electronics", "Clothing", "Furniture", "Sports Equipment", "Stationery", "Other"];
const PRODUCT_CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];

// Interfaces remain the same
interface Service { id: string; title: string; description: string; category: string; price: number; images: string[]; videos: string[]; skills: string[]; createdAt: any; userId: string; availability?: string; }
interface Product { id: string; title: string; description: string; category: string; condition: string; price: number; images: string[]; createdAt: any; userId: string; location?: string; }
interface Job { id: string; title: string; company: string; location: string; type: string; salary: string; description: string; requirements: string[]; benefits: string[]; deadline: string; contactEmail: string; remote: boolean; experience: string; category: string; userId: string; userEmail: string; createdAt: any; }
interface JobApplication { id: string; jobId: string; jobTitle: string; applicantId: string; applicantName: string; applicantEmail: string; phone: string; coverLetter: string; appliedAt: any; status: 'pending' | 'reviewed' | 'accepted' | 'rejected'; linkedin?: string; telegram?: string; whatsapp?: string; instagram?: string; github?: string; portfolio?: string; experience?: string; skills?: string; education?: string; }

const BentoCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={`relative w-full h-full rounded-2xl bg-card/50 border border-border/50 backdrop-blur-xl shadow-lg overflow-hidden ${className}`}
  >
    {children}
  </motion.div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const { userData } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

  useEffect(() => {
    if (user) loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    try {
      const servicesSnapshot = await getDocs(collection(db, "services"));
      const allServices = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[];
      setServices(allServices.filter(service => service.userId === user.uid));

      const productsSnapshot = await getDocs(collection(db, "products"));
      const allProducts = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      setProducts(allProducts.filter(product => product.userId === user.uid));

      const jobsSnapshot = await getDocs(collection(db, "jobs"));
      const allJobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Job[];
      const userJobs = allJobs.filter(job => job.userId === user.uid);
      setJobs(userJobs);

      const applicationsSnapshot = await getDocs(collection(db, "jobApplications"));
      const allApplications = applicationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as JobApplication[];
      const userJobIds = userJobs.map(job => job.id);
      setApplications(allApplications.filter(app => userJobIds.includes(app.jobId)));
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Failed to load your data. Please try again later.");
    }
  };

  const chartData = [
    { month: "Jan", total: Math.floor(Math.random() * 20) },
    { month: "Feb", total: Math.floor(Math.random() * 30) },
    { month: "Mar", total: Math.floor(Math.random() * 40) },
    { month: "Apr", total: Math.floor(Math.random() * 30) },
    { month: "May", total: Math.floor(Math.random() * 50) },
    { month: "Jun", total: Math.floor(Math.random() * 45) },
  ];

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
        toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setUploadingFiles(prev => prev.filter(name => name !== file.name));
      }
    }
    return uploadedUrls;
  };

  const handleCreateService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return toast.error("You must be logged in");
    setLoading(true);
    // ... implementation
    setLoading(false);
  };

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return toast.error("You must be logged in");
    setLoading(true);
    // ... implementation
    setLoading(false);
  };

  const handleCreateJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return toast.error("You must be logged in");
    setLoading(true);
    // ... implementation
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <div className="absolute top-0 left-0 -z-10 h-full w-full bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
      <TopNav />

      <main className="max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
          <BentoCard className="md:col-span-2 lg:col-span-2 lg:row-span-2 p-6 flex flex-col justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Welcome, <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{userData?.displayName || user?.email?.split('@')[0]}</span>
              </h1>
              <p className="text-lg text-muted-foreground mt-2">This is your nexus for campus opportunities.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
              <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={(e) => { if (!userData?.isPremium) { e.preventDefault(); setPremiumModalOpen(true); } }} className="bg-primary/90 text-primary-foreground hover:bg-primary w-full">
                    <Plus className="w-4 h-4 mr-2" /> Create Service
                  </Button>
                </DialogTrigger>
                {/* Service Dialog Content */}
              </Dialog>
              <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={(e) => { if (!userData?.isPremium) { e.preventDefault(); setPremiumModalOpen(true); } }} variant="secondary" className="w-full">
                    <Plus className="w-4 h-4 mr-2" /> List Product
                  </Button>
                </DialogTrigger>
                {/* Product Dialog Content */}
              </Dialog>
              <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={(e) => { if (!userData?.isPremium) { e.preventDefault(); setPremiumModalOpen(true); } }} variant="outline" className="w-full bg-card/50 hover:bg-muted">
                    <Plus className="w-4 h-4 mr-2" /> Post Job
                  </Button>
                </DialogTrigger>
                {/* Job Dialog Content */}
              </Dialog>
            </div>
          </BentoCard>

          <BentoCard className="p-4 flex flex-col">
            <CardTitle className="text-sm font-medium text-muted-foreground">Listings Overview</CardTitle>
            <CardContent className="flex-1 flex items-center justify-center p-0">
              <ChartContainer config={{}} className="w-full h-[120px]">
                <BarChart accessibilityLayer data={chartData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} stroke="hsl(var(--muted-foreground))" className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent className="bg-card/80 backdrop-blur-lg border-border" />} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </BentoCard>

          {!userData?.isPremium && (
            <BentoCard className="p-6 flex flex-col justify-center items-center text-center bg-gradient-to-br from-yellow-400/20 to-orange-500/20">
              <CreditCard className="w-10 h-10 text-yellow-400 mb-2" />
              <h3 className="font-bold text-lg text-foreground">Go Premium</h3>
              <p className="text-sm text-muted-foreground mb-4">Unlock unlimited listings!</p>
              <Button onClick={() => setPremiumModalOpen(true)} size="sm" className="bg-yellow-400 text-black hover:bg-yellow-300">Upgrade Now</Button>
            </BentoCard>
          )}

          <BentoCard className="md:col-span-2 lg:col-span-2 p-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-foreground">My Services</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/services')}>View All <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </div>
            <div className="space-y-2">
              {services.slice(0, 2).map(service => (
                <div key={service.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                  <p className="font-medium truncate">{service.title}</p>
                  <p className="font-bold text-primary">{service.price} ETB</p>
                </div>
              ))}
              {services.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No services yet.</p>}
            </div>
          </BentoCard>

          <BentoCard className="md:col-span-2 lg:col-span-2 p-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-foreground">My Products</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/market')}>View All <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </div>
            <div className="space-y-2">
              {products.slice(0, 2).map(product => (
                <div key={product.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                  <p className="font-medium truncate">{product.title}</p>
                  <p className="font-bold text-secondary">{product.price} ETB</p>
                </div>
              ))}
              {products.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No products yet.</p>}
            </div>
          </BentoCard>

          <BentoCard className="md:col-span-2 lg:col-span-4">
            <Tabs defaultValue="jobs" className="w-full h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 bg-transparent border-b border-border rounded-none">
                <TabsTrigger value="jobs" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">My Jobs ({jobs.length})</TabsTrigger>
                <TabsTrigger value="applications" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">Applications ({applications.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="jobs" className="flex-1 p-4">
                {jobs.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground"><Briefcase className="w-8 h-8 mr-2" /> No jobs posted.</div>
                ) : (
                  <div className="space-y-2">
                    {jobs.slice(0, 3).map(job => (
                      <div key={job.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                        <div>
                          <p className="font-medium">{job.title}</p>
                          <p className="text-sm text-muted-foreground">{job.company}</p>
                        </div>
                        <p className="font-semibold text-accent">{job.salary}</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="applications" className="flex-1 p-4">
                {applications.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground"><Users className="w-8 h-8 mr-2" /> No applications received.</div>
                ) : (
                  <div className="space-y-2">
                    {applications.slice(0, 3).map(app => (
                      <div key={app.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                        <div>
                          <p className="font-medium">{app.applicantName}</p>
                          <p className="text-sm text-muted-foreground">for {app.jobTitle}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          app.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                          app.status === 'accepted' ? 'bg-green-500/10 text-green-500' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>{app.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </BentoCard>
        </div>
      </main>

      {/* Dialogs remain here to be triggered from anywhere */}
      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl glass max-h-[90vh] overflow-y-auto mx-4 bg-card/80 backdrop-blur-lg border-border">
          {/* Form inside dialog */}
        </DialogContent>
      </Dialog>
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl glass max-h-[90vh] overflow-y-auto mx-4 bg-card/80 backdrop-blur-lg border-border">
          {/* Form inside dialog */}
        </DialogContent>
      </Dialog>
      <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
        <DialogContent className="glass max-w-2xl bg-card/80 backdrop-blur-lg border-border">
          {/* Form inside dialog */}
        </DialogContent>
      </Dialog>

      <PremiumPaymentModal open={premiumModalOpen} onOpenChange={setPremiumModalOpen} />
    </div>
  );
};

export default Dashboard;