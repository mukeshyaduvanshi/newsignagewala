"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SitesSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  placeholder?: string;
}

export function SitesSearch({ 
  searchQuery, 
  setSearchQuery, 
  placeholder = "Search sites by name, description, or type..." 
}: SitesSearchProps) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}

