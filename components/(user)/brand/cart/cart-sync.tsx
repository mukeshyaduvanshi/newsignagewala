"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/lib/redux/hooks";
import { setCartItems, setCartLoading } from "@/lib/redux/features/cart-slice";
import { useAuth } from "@/lib/context/AuthContext";

export function CartSync() {
  const dispatch = useAppDispatch();
  const { accessToken } = useAuth();

  useEffect(() => {
    const fetchCart = async () => {
      if (!accessToken) return;
      
      try {
        dispatch(setCartLoading(true));
        const response = await fetch("/api/brand/cart", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const formattedItems = data.items.map((item: any) => ({
            _id: item.siteId,
            siteId: item.siteId,
            cartItemId: item.siteId,
            elementName: item.elementName,
            siteDescription: item.siteDescription,
            photo: item.photo,
            width: item.width,
            height: item.height,
            measurementUnit: item.measurementUnit,
            rate: item.rate,
            calculateUnit: item.calculateUnit,
            quantity: item.quantity,
            addedAt: new Date(item.addedAt).getTime(),
            storeId: item.storeId,
            storeName: item.storeName,
            storeLocation: item.storeLocation,
            creativeLink: item.creativeLink,
            instructions: item.instructions,
          }));
          dispatch(setCartItems(formattedItems));
        }
      } catch (error) {
        console.error("Failed to fetch cart:", error);
      } finally {
        dispatch(setCartLoading(false));
      }
    };

    fetchCart();
  }, [dispatch, accessToken]);

  return null;
}
