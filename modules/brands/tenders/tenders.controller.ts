/**
 * Brand Tenders — Controller Layer
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import { publish } from "@/lib/utils/pubsub";
import {
  BrandCacheKeys,
  BrandCacheTTL,
  BrandSSEChannels,
} from "@/lib/utils/brand-cache-keys";
import { getTendersByBrand, createTender } from "./tenders.service";

export async function getTendersController(brandId: string) {
  return getOrSetCache(
    BrandCacheKeys.tenders(brandId),
    () => getTendersByBrand(brandId),
    BrandCacheTTL.tenders,
    `Tenders[brand:${brandId}]`,
  );
}

export async function createTenderController(brandId: string, body: any) {
  const tender = await createTender(brandId, body);

  await RedisCache.del(BrandCacheKeys.tenders(brandId));
  await RedisCache.del(BrandCacheKeys.cart(brandId));

  await publish(BrandSSEChannels.tenders(brandId), {
    type: "tender_created",
    tenderId: tender._id.toString(),
    tenderNumber: tender.tenderNumber,
  });

  return tender;
}

export async function invalidateTendersCache(brandId: string) {
  await RedisCache.del(BrandCacheKeys.tenders(brandId));
}
