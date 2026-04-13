import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Site } from "@/hooks/use-store-sites";

export interface CartItem extends Site {
  cartItemId: string;
  siteId?: string;
  quantity: number;
  addedAt: number;
  storeId: string;
  storeName: string;
  storeLocation: {
    latitude: number;
    longitude: number;
  };
  pincode?: string;
  creativeLink?: string;
  instructions?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
}

const initialState: CartState = {
  items: [],
  isOpen: false,
  isLoading: false,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
    },
    setCartLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    addToCart: (
      state,
      action: PayloadAction<
        Site & {
          storeId: string;
          storeName: string;
          storeLocation: { latitude: number; longitude: number };
        }
      >,
    ) => {
      const existingItem = state.items.find(
        (item) => item._id === action.payload._id,
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({
          ...action.payload,
          cartItemId: `${action.payload._id}-${Date.now()}`,
          quantity: 1,
          addedAt: Date.now(),
          storeId: action.payload.storeId,
          storeName: action.payload.storeName,
          storeLocation: action.payload.storeLocation,
        });
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        (item) => (item.siteId || item._id) !== action.payload
      );
    },
    removeBulkItems: (state, action: PayloadAction<string[]>) => {
      const idsToRemove = action.payload;
      state.items = state.items.filter(
        (item) => !idsToRemove.includes(item.siteId || item._id)
      );
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ siteId: string; quantity: number }>,
    ) => {
      const item = state.items.find(
        (item) => (item.siteId || item._id) === action.payload.siteId,
      );
      if (item) {
        item.quantity = Math.max(1, action.payload.quantity);
      }
    },
    updateSiteDetails: (
      state,
      action: PayloadAction<{
        siteId: string;
        creativeLink?: string;
        instructions?: string;
      }>,
    ) => {
      const item = state.items.find(
        (item) => (item.siteId || item._id) === action.payload.siteId,
      );
      if (item) {
        if (action.payload.creativeLink !== undefined) {
          item.creativeLink = action.payload.creativeLink;
        }
        if (action.payload.instructions !== undefined) {
          item.instructions = action.payload.instructions;
        }
      }
    },
    clearCart: (state) => {
      state.items = [];
    },
    toggleCartDrawer: (state) => {
      state.isOpen = !state.isOpen;
    },
    setCartDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Listen to global RESET_STORE action for complete logout
    builder.addCase("RESET_STORE" as any, () => initialState);
  },
});

export const {
  addToCart,
  removeFromCart,
  removeBulkItems,
  updateQuantity,
  updateSiteDetails,
  clearCart,
  toggleCartDrawer,
  setCartDrawerOpen,
  setCartItems,
  setCartLoading,
} = cartSlice.actions;

export default cartSlice.reducer;
