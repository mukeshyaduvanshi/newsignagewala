"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { WifiOff, Wifi } from "lucide-react";

let toastId: string | number | null = null;

export function useNetworkIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>("unknown");

//   console.log({ isOnline, connectionType });

  useEffect(() => {
    // Check connection type
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    console.log({ connection });
    
    
    function updateConnectionType() {
      if (connection) {
        setConnectionType(connection.effectiveType || "unknown");
      }
    }

    function handleOnline() {
      setIsOnline(true);
      if (toastId) {
        toast.dismiss(toastId);
        toastId = null;
      }
      // Show success toast briefly
      toast.success("Internet connection restored!", {
        duration: 3000,
        position: "top-right",
        icon: <Wifi className="h-4 w-4" />,
        className: "bg-green-600! text-white! border-green-700!",
      });
    }

    function handleOffline() {
      setIsOnline(false);
      if (!toastId) {
        toastId = toast.error("No internet connection. Please check your network.", {
          duration: Infinity,
          position: "top-right",
          id: "network-offline",
          className: "bg-red-600! text-white! border-red-700!",
          icon: <WifiOff className="h-4 w-4" />,
        });
      }
    }

    function handleConnectionChange() {
      updateConnectionType();
      
      // Check for slow connection
      if (connection && connection.effectiveType) {
        const slowTypes = ["slow-2g", "2g"];
        if (slowTypes.includes(connection.effectiveType) && !toastId) {
          toastId = toast.warning("Slow internet connection detected. Some features may be limited.", {
            duration: Infinity,
            id: "network-slow",
            icon: <WifiOff className="h-4 w-4" />,
          });
        } else if (!slowTypes.includes(connection.effectiveType) && toastId) {
          toast.dismiss(toastId);
          toastId = null;
        }
      }
    }

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    if (connection) {
      connection.addEventListener("change", handleConnectionChange);
      updateConnectionType();
    }

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      
      if (connection) {
        connection.removeEventListener("change", handleConnectionChange);
      }
      
      if (toastId) {
        toast.dismiss(toastId);
        toastId = null;
      }
    };
  }, []);

  return { isOnline, connectionType };
}
