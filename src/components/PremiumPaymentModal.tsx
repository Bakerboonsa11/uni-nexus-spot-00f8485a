import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CreditCard, Smartphone, Building } from "lucide-react";
import { toast } from "sonner";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { uploadToCloudinary, validateFile } from "@/lib/cloudinary";

interface PremiumPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PremiumPaymentModal = ({ open, onOpenChange }: PremiumPaymentModalProps) => {
  const { currentUser } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<'cbe' | 'telebirr' | null>(null);
  const [uploading, setUploading] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const paymentMethods = {
    cbe: {
      name: "CBE Bank (bonsa baker abdulkadir)",
      account: "1000628264067",
      icon: <Building className="w-6 h-6" />,
      color: "from-blue-500 to-blue-600"
    },
    telebirr: {
      name: "TeleBirr (elemo baker abdulkadir)",
      account: "0900690880",
      icon: <Smartphone className="w-6 h-6" />,
      color: "from-orange-500 to-orange-600"
    }
  };

  const handleFileUpload = async (file: File) => {
    const validationError = validateFile(file, 'image');
    if (validationError) {
      toast.error(validationError);
      return null;
    }

    try {
      setUploading(true);
      const url = await uploadToCloudinary(file, 'image');
      toast.success("Screenshot uploaded successfully");
      return url;
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload screenshot");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!currentUser || !selectedMethod || !screenshot) {
      toast.error("Please select payment method and upload screenshot");
      return;
    }

    try {
      setUploading(true);
      
      // Upload screenshot first
      const screenshotUrl = await handleFileUpload(screenshot);
      if (!screenshotUrl) {
        setUploading(false);
        return;
      }

      // Submit to Firestore
      await addDoc(collection(db, "premiumRequests"), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        paymentMethod: selectedMethod,
        screenshotUrl,
        status: 'pending',
        createdAt: new Date()
      });

      toast.success("Payment verification request submitted! We'll review it within 24 hours.");
      onOpenChange(false);
      setSelectedMethod(null);
      setScreenshot(null);
    } catch (error) {
      console.error("Error submitting payment:", error);
      
      // More specific error messages
      if (error.message?.includes('Cloudinary')) {
        toast.error("Failed to upload screenshot. Please try again.");
      } else if (error.message?.includes('Firebase') || error.message?.includes('Firestore')) {
        toast.error("Failed to submit request. Please check your connection.");
      } else {
        toast.error("Failed to submit payment verification. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl glass overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Upgrade to Premium
          </DialogTitle>
          <DialogDescription>
            Choose your payment method and upload payment screenshot for verification
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Methods */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Payment Method</h3>
            <div className="grid gap-4">
              {Object.entries(paymentMethods).map(([key, method]) => (
                <Card 
                  key={key}
                  className={`cursor-pointer transition-all duration-300 ${
                    selectedMethod === key 
                      ? 'border-primary shadow-lg shadow-primary/20' 
                      : 'hover:border-primary/40'
                  }`}
                  onClick={() => setSelectedMethod(key as any)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${method.color} flex items-center justify-center text-white`}>
                        {method.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{method.name}</CardTitle>
                        <CardDescription className="font-mono text-sm">
                          {method.account}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Payment Instructions */}
          {selectedMethod && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Payment Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  1. Transfer <strong>30 ETB</strong> to the {paymentMethods[selectedMethod].name} account: 
                  <span className="font-mono ml-1">{paymentMethods[selectedMethod].account}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  2. Take a screenshot of the successful transaction
                </p>
                <p className="text-sm text-muted-foreground">
                  3. Upload the screenshot below and submit for verification
                </p>
              </CardContent>
            </Card>
          )}

          {/* Screenshot Upload */}
          {selectedMethod && (
            <div className="space-y-3">
              <Label htmlFor="screenshot">Upload Payment Screenshot</Label>
              <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center">
                <input
                  id="screenshot"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="screenshot" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {screenshot ? screenshot.name : "Click to upload screenshot"}
                  </p>
                </label>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitPayment}
              disabled={!selectedMethod || !screenshot || uploading}
              className="flex-1 bg-gradient-to-r from-primary to-secondary"
            >
              {uploading ? "Uploading..." : "Submit for Verification"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumPaymentModal;
