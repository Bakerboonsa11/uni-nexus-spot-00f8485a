import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show the prompt if the event is fired.
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
    setShowPrompt(false);
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
          <DialogContent asChild>
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90vw] max-w-md p-6 rounded-2xl bg-background/80 backdrop-blur-xl border shadow-2xl"
            >
              <DialogHeader className="text-left">
                <DialogTitle>Install NEXUS SPOT</DialogTitle>
                <DialogDescription>
                  For a better experience, install the app on your device.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Not Now
                </Button>
                <Button onClick={handleInstall} className="flex-1 bg-primary hover:bg-primary/90">
                  <Download className="w-4 h-4 mr-2" />
                  Install
                </Button>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose} className="absolute top-2 right-2 h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};