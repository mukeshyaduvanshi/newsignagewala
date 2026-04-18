/**
 * Brand Cart — Service Layer
 */

import dbConnect from "@/lib/db/mongodb";
import Cart from "@/lib/models/cart.model";

export async function getCartByBrand(brandId: string) {
  await dbConnect();
  const cart = await Cart.findOne({ brandId }).lean();
  return cart?.items || [];
}
