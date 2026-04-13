"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SiteEditorTable } from "./site-editor-table";

interface OrderSitesProps {
  hiddenItemIds: string[];
  setHiddenItemIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export function OrderSites({ hiddenItemIds, setHiddenItemIds }: OrderSitesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Sites</CardTitle>
        <CardDescription>
          Manage sites in your order - add links and instructions for each site
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SiteEditorTable 
          hiddenItemIds={hiddenItemIds}
          setHiddenItemIds={setHiddenItemIds}
        />
      </CardContent>
    </Card>
  );
}
