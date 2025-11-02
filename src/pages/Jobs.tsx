import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, MapPin, Clock, DollarSign, Users, Building, Search, Filter, Plus, Sparkles, User, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { collection, addDoc, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

interface Job {
  id: string;
  userId?: string;
  userEmail?: string;
  userPhotoURL?: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  benefits: string[];
  postedDate: string;
  deadline: string;
  contactEmail: string;
  companyLogo?: string;
  remote: boolean;
  experience: string;
  category: string;
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
  resume?: string;
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

const SEED_JOBS: Omit<Job, 'id'>[] = [
  {
    title: "Frontend Developer",
    company: "TechCorp Ethiopia",
    location: "Addis Ababa",
    type: "Full-time",
    salary: "25,000 - 35,000 ETB",
    description: "Join our dynamic team as a Frontend Developer and help build amazing user experiences for our growing platform.",
    requirements: ["React.js", "TypeScript", "Tailwind CSS", "3+ years experience"],
    benefits: ["Health Insurance", "Flexible Hours", "Remote Work", "Training Budget"],
    postedDate: "2025-11-01",
    deadline: "2025-11-30",
    contactEmail: "hr@techcorp.et",
    remote: true,
    experience: "Mid-level",
    category: "Technology"
  },
  {
    title: "Marketing Specialist",
    company: "Digital Solutions Ltd",
    location: "Bahir Dar",
    type: "Full-time",
    salary: "18,000 - 25,000 ETB",
    description: "We're looking for a creative Marketing Specialist to develop and execute marketing campaigns.",
    requirements: ["Digital Marketing", "Social Media", "Content Creation", "2+ years experience"],
    benefits: ["Performance Bonus", "Career Growth", "Team Events", "Modern Office"],
    postedDate: "2025-10-30",
    deadline: "2025-11-25",
    contactEmail: "careers@digitalsolutions.et",
    remote: false,
    experience: "Entry-level",
    category: "Marketing"
  },
  {
    title: "Data Analyst",
    company: "Analytics Pro",
    location: "Mekelle",
    type: "Part-time",
    salary: "15,000 - 20,000 ETB",
    description: "Analyze data trends and provide insights to drive business decisions in our growing analytics firm.",
    requirements: ["Python", "SQL", "Excel", "Statistics", "1+ years experience"],
    benefits: ["Flexible Schedule", "Learning Opportunities", "Remote Work", "Project Bonuses"],
    postedDate: "2025-10-28",
    deadline: "2025-11-20",
    contactEmail: "jobs@analyticspro.et",
    remote: true,
    experience: "Entry-level",
    category: "Data Science"
  },
  {
    title: "UI/UX Designer",
    company: "Creative Studio",
    location: "Hawassa",
    type: "Contract",
    salary: "30,000 - 40,000 ETB",
    description: "Design beautiful and intuitive user interfaces for mobile and web applications.",
    requirements: ["Figma", "Adobe Creative Suite", "User Research", "Prototyping", "2+ years experience"],
    benefits: ["Creative Freedom", "Latest Tools", "Portfolio Projects", "Networking Events"],
    postedDate: "2025-10-25",
    deadline: "2025-11-15",
    contactEmail: "design@creativestudio.et",
    remote: true,
    experience: "Mid-level",
    category: "Design"
  },
  {
    title: "Backend Developer",
    company: "ServerTech Solutions",
    location: "Dire Dawa",
    type: "Full-time",
    salary: "28,000 - 38,000 ETB",
    description: "Build scalable backend systems and APIs for our enterprise clients.",
    requirements: ["Node.js", "MongoDB", "AWS", "Docker", "3+ years experience"],
    benefits: ["Stock Options", "Health Coverage", "Tech Conferences", "Mentorship Program"],
    postedDate: "2025-10-22",
    deadline: "2025-11-12",
    contactEmail: "backend@servertech.et",
    remote: false,
    experience: "Senior-level",
    category: "Technology"
  }
];

const Jobs = () => {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const [user] = useAuthState(auth);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userProfileOpen, setUserProfileOpen] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (highlightId && jobs.length > 0) {
      const job = jobs.find(j => j.id === highlightId);
      if (job) {
        setSelectedJob(job);
        setDetailsOpen(true);
      }
    }
  }, [highlightId, jobs]);

  const loadJobs = async () => {
    try {
      const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const jobsData = await Promise.all(
        querySnapshot.docs.map(async (jobDoc) => {
          const jobData = { id: jobDoc.id, ...jobDoc.data() } as Job;
          
          // Fetch user profile data if job has userId
          if (jobData.userId) {
            try {
              const userDoc = await getDoc(doc(db, "users", jobData.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                jobData.userPhotoURL = userData.photoURL;
              }
            } catch (error) {
              console.error("Error fetching user data:", error);
            }
          }
          
          return jobData;
        })
      );
      setJobs(jobsData);
      console.log("Loaded jobs:", jobsData.length);
    } catch (error) {
      console.error("Error loading jobs:", error);
      toast.error("Error loading jobs");
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

  const seedJobs = async () => {
    if (!user) {
      toast.error("Please login to add jobs");
      return;
    }

    setLoading(true);
    try {
      for (const jobData of SEED_JOBS) {
        const jobWithUser = {
          ...jobData,
          userId: user.uid,
          userEmail: user.email,
          createdAt: new Date()
        };
        await addDoc(collection(db, "jobs"), jobWithUser);
      }
      toast.success("🎉 Seed jobs added successfully!");
      loadJobs();
    } catch (error) {
      console.error("Error seeding jobs:", error);
      toast.error(`Error adding seed jobs: ${error.message}`);
    }
    setLoading(false);
  };

  const handleJobApplication = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !selectedJob) {
      toast.error("Please login to apply");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const applicationData = {
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        applicantId: user.uid,
        applicantName: formData.get("name") as string,
        applicantEmail: formData.get("email") as string,
        phone: formData.get("phone") as string,
        coverLetter: formData.get("coverLetter") as string,
        linkedin: formData.get("linkedin") as string,
        telegram: formData.get("telegram") as string,
        whatsapp: formData.get("whatsapp") as string,
        instagram: formData.get("instagram") as string,
        github: formData.get("github") as string,
        portfolio: formData.get("portfolio") as string,
        experience: formData.get("experience") as string,
        skills: formData.get("skills") as string,
        education: formData.get("education") as string,
        appliedAt: new Date(),
        status: 'pending'
      };

      await addDoc(collection(db, "jobApplications"), applicationData);
      toast.success("Application submitted successfully!");
      setApplicationOpen(false);
      setDetailsOpen(false);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Error submitting application");
    }

    setLoading(false);
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || job.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...Array.from(new Set(jobs.map(job => job.category)))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      <TopNav />
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Ultra Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 p-12 text-center backdrop-blur-xl border border-primary/20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 animate-pulse" />
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, duration: 1, type: "spring", stiffness: 200 }}
            className="relative z-10"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-2xl">
              <Briefcase className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Find Your Dream Job
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover amazing career opportunities from top companies across Ethiopia
            </p>
          </motion.div>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search jobs, companies, locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass border-primary/20 focus:border-primary/40"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 rounded-lg glass border border-primary/20 focus:border-primary/40 bg-background"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Jobs Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -10, scale: 1.02 }}
                onClick={() => {
                  setSelectedJob(job);
                  setDetailsOpen(true);
                }}
                className="group cursor-pointer"
              >
                <Card className="glass border-primary/20 hover:border-primary/40 transition-all duration-300 overflow-hidden h-full">
                  <CardHeader className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {job.userId && (
                            <Avatar 
                              className="w-10 h-10 cursor-pointer border-2 border-primary/20 hover:border-primary/40 transition-colors"
                              onClick={() => showUserProfile(job.userId)}
                            >
                              <AvatarImage src={job.userPhotoURL} />
                              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs font-bold">
                                {job.userEmail?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <Building className="w-6 h-6 text-primary" />
                          </div>
                        </div>
                        <Badge variant={job.remote ? "default" : "secondary"} className="text-xs">
                          {job.remote ? "Remote" : "On-site"}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {job.title}
                      </CardTitle>
                      <CardDescription className="font-medium text-primary">
                        {job.company}
                        {job.userId && job.userEmail && (
                          <span className="text-xs text-muted-foreground ml-2">
                            by {job.userEmail.split('@')[0]}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {job.type}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="font-bold text-green-600">{job.salary}</span>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {job.requirements?.slice(0, 3).map((req, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {req}
                        </Badge>
                      ))}
                      {job.requirements?.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{job.requirements.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredJobs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria</p>
          </motion.div>
        )}
      </div>

      {/* Job Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl glass border-0 bg-gradient-to-br from-background/95 via-primary/5 to-secondary/5 backdrop-blur-2xl">
          {selectedJob && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Building className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {selectedJob.title}
                    </DialogTitle>
                    <DialogDescription className="text-lg font-medium text-primary">
                      {selectedJob.company}
                    </DialogDescription>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {selectedJob.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {selectedJob.type}
                      </div>
                      <Badge variant={selectedJob.remote ? "default" : "secondary"}>
                        {selectedJob.remote ? "Remote" : "On-site"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Job Description</h3>
                    <p className="text-muted-foreground">{selectedJob.description}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Requirements</h3>
                    <div className="space-y-1">
                      {selectedJob.requirements?.map((req, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-sm">{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Salary Range</h3>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      <span className="text-lg font-bold text-green-600">{selectedJob.salary}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Benefits</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.benefits?.map((benefit, i) => (
                        <Badge key={i} variant="outline">{benefit}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Application Deadline</h3>
                    <p className="text-muted-foreground">{selectedJob.deadline}</p>
                  </div>

                  <Button 
                    onClick={() => setApplicationOpen(true)}
                    className="w-full bg-gradient-to-r from-primary to-secondary"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Apply Now
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      {/* Job Application Dialog */}
      <Dialog open={applicationOpen} onOpenChange={setApplicationOpen}>
        <DialogContent className="max-w-2xl glass border-0 bg-gradient-to-br from-background/95 via-primary/5 to-secondary/5 backdrop-blur-2xl">
          {selectedJob && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Apply for {selectedJob.title}
                </DialogTitle>
                <DialogDescription className="text-lg">
                  at {selectedJob.company}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleJobApplication} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Your full name"
                      required
                      className="glass"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your.email@example.com"
                      required
                      className="glass"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+251912345678"
                      required
                      className="glass"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      name="experience"
                      placeholder="3 years"
                      className="glass"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education">Education</Label>
                  <Input
                    id="education"
                    name="education"
                    placeholder="Bachelor's in Computer Science"
                    className="glass"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Input
                    id="skills"
                    name="skills"
                    placeholder="React, Node.js, Python, MongoDB"
                    className="glass"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Social Media & Portfolio</Label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      name="linkedin"
                      placeholder="LinkedIn profile URL"
                      className="glass"
                    />
                    <Input
                      name="github"
                      placeholder="GitHub profile URL"
                      className="glass"
                    />
                    <Input
                      name="portfolio"
                      placeholder="Portfolio website URL"
                      className="glass"
                    />
                    <Input
                      name="telegram"
                      placeholder="Telegram username"
                      className="glass"
                    />
                    <Input
                      name="whatsapp"
                      placeholder="WhatsApp number"
                      className="glass"
                    />
                    <Input
                      name="instagram"
                      placeholder="Instagram handle"
                      className="glass"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coverLetter">Cover Letter / Proposal</Label>
                  <Textarea
                    id="coverLetter"
                    name="coverLetter"
                    placeholder="Tell us why you're the perfect fit for this role..."
                    required
                    className="glass min-h-[120px]"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setApplicationOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-primary to-secondary"
                  >
                    {loading ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </form>
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
    </div>
  );
};

export default Jobs;
