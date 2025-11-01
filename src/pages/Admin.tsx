import { useEffect, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import { 
  Users, ShoppingBag, Briefcase, TrendingUp, Activity, 
  Eye, Edit, Trash2, Plus, Search, Filter, AlertTriangle 
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: any;
}

interface Service {
  id: string;
  title: string;
  category: string;
  price: number;
  userName: string;
  createdAt: any;
}

interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  condition: string;
  userName: string;
  createdAt: any;
}

const Admin = () => {
  const { userData, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");

  // Check if user is admin
  if (!authLoading && userData?.role !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  useEffect(() => {
    if (userData?.role === 'admin') {
      loadAllData();
    }
  }, [userData]);

  const loadAllData = async () => {
    try {
      console.log("Loading admin data...");
      
      // Load users from the users collection
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      console.log("Loaded users:", usersData.length);
      setUsers(usersData);

      // Load services
      const servicesSnapshot = await getDocs(collection(db, "services"));
      const servicesData = servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
      console.log("Loaded services:", servicesData.length);
      setServices(servicesData);

      // Load products
      const productsSnapshot = await getDocs(collection(db, "products"));
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      console.log("Loaded products:", productsData.length);
      setProducts(productsData);

      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error loading admin data");
      setLoading(false);
    }
  };

  const deleteService = async (id: string) => {
    try {
      await deleteDoc(doc(db, "services", id));
      setServices(services.filter(s => s.id !== id));
      toast.success("Service deleted successfully");
    } catch (error) {
      toast.error("Error deleting service");
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, "products", id));
      setProducts(products.filter(p => p.id !== id));
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error("Error deleting product");
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success("User role updated successfully");
    } catch (error) {
      toast.error("Error updating user role");
    }
  };

  // Analytics data from real Firebase data
  const categoryData = services.reduce((acc, service) => {
    acc[service.category] = (acc[service.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

  // Real monthly data based on creation dates
  const getMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const monthlyStats = months.map(month => {
      const monthIndex = months.indexOf(month);
      
      const monthServices = services.filter(service => {
        const date = service.createdAt?.toDate?.();
        return date && date.getFullYear() === currentYear && date.getMonth() === monthIndex;
      }).length;
      
      const monthProducts = products.filter(product => {
        const date = product.createdAt?.toDate?.();
        return date && date.getFullYear() === currentYear && date.getMonth() === monthIndex;
      }).length;
      
      const monthUsers = users.filter(user => {
        const date = user.createdAt?.toDate?.();
        return date && date.getFullYear() === currentYear && date.getMonth() === monthIndex;
      }).length;
      
      return {
        month,
        services: monthServices,
        products: monthProducts,
        users: monthUsers
      };
    });
    
    return monthlyStats;
  };

  const monthlyData = getMonthlyData();

  // Product condition distribution
  const conditionData = products.reduce((acc, product) => {
    acc[product.condition] = (acc[product.condition] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const conditionChartData = Object.entries(conditionData).map(([name, value]) => ({ name, value }));

  // Calculate real revenue
  const totalRevenue = services.reduce((sum, service) => sum + (service.price || 0), 0) + 
                      products.reduce((sum, product) => sum + (product.price || 0), 0);

  // Calculate growth percentages
  const currentMonth = new Date().getMonth();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  
  const currentMonthServices = services.filter(s => {
    const date = s.createdAt?.toDate?.();
    return date && date.getMonth() === currentMonth;
  }).length;
  
  const lastMonthServices = services.filter(s => {
    const date = s.createdAt?.toDate?.();
    return date && date.getMonth() === lastMonth;
  }).length;
  
  const servicesGrowth = lastMonthServices > 0 ? 
    Math.round(((currentMonthServices - lastMonthServices) / lastMonthServices) * 100) : 0;

  const currentMonthProducts = products.filter(p => {
    const date = p.createdAt?.toDate?.();
    return date && date.getMonth() === currentMonth;
  }).length;
  
  const lastMonthProducts = products.filter(p => {
    const date = p.createdAt?.toDate?.();
    return date && date.getMonth() === lastMonth;
  }).length;
  
  const productsGrowth = lastMonthProducts > 0 ? 
    Math.round(((currentMonthProducts - lastMonthProducts) / lastMonthProducts) * 100) : 0;

  const currentMonthUsers = users.filter(u => {
    const date = u.createdAt?.toDate?.();
    return date && date.getMonth() === currentMonth;
  }).length;
  
  const lastMonthUsers = users.filter(u => {
    const date = u.createdAt?.toDate?.();
    return date && date.getMonth() === lastMonth;
  }).length;
  
  const usersGrowth = lastMonthUsers > 0 ? 
    Math.round(((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100) : 0;

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff0000', '#0088fe'];

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <TopNav />
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
          <div className="text-sm text-muted-foreground">
            User: {userData?.email} | Role: {userData?.role}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <TopNav />
      
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center"
          >
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-base lg:text-lg text-muted-foreground">System overview and management</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="animate-pulse">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Admin Access
              </Badge>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="glass border-red-200/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-red-500" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{users.length}</div>
                <p className="text-xs text-muted-foreground">
                  {usersGrowth >= 0 ? '+' : ''}{usersGrowth}% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-blue-200/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-500" />
                  Total Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{services.length}</div>
                <p className="text-xs text-muted-foreground">
                  {servicesGrowth >= 0 ? '+' : ''}{servicesGrowth}% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-green-200/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-green-500" />
                  Total Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{products.length}</div>
                <p className="text-xs text-muted-foreground">
                  {productsGrowth >= 0 ? '+' : ''}{productsGrowth}% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-purple-200/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  ${totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Combined services + products</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Monthly Activity (Real Data)
                </CardTitle>
                <CardDescription>
                  Users, services, and products created each month this year
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="users" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="services" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                    <Area type="monotone" dataKey="products" stackId="1" stroke="#ffc658" fill="#ffc658" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Service Categories Distribution</CardTitle>
                <CardDescription>
                  Breakdown of {services.length} services by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Additional Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Product Conditions</CardTitle>
                <CardDescription>
                  Condition distribution of {products.length} products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={conditionChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Platform Statistics</CardTitle>
                <CardDescription>Key metrics and insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Service Price</span>
                  <span className="text-lg font-bold">
                    ${services.length > 0 ? (services.reduce((sum, s) => sum + s.price, 0) / services.length).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Product Price</span>
                  <span className="text-lg font-bold">
                    ${products.length > 0 ? (products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Admin Users</span>
                  <span className="text-lg font-bold">
                    {users.filter(u => u.role === 'admin').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Regular Users</span>
                  <span className="text-lg font-bold">
                    {users.filter(u => u.role === 'user').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Most Popular Category</span>
                  <span className="text-lg font-bold">
                    {chartData.length > 0 ? chartData.reduce((a, b) => a.value > b.value ? a : b).name : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Management Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="glass">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>User Management</span>
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64"
                      />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users
                      .filter(user => user.email.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Joined: {user.createdAt?.toDate?.()?.toLocaleDateString() || "Recently"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                            {user.role}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                          >
                            Toggle Role
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="space-y-4">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Service Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{service.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {service.category} • ${service.price} • by {service.userName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => deleteService(service.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Product Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {products.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{product.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.category} • {product.condition} • ${product.price} • by {product.userName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => deleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Admin;
