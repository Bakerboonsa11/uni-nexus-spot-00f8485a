import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion } from "framer-motion";
import { GraduationCap, LogOut, User, Settings as SettingsIcon, LayoutDashboard, Briefcase, ShoppingBag, Shield, Menu, Camera, Lock } from "lucide-react";
import { ModeToggle } from "./theme-toggle";
import { useState } from "react";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { uploadToCloudinary, validateFile } from "@/lib/cloudinary";

export const TopNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userData, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;

    const formData = new FormData(e.currentTarget);
    const oldPassword = formData.get("oldPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, oldPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      toast.success("Password updated successfully!");
      setChangePasswordOpen(false);
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Error updating password. Please check your old password.");
    }
    setLoading(false);
  };

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser || !userData) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const updateData: any = {
        displayName: formData.get("displayName") as string,
        bio: formData.get("bio") as string,
        phone: formData.get("phone") as string,
        location: formData.get("location") as string,
      };

      await updateDoc(doc(db, "users", currentUser.uid), updateData);
      toast.success("Profile updated successfully!");
      setProfileOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile");
    }

    setLoading(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const validationError = validateFile(file, 'image');
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploading(true);
    try {
      const photoURL = await uploadToCloudinary(file, 'image');
      await updateDoc(doc(db, "users", currentUser.uid), { photoURL });
      toast.success("Profile photo updated!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Error uploading photo");
    }
    setUploading(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/home", label: "Home", icon: GraduationCap },
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/services", label: "Services", icon: Briefcase },
    { path: "/market", label: "Market", icon: ShoppingBag },
    { path: "/jobs", label: "Jobs", icon: Briefcase },
  ];

  if (userData?.role === 'admin') {
    navItems.push({ path: "/admin", label: "Admin", icon: Shield });
  }

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full glass border-b"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/home")}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              University Hub
            </span>
          </motion.div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={isActive(item.path) ? "default" : "ghost"}
                onClick={() => navigate(item.path)}
                className={
                  isActive(item.path)
                    ? "bg-gradient-to-r from-primary to-secondary text-white"
                    : "hover:bg-primary/10"
                }
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            ))}
          </div>

          {/* Mobile & Desktop Right Side */}
          <div className="flex items-center gap-2">
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="glass border-l">
                <div className="flex flex-col gap-4 mt-8">
                  {navItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={isActive(item.path) ? "default" : "ghost"}
                      onClick={() => handleNavigation(item.path)}
                      className={`justify-start ${
                        isActive(item.path)
                          ? "bg-gradient-to-r from-primary to-secondary text-white"
                          : "hover:bg-primary/10"
                      }`}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  ))}
                  
                  <div className="border-t pt-4 mt-4">
                    <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="justify-start w-full"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                    
                    <Button
                      variant="ghost"
                      onClick={() => handleNavigation("/settings")}
                      className="justify-start w-full"
                    >
                      <SettingsIcon className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="justify-start w-full text-destructive hover:text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <ModeToggle />

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarImage 
                      src={userData?.photoURL || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"} 
                      alt="Profile"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold">
                      {userData?.displayName?.[0] || userData?.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 glass" align="end">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={userData?.photoURL || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"} 
                      alt="Profile"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs font-bold">
                      {userData?.displayName?.[0] || userData?.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{userData?.email?.split('@')[0] || "Student"}</p>
                    <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                
                <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <User className="w-4 h-4 mr-2" />
                      Edit Profile
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent className="glass max-w-[95vw] sm:max-w-md mx-4">
                    <DialogHeader>
                      <DialogTitle className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Edit Profile
                      </DialogTitle>
                      <DialogDescription>
                        Update your profile information and photo
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      {/* Profile Photo */}
                      <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                          <Avatar className="w-24 h-24 border-4 border-primary/30">
                            <AvatarImage src={userData?.photoURL} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-2xl font-bold">
                              {userData?.displayName?.[0] || userData?.email?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors">
                            <Camera className="w-4 h-4 text-white" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoUpload}
                              className="hidden"
                              disabled={uploading}
                            />
                          </label>
                        </div>
                        {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
                      </div>

                      {/* Form Fields */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="displayName">Display Name</Label>
                          <Input
                            id="displayName"
                            name="displayName"
                            defaultValue={userData?.displayName || ""}
                            placeholder="Your display name"
                            className="glass"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Input
                            id="bio"
                            name="bio"
                            defaultValue={userData?.bio || ""}
                            placeholder="Tell us about yourself"
                            className="glass"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            defaultValue={userData?.phone || ""}
                            placeholder="+251912345678"
                            className="glass"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            name="location"
                            defaultValue={userData?.location || ""}
                            placeholder="Your location"
                            className="glass"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setProfileOpen(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-gradient-to-r from-primary to-secondary"
                        >
                          {loading ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>

                <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent className="glass max-w-[95vw] sm:max-w-md mx-4">
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="oldPassword">Old Password</Label>
                        <Input id="oldPassword" name="oldPassword" type="password" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" name="newPassword" type="password" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input id="confirmPassword" name="confirmPassword" type="password" required />
                      </div>
                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "Updating..." : "Update Password"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
