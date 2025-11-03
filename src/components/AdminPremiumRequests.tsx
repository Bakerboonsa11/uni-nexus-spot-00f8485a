import { useState, useEffect } from "react";
import { collection, query, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";

interface PremiumRequest {
  id: string;
  userId: string;
  userEmail: string;
  paymentMethod: string;
  screenshotUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

const AdminPremiumRequests = () => {
  const [requests, setRequests] = useState<PremiumRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "premiumRequests"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PremiumRequest[];
      
      setRequests(requestsData.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateRequestStatus = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, "premiumRequests", requestId), { status });
      toast.success(`Request ${status} successfully`);
    } catch (error) {
      console.error("Error updating request:", error);
      toast.error("Failed to update request");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading premium requests...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Premium Upgrade Requests</h2>
      
      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No premium requests found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="p-4">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{request.userEmail}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Payment Method: {request.paymentMethod?.toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Submitted: {request.createdAt?.toDate()?.toLocaleString()}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedImage(request.screenshotUrl)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Screenshot
                  </Button>
                  
                  {request.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateRequestStatus(request.id, 'approved')}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateRequestStatus(request.id, 'rejected')}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-full">
            <img 
              src={selectedImage} 
              alt="Payment Screenshot" 
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPremiumRequests;
