"use client";

import * as React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Trash2,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  Plus,
  Maximize2,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Input } from "../ui/input";
import { vh } from "motion/react";

interface MultipleImageCaptureProps {
  open: boolean;
  onClose: () => void;
  onComplete: (imageUrls: string[]) => void;
  siteName: string;
  maxImages?: number;
  remarks: string;
  setRemarks: (remarks: string) => void;
  siteWidth?: number;
  siteHeight?: number;
}

type CaptureStep = "capture" | "review";

export const MultipleImageCapture = ({
  open,
  onClose,
  onComplete,
  siteName,
  maxImages = 10,
  remarks,
  setRemarks,
  siteWidth,
  siteHeight,
}: MultipleImageCaptureProps) => {
  const webcamRef = useRef<Webcam>(null);
  const webcamContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<CaptureStep>("capture");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [webcamDimensions, setWebcamDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [rectPosition, setRectPosition] = useState({ x: 0, y: 0 });
  const [rectSize, setRectSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showRectangle, setShowRectangle] = useState(true);

  const videoConstraints = {
    width: screen.width > 720 ? 1280 : 1920,
    height: screen.width > 720 ? 720 : 1080,
    facingMode: "environment", // Use back camera on mobile
  };

  // Measure webcam container on mount and open
  useEffect(() => {
    if (open && webcamContainerRef.current) {
      const rect = webcamContainerRef.current.getBoundingClientRect();
      setWebcamDimensions({
        width: rect.width,
        height: rect.height,
      });
    }
  }, [open]);

  // Initialize rectangle position and size
  useEffect(() => {
    if (
      siteWidth &&
      siteHeight &&
      siteWidth > 0 &&
      siteHeight > 0 &&
      webcamContainerRef.current
    ) {
      const container = webcamContainerRef.current;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      if (containerWidth > 0 && containerHeight > 0) {
        const aspectRatio = siteWidth / siteHeight;
        const rectWidth = Math.min(
          containerWidth * 0.8,
          containerHeight * 0.7 * aspectRatio,
        );
        const rectHeight = rectWidth / aspectRatio;

        // Ensure rectangle fits within container
        const finalRectWidth = Math.min(rectWidth, containerWidth * 0.9);
        const finalRectHeight = finalRectWidth / aspectRatio;

        setRectSize({ width: finalRectWidth, height: finalRectHeight });
        setRectPosition({
          x: Math.max(0, (containerWidth - finalRectWidth) / 2),
          y: Math.max(0, (containerHeight - finalRectHeight) / 2),
        });
      }
    }
  }, [siteWidth, siteHeight, open]);

  // Handle orientation changes and ensure rectangle stays visible
  useEffect(() => {
    const handleOrientationChange = () => {
      // Delay to allow container to resize
      setTimeout(() => {
        if (siteWidth && siteHeight && webcamContainerRef.current) {
          const container = webcamContainerRef.current;
          const containerWidth = container.offsetWidth;
          const containerHeight = container.offsetHeight;

          if (containerWidth > 0 && containerHeight > 0) {
            const aspectRatio = siteWidth / siteHeight;
            const rectWidth = Math.min(
              containerWidth * 0.8,
              containerHeight * 0.7 * aspectRatio,
            );
            const rectHeight = rectWidth / aspectRatio;

            setRectSize({ width: rectWidth, height: rectHeight });
            setRectPosition({
              x: Math.max(0, (containerWidth - rectWidth) / 2),
              y: Math.max(0, (containerHeight - rectHeight) / 2),
            });
          }
        }
      }, 300);
    };

    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleOrientationChange);

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleOrientationChange);
    };
  }, [siteWidth, siteHeight]);

  const handleCapture = useCallback(() => {
    if (!webcamRef.current) {
      toast.error("Camera not ready", {
        duration: 5000,
        position: "top-right",
      });
      return;
    }

    if (capturedImages.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`, {
        duration: 5000,
        position: "top-right",
      });
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      // If site dimensions are provided and rectangle is enabled, draw the rectangle on the captured image
      if (
        showRectangle &&
        siteWidth &&
        siteHeight &&
        canvasRef.current &&
        webcamContainerRef.current
      ) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const img = new Image();
          img.onload = () => {
            // Set canvas size to match captured image
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw the captured image
            ctx.drawImage(img, 0, 0);

            // Calculate rectangle position relative to the actual video/captured image
            const container = webcamContainerRef.current;
            if (!container) return;

            const containerRect = container.getBoundingClientRect();
            const videoElement = webcamRef.current?.video;

            if (videoElement) {
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

              // Scale to actual captured image dimensions
              const scaleX = img.width / displayedVideoWidth;
              const scaleY = img.height / displayedVideoHeight;

              const rectX = relativeX * scaleX;
              const rectY = relativeY * scaleY;
              const rectWidth = rectSize.width * scaleX;
              const rectHeight = rectSize.height * scaleY;

              // Draw yellow rectangle on the captured image
              ctx.strokeStyle = "#eab308"; // yellow-500
              ctx.lineWidth = Math.max(
                3,
                Math.min(img.width, img.height) / 300,
              ); // Responsive line width
              ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);

              // Convert to data URL and store
              const finalImageSrc = canvas.toDataURL("image/jpeg", 0.95);
              setCapturedImages((prev) => {
                const newImages = [...prev, finalImageSrc];
                toast.success(`Image ${newImages.length} captured`, {
                  duration: 2000,
                  position: "top-right",
                });
                return newImages;
              });
            }
          };
          img.src = imageSrc;
        }
      } else {
        // No rectangle to draw, store original image
        setCapturedImages((prev) => {
          const newImages = [...prev, imageSrc];
          toast.success(`Image ${newImages.length} captured`, {
            duration: 2000,
            position: "top-right",
          });
          return newImages;
        });
      }
    } else {
      toast.error("Failed to capture image", {
        duration: 5000,
        position: "top-right",
      });
    }
  }, [
    capturedImages.length,
    maxImages,
    siteWidth,
    siteHeight,
    rectPosition,
    rectSize,
    showRectangle,
  ]);

  const handleDeleteImage = (index: number) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
    toast.success("Image deleted", { duration: 2000, position: "top-right" });
  };

  const handleComplete = async () => {
    if (capturedImages.length === 0) {
      toast.error("Please capture at least one image", {
        duration: 5000,
        position: "top-right",
      });
      return;
    }

    console.log("Starting image upload process...");
    console.log("Total captured images:", capturedImages.length);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload images through API endpoint
      const uploadResponse = await fetch(
        "/api/installcertificates/upload-images",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: capturedImages }),
        },
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error("Upload failed:", errorData);
        throw new Error("Failed to upload images");
      }

      const uploadResult = await uploadResponse.json();
      console.log("Upload successful:", uploadResult);
      setUploadProgress(100);

      toast.success(
        `${uploadResult.urls.length} images uploaded successfully`,
        { duration: 2000, position: "top-right" },
      );
      console.log("Calling onComplete with URLs:", uploadResult.urls);
      onComplete(uploadResult.urls);
      handleCancel();
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images. Please try again.", {
        duration: 5000,
        position: "top-right",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCancel = () => {
    setCapturedImages([]);
    setUploadProgress(0);
    setCurrentStep("capture");
    setPreviewImage(null);
    onClose();
  };

  const handleAddRemarks = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log({ e: e.target.value });
    setRemarks(e.target.value);
  };

  const handleNext = () => {
    if (capturedImages.length === 0) {
      toast.error("Please capture at least one image", {
        duration: 5000,
        position: "top-right",
      });
      return;
    }
    setCurrentStep("review");
  };

  const handleBackToCapture = () => {
    setCurrentStep("capture");
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
      if (!isDragging || !webcamContainerRef.current) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const container = webcamContainerRef.current;
      const rect = container.getBoundingClientRect();

      let newX = clientX - rect.left - dragStart.x;
      let newY = clientY - rect.top - dragStart.y;

      // Constrain within bounds - ensure rectangle stays within container
      const minX = -rectSize.width * 0.1; // Allow slight overflow for corner markers
      const maxX = rect.width - rectSize.width * 0.9;
      const minY = -rectSize.height * 0.1;
      const maxY = rect.height - rectSize.height * 0.9;

      newX = Math.max(minX, Math.min(newX, maxX));
      newY = Math.max(minY, Math.min(newY, maxY));

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
      if (
        !isResizing ||
        !webcamContainerRef.current ||
        !siteWidth ||
        !siteHeight
      )
        return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - dragStart.x;
      const deltaY = clientY - dragStart.y;
      const delta = Math.max(deltaX, deltaY);

      const aspectRatio = siteWidth / siteHeight;
      let newWidth = rectSize.width + delta;
      let newHeight = newWidth / aspectRatio;

      const container = webcamContainerRef.current;
      const rect = container.getBoundingClientRect();

      // Constrain within bounds - ensure rectangle stays mostly within container
      if (rectPosition.x + newWidth > rect.width + rectSize.width * 0.2) {
        newWidth = rect.width - rectPosition.x + rectSize.width * 0.2;
        newHeight = newWidth / aspectRatio;
      }
      if (rectPosition.y + newHeight > rect.height + rectSize.height * 0.2) {
        newHeight = rect.height - rectPosition.y + rectSize.height * 0.2;
        newWidth = newHeight * aspectRatio;
      }

      // Minimum size - ensure it's still visible
      const minSize = Math.min(rect.width, rect.height) * 0.1;
      if (newWidth < minSize) {
        newWidth = minSize;
        newHeight = newWidth / aspectRatio;
      }

      setRectSize({ width: newWidth, height: newHeight });
      setDragStart({ x: clientX, y: clientY });
    },
    [isResizing, dragStart, rectSize, rectPosition, siteWidth, siteHeight],
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

  return (
    <>
      <Dialog open={open} onOpenChange={handleCancel}>
        <DialogContent
          className="w-screen  max-w-4xl h-screen overflow-auto p-2"
          closeButtonClassName="top-10 right-8"
        >
          {/* <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {currentStep === "capture"
                ? "Capture Site Images"
                : "Review & Manage Images"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {currentStep === "capture" ? (
                <>
                  Capture images for: <strong>{siteName}</strong> (Max{" "}
                  {maxImages} images)
                </>
              ) : (
                <>
                  Review captured images for: <strong>{siteName}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader> */}

          <div className="space-y-3 sm:space-y-4 mt-2 sm:mt-4">
            {/* STEP 1: CAPTURE PHASE */}
            {currentStep === "capture" && (
              <>
                {/* Webcam View */}
                <div
                  ref={webcamContainerRef}
                  className="relative rounded-lg bg-black"
                >
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    className="w-full rounded-lg top-0 obje"
                    style={{ zIndex: 1 }}
                  />

                  {/* Hidden canvas for image processing */}
                  <canvas ref={canvasRef} style={{ display: "none" }} />

                  {/* Proportional Rectangle Guideline - based on entered dimensions */}
                  {showRectangle &&
                    siteWidth &&
                    siteHeight &&
                    siteWidth > 0 &&
                    siteHeight > 0 &&
                    rectSize.width > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          left: `${rectPosition.x}px`,
                          top: `${rectPosition.y}px`,
                          width: `${rectSize.width}px`,
                          height: `${rectSize.height}px`,
                          pointerEvents: "auto",
                          zIndex: 50,
                          opacity: 1,
                          visibility: "visible",
                        }}
                        className="border-4 border-yellow-400 rounded-lg shadow-2xl cursor-move touch-none select-none"
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
                          {siteWidth} × {siteHeight}
                        </div> */}

                        {/* Width label - top side */}
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-400/90 text-black px-2 py-0.5 rounded text-xs font-semibold shadow pointer-events-none">
                          {siteWidth}
                        </div>

                        {/* Height label - right side */}
                        <div className="absolute top-1/2 -right-8 transform -translate-y-1/2 bg-yellow-400/90 text-black px-2 py-0.5 rounded text-xs font-semibold shadow pointer-events-none">
                          {siteHeight}
                        </div>
                      </div>
                    )}

                  {/* Capture Button */}
                  <div className="absolute bottom-2 grid grid-cols-4 gap-4 w-full px-4">
                    {/* Rectangle Toggle Button */}
                    {siteWidth && siteHeight && (
                      <div className="col-span-4 mb-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowRectangle(!showRectangle)}
                          className="w-full sm:w-auto"
                        >
                          {showRectangle ? (
                            <EyeOff className="mr-2 h-4 w-4" />
                          ) : (
                            <Eye className="mr-2 h-4 w-4" />
                          )}
                          <span className="text-sm">
                            {showRectangle ? "Hide" : "Show"} Rectangle
                          </span>
                        </Button>
                      </div>
                    )}
                    <div className="col-span-4">
                      {/* Remarks Input */}
                      <Input
                        placeholder="Add remarks (optional)"
                        className="w-full"
                        defaultValue={remarks}
                        onBlur={(e) => handleAddRemarks(e)}
                      />
                    </div>
                    <div className="col-span-3 text-left">
                      <Button
                        size="default"
                        onClick={handleCapture}
                        disabled={
                          isUploading || capturedImages.length >= maxImages
                        }
                        className="rounded-md w-full  sm:w-auto shadow-lg"
                      >
                        <Camera className="mr-1 sm:mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                        <span className="text-sm sm:text-base">Capture</span>
                      </Button>
                    </div>
                    <div className="flex items-center justify-center ">
                      <Button
                        onClick={handleNext}
                        disabled={capturedImages.length === 0}
                        className="rounded-md w-full"
                      >
                        <div>
                          <span className="text-xs sm:text-base">
                            ({capturedImages.length}/{maxImages})
                          </span>
                        </div>
                        <div>
                          <ArrowRight className="" />
                        </div>
                      </Button>
                    </div>
                  </div>

                  {/* Capture Counter Badge */}
                  {/* <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-semibold">
                    {capturedImages.length} / {maxImages} Images
                  </div> */}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 sm:pt-4">
                  {/* <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="w-full sm:w-auto"
                  >
                    <X className="mr-1 sm:mr-2 h-4 w-4" />
                    <span className="text-sm sm:text-base">Cancel</span>
                  </Button> */}
                </div>
              </>
            )}

            {/* STEP 2: REVIEW PHASE */}
            {currentStep === "review" && (
              <>
                {/* Captured Images Grid */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-medium">
                      Captured Images ({capturedImages.length})
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBackToCapture}
                      disabled={
                        isUploading || capturedImages.length >= maxImages
                      }
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      <span className="text-xs">Add More</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                    {capturedImages.map((image, index) => (
                      <div
                        key={index}
                        className="relative group rounded-lg overflow-hidden border-2 hover:border-primary transition-all"
                      >
                        {/* Clickable Image Area */}
                        <div
                          className="cursor-pointer"
                          onClick={() => setPreviewImage(image)}
                        >
                          <img
                            src={image}
                            alt={`Captured ${index + 1}`}
                            className="w-full h-32 sm:h-40 object-cover"
                          />

                          {/* View Icon Overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center pointer-events-none">
                            <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>

                        {/* Delete Button */}
                        <div
                          className="absolute top-1 right-1 z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(index);
                            }}
                            disabled={isUploading}
                            className="h-7 w-7 p-0 shadow-lg"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Image Number */}
                        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none">
                          #{index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                      <span>Uploading images...</span>
                      <span className="text-primary">
                        {Math.round(uploadProgress)}%
                      </span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-2 sm:pt-4">
                  <Button
                    variant="outline"
                    onClick={handleBackToCapture}
                    disabled={isUploading}
                    className="w-full sm:w-auto"
                  >
                    <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
                    <span className="text-sm sm:text-base">
                      Back to Capture
                    </span>
                  </Button>
                  <Button
                    onClick={handleComplete}
                    disabled={capturedImages.length === 0 || isUploading}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                  >
                    <Check className="mr-1 sm:mr-2 h-4 w-4" />
                    <span className="text-sm sm:text-base">
                      {isUploading
                        ? "Uploading..."
                        : `Complete Images (${capturedImages.length})`}
                    </span>
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[95vh] p-2">
          <div className="relative w-full h-full">
            {previewImage && (
              <>
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
                />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
