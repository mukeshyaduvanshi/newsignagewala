"use client";

import * as React from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Camera, X, FlipHorizontal, Zap, ZapOff } from "lucide-react";

interface CameraViewProps {
  onCapture: (
    imageSrc: string,
    rectInfo?: {
      x: number;
      y: number;
      width: number;
      height: number;
      videoWidth: number;
      videoHeight: number;
      originalWidth: number;
      originalHeight: number;
    },
  ) => void;
  onCancel: () => void;
  width?: number;
  height?: number;
}

export function CameraView({
  onCapture,
  onCancel,
  width,
  height,
}: CameraViewProps) {
  const webcamRef = React.useRef<Webcam>(null);
  const [facingMode, setFacingMode] = React.useState<"user" | "environment">(
    "environment",
  );
  const [flashEnabled, setFlashEnabled] = React.useState(false);
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = React.useState(false);
  const [deviceType, setDeviceType] = React.useState<
    "ios" | "android" | "desktop"
  >("desktop");
  const [isLandscape, setIsLandscape] = React.useState(false);
  const [rectPosition, setRectPosition] = React.useState({ x: 0, y: 0 });
  const [rectSize, setRectSize] = React.useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Detect device type
  React.useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType("ios");
    } else if (/android/.test(userAgent)) {
      setDeviceType("android");
    } else {
      setDeviceType("desktop");
    }
  }, []);

  // Detect orientation changes
  React.useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    // Check initial orientation
    checkOrientation();

    // Listen for orientation changes
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  // Request camera permission on mount
  React.useEffect(() => {
    requestCameraPermission();
  }, []);

  // Initialize rectangle position and size
  React.useEffect(() => {
    if (width && height && width > 0 && height > 0 && containerRef.current) {
      const container = containerRef.current;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      const aspectRatio = width / height;
      const rectWidth = containerWidth * 0.8;
      const rectHeight = Math.min(
        rectWidth / aspectRatio,
        containerHeight * 0.7,
      );
      const finalRectWidth = rectHeight * aspectRatio;

      setRectSize({ width: finalRectWidth, height: rectHeight });
      setRectPosition({
        x: (containerWidth - finalRectWidth) / 2,
        y: (containerHeight - rectHeight) / 2,
      });
    }
  }, [width, height, isLoading, error]);

  const requestCameraPermission = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setPermissionDenied(false);

      // Check if running on HTTP (not HTTPS or localhost)
      const isSecureContext = window.isSecureContext;
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      if (!isSecureContext && !isLocalhost) {
        setError(
          "Camera access requires HTTPS. You're currently using HTTP. " +
            "Please access this site via HTTPS or use localhost for testing.",
        );
        setIsLoading(false);
        setPermissionDenied(true);
        return;
      }

      // Check if the browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Your browser doesn't support camera access");
        setIsLoading(false);
        return;
      }

      // Request camera permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });

      // Stop the stream immediately - we just needed to trigger permission
      stream.getTracks().forEach((track) => track.stop());

      setIsLoading(false);
    } catch (err: any) {
      console.error("Camera permission error:", err);
      setIsLoading(false);

      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setPermissionDenied(true);
        setError(
          "Camera access was denied. Please allow camera access to continue.",
        );
      } else if (err.name === "NotFoundError") {
        setError("No camera found on your device.");
      } else if (err.name === "NotReadableError") {
        setError("Camera is already in use by another application.");
      } else {
        setError("Unable to access camera. Please try again.");
      }
    }
  };

  const getSettingsInstructions = () => {
    const browserName = (() => {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("chrome") && !ua.includes("edg")) return "Chrome";
      if (ua.includes("safari") && !ua.includes("chrome")) return "Safari";
      if (ua.includes("firefox")) return "Firefox";
      if (ua.includes("edg")) return "Edge";
      return "your browser";
    })();

    // Check if the error is due to HTTP (not HTTPS)
    const isSecureContext = window.isSecureContext;
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!isSecureContext && !isLocalhost) {
      return {
        title: "HTTPS Required",
        steps: [
          "Camera access requires a secure connection (HTTPS)",
          "Ask your administrator to enable HTTPS on the server",
          "OR access via https:// instead of http://",
          "OR use localhost for testing (http://localhost:3000)",
        ],
      };
    }

    if (deviceType === "ios") {
      return {
        title: "iPhone/iPad Settings",
        steps: [
          "Go to iPhone Settings app",
          `Scroll down and tap "${browserName}"`,
          "Tap on 'Camera'",
          "Select 'Allow' or 'Ask'",
          "Return to this page and tap 'Try Again'",
        ],
      };
    } else if (deviceType === "android") {
      return {
        title: "Android Settings",
        steps: [
          "Open Android Settings",
          "Go to 'Apps' or 'Application Manager'",
          `Find and tap "${browserName}"`,
          "Tap 'Permissions'",
          "Enable 'Camera' permission",
          "Return to this page and tap 'Try Again'",
        ],
      };
    } else {
      return {
        title: "Browser Settings",
        steps: [
          "Click the camera icon or lock icon in the address bar",
          "Change camera permission to 'Allow'",
          "Click 'Try Again' below",
        ],
      };
    }
  };

  const openSystemSettings = () => {
    // Unfortunately, web apps cannot directly open phone settings
    // But we can provide helpful instructions and a button to retry
    if (deviceType === "ios") {
      alert(
        "To enable camera access:\n\n" +
          "1. Press the Home button to exit this app\n" +
          "2. Open Settings app\n" +
          `3. Scroll to ${navigator.userAgent.includes("safari") ? "Safari" : "your browser"}\n` +
          "4. Tap Camera and select 'Allow'\n" +
          "5. Return to this app and try again",
      );
    } else if (deviceType === "android") {
      alert(
        "To enable camera access:\n\n" +
          "1. Exit this app\n" +
          "2. Open Settings\n" +
          "3. Go to Apps → Your browser → Permissions\n" +
          "4. Enable Camera permission\n" +
          "5. Return to this app and try again",
      );
    }
  };

  const handleRectDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - rectPosition.x, y: clientY - rectPosition.y });
  };

  const handleRectDrag = React.useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      let newX = clientX - rect.left - dragStart.x;
      let newY = clientY - rect.top - dragStart.y;

      // Constrain within bounds
      newX = Math.max(0, Math.min(newX, rect.width - rectSize.width));
      newY = Math.max(0, Math.min(newY, rect.height - rectSize.height));

      setRectPosition({ x: newX, y: newY });
    },
    [isDragging, dragStart, rectSize],
  );

  const handleRectDragEnd = () => {
    setIsDragging(false);
  };

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX, y: clientY });
  };

  const handleResize = React.useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isResizing || !containerRef.current || !width || !height) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - dragStart.x;
      const deltaY = clientY - dragStart.y;
      const delta = Math.max(deltaX, deltaY);

      const aspectRatio = width / height;
      let newWidth = rectSize.width + delta;
      let newHeight = newWidth / aspectRatio;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      // Constrain within bounds
      if (rectPosition.x + newWidth > rect.width) {
        newWidth = rect.width - rectPosition.x;
        newHeight = newWidth / aspectRatio;
      }
      if (rectPosition.y + newHeight > rect.height) {
        newHeight = rect.height - rectPosition.y;
        newWidth = newHeight * aspectRatio;
      }

      // Minimum size
      if (newWidth < 100) {
        newWidth = 100;
        newHeight = newWidth / aspectRatio;
      }

      setRectSize({ width: newWidth, height: newHeight });
      setDragStart({ x: clientX, y: clientY });
    },
    [isResizing, dragStart, rectSize, rectPosition, width, height],
  );

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleRectDrag);
      window.addEventListener("touchmove", handleRectDrag);
      window.addEventListener("mouseup", handleRectDragEnd);
      window.addEventListener("touchend", handleRectDragEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleRectDrag);
      window.removeEventListener("touchmove", handleRectDrag);
      window.removeEventListener("mouseup", handleRectDragEnd);
      window.removeEventListener("touchend", handleRectDragEnd);
    };
  }, [isDragging, handleRectDrag]);

  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResize);
      window.addEventListener("touchmove", handleResize);
      window.addEventListener("mouseup", handleResizeEnd);
      window.addEventListener("touchend", handleResizeEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleResize);
      window.removeEventListener("touchmove", handleResize);
      window.removeEventListener("mouseup", handleResizeEnd);
      window.removeEventListener("touchend", handleResizeEnd);
    };
  }, [isResizing, handleResize]);

  const capture = React.useCallback(() => {
    if (webcamRef.current) {
      setIsCapturing(true);
      // Use the actual video dimensions to preserve aspect ratio
      const video = webcamRef.current.video;
      if (video && containerRef.current) {
        const imageSrc = webcamRef.current.getScreenshot({
          width: video.videoWidth,
          height: video.videoHeight,
        });

        if (imageSrc) {
          // Calculate rectangle info if dimensions were provided
          let rectInfo = undefined;
          if (
            width &&
            height &&
            width > 0 &&
            height > 0 &&
            rectSize.width > 0
          ) {
            const container = containerRef.current;
            const containerRect = container.getBoundingClientRect();
            const videoElement = video;

            // Get the actual displayed video dimensions (accounting for object-cover)
            const videoAspectRatio =
              videoElement.videoWidth / videoElement.videoHeight;
            const containerAspectRatio =
              containerRect.width / containerRect.height;

            let displayedVideoWidth, displayedVideoHeight, offsetX, offsetY;

            if (videoAspectRatio > containerAspectRatio) {
              // Video is wider - fits to height, crops width
              displayedVideoHeight = containerRect.height;
              displayedVideoWidth = displayedVideoHeight * videoAspectRatio;
              offsetX = (containerRect.width - displayedVideoWidth) / 2;
              offsetY = 0;
            } else {
              // Video is taller - fits to width, crops height
              displayedVideoWidth = containerRect.width;
              displayedVideoHeight = displayedVideoWidth / videoAspectRatio;
              offsetX = 0;
              offsetY = (containerRect.height - displayedVideoHeight) / 2;
            }

            // Calculate rectangle position relative to the displayed video
            const relativeX = rectPosition.x - offsetX;
            const relativeY = rectPosition.y - offsetY;

            // Scale to actual video dimensions
            const scaleX = videoElement.videoWidth / displayedVideoWidth;
            const scaleY = videoElement.videoHeight / displayedVideoHeight;

            rectInfo = {
              x: relativeX * scaleX,
              y: relativeY * scaleY,
              width: rectSize.width * scaleX,
              height: rectSize.height * scaleY,
              videoWidth: videoElement.videoWidth,
              videoHeight: videoElement.videoHeight,
              originalWidth: width,
              originalHeight: height,
            };
          }

          onCapture(imageSrc, rectInfo);
        }
      }
      setIsCapturing(false);
    }
  }, [webcamRef, onCapture, width, height, rectSize, rectPosition]);

  const switchCamera = () => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
    setIsLoading(true);
    setError(null);
  };

  const toggleFlash = () => {
    setFlashEnabled((prev) => !prev);
  };

  const handleUserMedia = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleUserMediaError = (error: string | DOMException) => {
    console.error("Camera error:", error);
    setIsLoading(false);

    if (typeof error === "object" && error.name === "NotAllowedError") {
      setPermissionDenied(true);
      setError(
        "Camera access was denied. Please allow camera access to continue.",
      );
    } else {
      setError("Unable to access camera. Please check permissions.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* header */}
      <div className="absolute top-0  right-0 z-50 flex items-center justify-center p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="text-white hover:bg-white/20 rounded-full"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
      {/* footer */}
      <div className="absolute bottom-0 left-0 right-0 z-50 flex items-center justify-between p-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 rounded-full"
        ></Button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={switchCamera}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <FlipHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Camera View */}
      <div
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center overflow-hidden"
      >
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          screenshotQuality={1}
          videoConstraints={{
            facingMode,
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
          }}
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
          className="w-full h-full object-cover"
          style={{ display: isLoading || error ? "none" : "block" }}
          mirrored={facingMode === "user"}
        />

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
            <p className="text-white mt-4">Loading camera...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black p-8 overflow-y-auto">
            <div className="text-white text-center space-y-4 max-w-md">
              <div className="text-6xl mb-4">
                {!window.isSecureContext &&
                window.location.hostname !== "localhost" &&
                window.location.hostname !== "127.0.0.1"
                  ? "🔒"
                  : permissionDenied
                    ? "🚫"
                    : "📷"}
              </div>
              <p className="text-xl font-semibold">
                {!window.isSecureContext &&
                window.location.hostname !== "localhost" &&
                window.location.hostname !== "127.0.0.1"
                  ? "HTTPS Required"
                  : permissionDenied
                    ? "Camera Access Denied"
                    : "Camera Access Required"}
              </p>
              <p className="text-sm text-gray-300">{error}</p>

              <div className="bg-white/10 rounded-lg p-4 text-left space-y-3 text-xs">
                <p className="font-semibold text-yellow-400 text-center">
                  {getSettingsInstructions().title}
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-300">
                  {getSettingsInstructions().steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="flex flex-col gap-2 justify-center pt-2 w-full">
                {(deviceType === "ios" || deviceType === "android") &&
                  permissionDenied && (
                    <Button
                      onClick={openSystemSettings}
                      variant="default"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      📱 View Settings Instructions
                    </Button>
                  )}
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setError(null);
                      setPermissionDenied(false);
                      requestCameraPermission();
                    }}
                    variant="default"
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={onCancel}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Guidelines Overlay - only show when camera is ready */}
        {!isLoading && !error && (
          <div className="absolute inset-0">
            {/* Proportional Rectangle Guideline - based on entered dimensions */}
            {width &&
              height &&
              width > 0 &&
              height > 0 &&
              rectSize.width > 0 && (
                <div
                  style={{
                    position: "absolute",
                    left: `${rectPosition.x}px`,
                    top: `${rectPosition.y}px`,
                    width: `${rectSize.width}px`,
                    height: `${rectSize.height}px`,
                    pointerEvents: "auto",
                  }}
                  className="border-4 border-yellow-400 rounded-lg shadow-2xl cursor-move touch-none"
                  onMouseDown={handleRectDragStart}
                  onTouchStart={handleRectDragStart}
                >
                  {/* Corner markers */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-yellow-400 rounded-tl-lg pointer-events-none" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-yellow-400 rounded-tr-lg pointer-events-none" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-yellow-400 rounded-bl-lg pointer-events-none" />

                  {/* Bottom-right resize handle */}
                  <div
                    className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-yellow-400 rounded-br-lg cursor-nwse-resize bg-yellow-400/30 hover:bg-yellow-400/50 active:bg-yellow-400/70"
                    onMouseDown={handleResizeStart}
                    onTouchStart={handleResizeStart}
                  />

                  {/* Dimension label - combined
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold shadow-lg pointer-events-none">
                    {width} × {height}
                  </div> */}

                  {/* Width label - top side */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-400/90 text-black px-2 py-0.5 rounded text-xs font-semibold shadow pointer-events-none">
                    {width}
                  </div>

                  {/* Height label - right side */}
                  <div className="absolute top-1/2 -right-8 transform -translate-y-1/2 bg-yellow-400/90 text-black px-2 py-0.5 rounded text-xs font-semibold shadow pointer-events-none">
                    {height}
                  </div>
                </div>
              )}

            {/* Center crosshair - only show if no dimensions provided */}
            {!(width && height && width > 0 && height > 0) && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <div className="w-8 h-0.5 bg-white/60 absolute left-1/2 -translate-x-1/2" />
                <div className="h-8 w-0.5 bg-white/60 absolute top-1/2 -translate-y-1/2" />
              </div>
            )}

            {/* Grid lines (rule of thirds) - only show if no dimensions provided */}
            {!(width && height && width > 0 && height > 0) && (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0 pointer-events-none">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-white/20" />
                ))}
              </div>
            )}

            {/* Corner guides - creating a frame - only show if no dimensions provided */}
            {!(width && height && width > 0 && height > 0) && (
              <>
                <div className="absolute top-20 left-8">
                  <div className="w-12 h-12 border-t-2 border-l-2 border-white/80 rounded-tl-lg" />
                </div>
                <div className="absolute top-20 right-8">
                  <div className="w-12 h-12 border-t-2 border-r-2 border-white/80 rounded-tr-lg" />
                </div>
                <div className="absolute bottom-40 left-8">
                  <div className="w-12 h-12 border-b-2 border-l-2 border-white/80 rounded-bl-lg" />
                </div>
                <div className="absolute bottom-40 right-8">
                  <div className="w-12 h-12 border-b-2 border-r-2 border-white/80 rounded-br-lg" />
                </div>
              </>
            )}

            {/* Instructions at top */}
            <div className="absolute bottom-30 left-0 right-0 flex flex-col items-center gap-2 px-4 pointer-events-none">
              <div className="bg-black/10 rounded-full px-6 py-2 shadow-lg">
                <p className="text-white text-xs  text-center">
                  {width && height && width > 0 && height > 0
                    ? "Align signage within the yellow frame"
                    : "Position the signage within the frame"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Capture Button */}
      <div
        className={
          isLandscape
            ? "absolute right-8 top-1/2 transform -translate-y-1/2 z-50"
            : "absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50"
        }
      >
        <Button
          onClick={capture}
          disabled={isCapturing || isLoading || !!error}
          className="w-20 h-20 rounded-full bg-white hover:bg-gray-100 border-4 border-gray-300 shadow-2xl disabled:opacity-50 transition-transform active:scale-95"
        >
          <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-400 flex items-center justify-center">
            <Camera className="h-8 w-8 text-gray-800" />
          </div>
        </Button>
      </div>
    </div>
  );
}
