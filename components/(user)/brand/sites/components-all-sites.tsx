"use client";
import * as React from "react";

import { useBrandStores } from "@/hooks/use-brand-stores";
import { StoreSitesCard } from "./store-sites-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StoresSearch } from "./stores-search";

export default function ComponentsAllSites() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Debounce search query (300ms)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Use API-based search with limit (initially 10 stores, unlimited when searching)
  const limit = debouncedSearch ? undefined : 10;
  const { stores, isLoading, isError } = useBrandStores(debouncedSearch, limit);

  // Track which stores have sites
  const [storesWithSitesSet, setStoresWithSitesSet] = React.useState<
    Set<string>
  >(new Set());

  const handleSitesCount = React.useCallback(
    (storeId: string, hasSites: boolean) => {
      setStoresWithSitesSet((prev) => {
        const newSet = new Set(prev);
        if (hasSites) {
          newSet.add(storeId);
        } else {
          newSet.delete(storeId);
        }
        return newSet;
      });
    },
    [],
  );

  const storesWithSites = storesWithSitesSet.size;
  const totalStores = stores?.length || 0;

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header with Search - Mobile Responsive */}
      <div className="space-y-3 sm:space-y-0">
        {/* Mobile: Stacked Layout */}
        <div className="sm:hidden space-y-3">
          <h1 className="text-xl font-bold">All Sites</h1>
          <div className="w-full">
            <StoresSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>
          {!isLoading && !isError && totalStores > 0 && (
            <p className="text-xs text-muted-foreground">
              {storesWithSites} / {totalStores}{" "}
              {totalStores === 1 ? "Store" : "Stores"}
            </p>
          )}
        </div>

        {/* Desktop: Horizontal Layout */}
        <div className="hidden sm:flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">All Sites</h1>
          <div className="flex-1 max-w-md">
            <StoresSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>
          {!isLoading && !isError && totalStores > 0 && (
            <p className="text-sm text-muted-foreground whitespace-nowrap">
              {storesWithSites} / {totalStores}{" "}
              {totalStores === 1 ? "Store" : "Stores"}
            </p>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-64 w-full" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Card className="p-6 border-red-200 bg-red-50">
          <h2 className="text-lg font-semibold text-red-600">
            Failed to load stores
          </h2>
          <p className="text-sm text-red-500 mt-2">
            Please try refreshing the page.
          </p>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && (!stores || stores.length === 0) && (
        <Card className="p-12 text-center">
          <p className="text-lg text-muted-foreground">
            {debouncedSearch
              ? `No stores found for "${debouncedSearch}"`
              : "No stores found. Create your first store to get started."}
          </p>
        </Card>
      )}

      {/* Stores List */}
      {!isLoading && !isError && stores && stores.length > 0 && (
        <div className="space-y-6">
          {stores.map((store) => (
            <StoreSitesCard
              key={store._id}
              store={store}
              onSitesCountChange={handleSitesCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
