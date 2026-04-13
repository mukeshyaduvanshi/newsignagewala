// Example usage of CameraView with ImageEditor
// You can integrate this into your existing page component

"use client";

import * as React from "react";
import { CameraView } from "@/components/ui/camera-view";
import { ImageEditor } from "@/components/ui/image-editor";
import { Button } from "@/components/ui/button";
import { Camera, Upload } from "lucide-react";

export default function PhotoCaptureFlow() {
  const [view, setView] = React.useState<"menu" | "camera" | "editor">("menu");
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);

  const handleCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc);
    setView("editor");
  };

  const handleSave = (blob: Blob) => {
    // Handle the saved/edited image blob
    // Upload to your server, save to storage, etc.
    console.log("Image saved:", blob);

    // Reset to menu
    setView("menu");
    setCapturedImage(null);
  };

  const handleCancel = () => {
    setView("menu");
    setCapturedImage(null);
  };

  const handleFileUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setCapturedImage(e.target?.result as string);
          setView("editor");
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <>
      {view === "menu" && (
        <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-b from-gray-50 to-gray-100">
          <div className="w-full max-w-md space-y-4">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Capture Signage
              </h1>
              <p className="text-gray-600">
                Take a photo or upload an image to get started
              </p>
            </div>

            <Button
              onClick={() => setView("camera")}
              className="w-full h-16 text-lg"
              size="lg"
            >
              <Camera className="mr-3 h-6 w-6" />
              Take Photo with Camera
            </Button>

            <Button
              variant="outline"
              onClick={handleFileUpload}
              className="w-full h-16 text-lg"
              size="lg"
            >
              <Upload className="mr-3 h-6 w-6" />
              Upload from Gallery
            </Button>
          </div>
        </div>
      )}

      {view === "camera" && (
        <CameraView onCapture={handleCapture} onCancel={handleCancel} />
      )}

      {view === "editor" && capturedImage && (
        <ImageEditor
          imageUrl={capturedImage}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
