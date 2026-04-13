import React from "react";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export function PageLoader({ message = "Loading...", fullScreen = false }: PageLoaderProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-primary/30"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-6 space-y-4", className)}>
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-muted rounded w-1/3"></div>
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
          <div className="h-4 bg-muted rounded w-4/6"></div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="animate-pulse p-4 space-y-3">
        {/* Header */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="h-8 bg-muted rounded"></div>
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, j) => (
              <div key={j} className="h-6 bg-muted/60 rounded"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="animate-pulse space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-1/3"></div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-8 w-8 bg-muted rounded-full"></div>
              </div>
              <div className="h-8 bg-muted rounded w-16"></div>
              <div className="h-3 bg-muted rounded w-28"></div>
            </div>
          ))}
        </div>
        
        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="animate-pulse space-y-6">
        <div className="space-y-2">
          <div className="h-5 bg-muted rounded w-24"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-5 bg-muted rounded w-32"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-5 bg-muted rounded w-28"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
        <div className="h-10 bg-muted rounded w-32"></div>
      </div>
    </div>
  );
}

export function InlineLoader({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <div className="absolute inset-0 rounded-full border-2 border-primary/30"></div>
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin"></div>
    </div>
  );
}

// Backwards compatibility
export function CardLoader() {
  return <CardSkeleton />;
}

export function TableLoader({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return <TableSkeleton rows={rows} columns={columns} />;
}
