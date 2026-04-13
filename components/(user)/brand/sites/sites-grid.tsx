"use client";

import * as React from "react";
import { SiteCard } from "./site-card";
import type { Site } from "@/hooks/use-store-sites";

interface SitesGridProps {
  sites: Site[];
  limit?: number;
}

export function SitesGrid({ sites, limit }: SitesGridProps) {
  const displaySites = limit ? sites.slice(0, limit) : sites;

  if (sites.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">No sites available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 lg:gap-4">
      {displaySites.map((site) => (
        <SiteCard key={site._id} site={site} />
      ))}
    </div>
  );
}
