/**
 * Brand Orders — Controller Layer
 * Cache-aside (Redis) + pub/sub publish after mutations
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import { publish } from "@/lib/utils/pubsub";
import {
  BrandCacheKeys,
  BrandCacheTTL,
  BrandSSEChannels,
} from "@/lib/utils/brand-cache-keys";
import {
  getOrdersByBrand,
  createOrder,
  generateOrderNumber,
  CreateOrderInput,
} from "./orders.service";
import { invalidateManagerOrdersCacheByCreativeId } from "@/modules/manager/cache-invalidation";

export async function getOrdersController(brandId: string) {
  const cacheKey = BrandCacheKeys.orders(brandId);
  return getOrSetCache(
    cacheKey,
    () => getOrdersByBrand(brandId),
    BrandCacheTTL.orders,
    `Orders[brand:${brandId}]`,
  );
}

export async function createOrderController(
  brandId: string,
  body: Omit<CreateOrderInput, "brandId" | "orderNumber">,
) {
  const orderNumber = await generateOrderNumber();
  const order = await createOrder({ ...body, brandId, orderNumber });

  // Invalidate cache
  await RedisCache.del(BrandCacheKeys.orders(brandId));
  await RedisCache.del(BrandCacheKeys.cart(brandId));
  await RedisCache.del(BrandCacheKeys.purchaseAuthority(brandId));

  // Invalidate manager orders cache so manager sees this order immediately
  if (body.creativeManagerId) {
    await invalidateManagerOrdersCacheByCreativeId(
      body.creativeManagerId,
    ).catch(() => {});
  }

  // Notify SSE subscribers
  await publish(BrandSSEChannels.orders(brandId), {
    type: "order_created",
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
  });

  return order;
}

export async function invalidateOrdersCache(brandId: string) {
  await RedisCache.del(BrandCacheKeys.orders(brandId));
}
