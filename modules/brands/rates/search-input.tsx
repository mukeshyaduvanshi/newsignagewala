"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";

interface SearchInputProps {
  placeholder: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({ 
  placeholder, 
  onSearch, 
  debounceMs = 500,
  className = "max-w-sm"
}: SearchInputProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search effect
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      onSearch(searchQuery);
      setIsSearching(false);
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery, debounceMs, onSearch]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-8 pr-8"
      />
      {isSearching && (
        <Loader2 className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
