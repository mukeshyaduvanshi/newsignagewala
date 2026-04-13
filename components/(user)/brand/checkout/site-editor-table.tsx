"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2, Link as LinkIcon, FileText, Search, Plus, Minus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { removeFromCart, updateSiteDetails, updateQuantity } from "@/lib/redux/features/cart-slice";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";

interface SiteEditorTableProps {
  hiddenItemIds: string[];
  setHiddenItemIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export function SiteEditorTable({ hiddenItemIds, setHiddenItemIds }: SiteEditorTableProps) {
  const dispatch = useAppDispatch();
  const { accessToken } = useAuth();
  const cartItems = useAppSelector((state) => state.cart.items);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [editingItem, setEditingItem] = React.useState<{
    siteId: string;
    creativeLink: string;
    instructions: string;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const filteredItems = cartItems.filter(
    (item) =>
      !hiddenItemIds.includes(item.siteId || item._id) &&
      (item.elementName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.siteDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.storeName?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenEdit = (item: any) => {
    setEditingItem({
      siteId: item.siteId || item._id,
      creativeLink: item.creativeLink || "",
      instructions: item.instructions || "",
    });
    setIsDialogOpen(true);
  };

  const handleSaveDetails = async () => {
    if (!editingItem || !accessToken) return;

    // Update Redux state
    dispatch(
      updateSiteDetails({
        siteId: editingItem.siteId,
        creativeLink: editingItem.creativeLink,
        instructions: editingItem.instructions,
      })
    );

    try {
      // TODO: Add API endpoint to update site details in database
      // For now, just update Redux state
      toast.success("Site details updated!");
    } catch (error) {
      console.error("Error updating site details:", error);
      toast.error("Failed to update site details");
    }

    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const handleRemoveItem = (siteId: string) => {
    // Only hide from current order view, don't remove from cart
    // Item will remain in cart count until order is placed
    setHiddenItemIds((prev) => [...prev, siteId]);
    toast.success("Site removed from order");
  };

  const handleUpdateQuantity = async (siteId: string, newQuantity: number) => {
    if (!accessToken || newQuantity < 1) return;

    try {
      const response = await fetch("/api/brand/cart", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ siteId, quantity: newQuantity }),
      });

      if (response.ok) {
        dispatch(updateQuantity({ siteId, quantity: newQuantity }));
      } else {
        const data = await response.json();
        console.error("Failed to update quantity:", data);
        toast.error("Failed to update quantity");
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity");
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search sites by name, description, or store..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Sites Table */}
      <div className="border rounded-lg">
        <div className="max-h-[280px] overflow-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Image</TableHead>
              <TableHead>Site Details</TableHead>
              <TableHead>Store</TableHead>
              <TableHead className="w-[100px]">Quantity</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {searchQuery ? "No sites found matching your search" : "No sites in order"}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.cartItemId}>
                  <TableCell>
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-muted">
                      {item.photo ? (
                        <img
                          src={item.photo}
                          alt={item.elementName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.siteDescription || item.elementName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.width}(w) x {item.height}(h) {item.measurementUnit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ₹{item.rate}/{item.calculateUnit}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{item.storeName}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleUpdateQuantity(item.siteId || item._id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-medium min-w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleUpdateQuantity(item.siteId || item._id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {item.creativeLink && (
                        <div className="h-6 w-6 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <LinkIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                      {item.instructions && (
                        <div className="h-6 w-6 rounded bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <FileText className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRemoveItem(item.siteId || item._id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Site Details</DialogTitle>
            <DialogDescription>
              Add creative link and instructions for this site
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="creativeLink">Creative Link</Label>
                <Input
                  id="creativeLink"
                  placeholder="https://example.com/creative"
                  value={editingItem.creativeLink}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, creativeLink: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  placeholder="Add any special instructions for this site..."
                  rows={4}
                  value={editingItem.instructions}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, instructions: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveDetails}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
