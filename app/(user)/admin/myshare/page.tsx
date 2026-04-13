"use client";

import React, { useState, useRef, useCallback } from "react";
import { Upload, X, ImageIcon, Copy, Check, Link2, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UploadResult {
  fileId: string;
  url: string;
  expiresAt: string;
}

export default function MySharePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [expiryDays, setExpiryDays] = useState(7);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, []);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("expiryDays", String(expiryDays));
      if (recipientEmail) formData.append("recipientEmail", recipientEmail);

      const res = await fetch("/api/admin/myshare/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Upload failed");
      setResult(data.data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = async () => {
    if (!result?.url) return;
    await navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">MyShare</h1>
        <p className="text-muted-foreground mt-2">
          Upload images and get a shareable link instantly
        </p>
      </div>

      <div className="space-y-6">
        {/* Drop Zone */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Image</CardTitle>
            <CardDescription>JPEG, PNG, GIF, WEBP or SVG — max 10MB</CardDescription>
          </CardHeader>
          <CardContent>
            {!file ? (
              <div
                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                  dragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/30"
                }`}
                onClick={() => inputRef.current?.click()}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
              >
                <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Drag & drop or click to select</p>
                <p className="text-xs text-muted-foreground mt-1">Supported: JPG, PNG, GIF, WEBP, SVG</p>
                <input
                  ref={inputRef}
                  type="file"
                //   accept="image/*"
                  accept="*"
                  className="hidden"
                  onChange={onFileChange}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden border bg-muted/30">
                  {preview && (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full max-h-64 object-contain"
                    />
                  )}
                  <button
                    onClick={removeFile}
                    className="absolute top-2 right-2 bg-background/80 hover:bg-background border rounded-full p-1 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ImageIcon className="h-4 w-4" />
                  <span className="truncate font-medium">{file.name}</span>
                  <Badge variant="secondary" className="ml-auto shrink-0">
                    {(file.size / 1024).toFixed(1)} KB
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expiryDays" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Expiry (days)
              </Label>
              <Input
                id="expiryDays"
                type="number"
                min={1}
                max={365}
                value={expiryDays}
                onChange={(e) => setExpiryDays(Math.max(1, parseInt(e.target.value) || 7))}
                className="w-32"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Recipient Email <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder="recipient@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardHeader>
              <CardTitle className="text-lg text-green-600 dark:text-green-400">
                Upload Successful!
              </CardTitle>
              <CardDescription>
                Expires: {new Date(result.expiresAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm break-all flex-1 font-mono">{result.url}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyUrl}
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">File ID: {result.fileId}</p>
            </CardContent>
          </Card>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full"
          size="lg"
        >
          {uploading ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-bounce" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload & Share
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
