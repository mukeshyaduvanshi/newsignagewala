/**
 * Brand Racee — Controller Layer
 */

import { getOrSetCache } from "@/lib/utils/sidebar-cache";
import { RedisCache } from "@/lib/db/redis";
import { publish } from "@/lib/utils/pubsub";
import {
  BrandCacheKeys,
  BrandCacheTTL,
  BrandSSEChannels,
} from "@/lib/utils/brand-cache-keys";
import { getRaceeByBrand } from "./racee.service";

export async function getRaceeController(
  brandId: string,
  filters: { status?: string; search?: string } = {},
) {
  // Only cache unfilt ered requests (with filters → always fresh)
  if (filters.status || filters.search) {
    const { data } = await (async () => ({
      data: await getRaceeByBrand(brandId, filters),
    }))();
    return { data, source: "mongodb" as const };
  }

  return getOrSetCache(
    BrandCacheKeys.racee(brandId),
    () => getRaceeByBrand(brandId),
    BrandCacheTTL.racee,
    `Racee[brand:${brandId}]`,
  );
}

export async function invalidateRaceeCache(brandId: string) {
  await RedisCache.del(BrandCacheKeys.racee(brandId));
  await publish(BrandSSEChannels.racee(brandId), { type: "racee_updated" });
}
