/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Sort items by distance from a reference location
 * @param items Array of items with location data
 * @param userLat User's latitude
 * @param userLon User's longitude
 * @param getCoordinates Function to extract coordinates from item
 * @returns Sorted array with items closest to user first
 */
export function sortByDistance<T>(
  items: T[],
  userLat: number,
  userLon: number,
  getCoordinates: (item: T) => { lat: number; lon: number } | null
): T[] {
  // Separate items with and without location
  const itemsWithLocation: Array<T & { distance: number }> = [];
  const itemsWithoutLocation: T[] = [];

  items.forEach((item) => {
    const coords = getCoordinates(item);
    if (coords) {
      const distance = calculateDistance(
        userLat,
        userLon,
        coords.lat,
        coords.lon
      );
      itemsWithLocation.push({ ...item, distance });
    } else {
      itemsWithoutLocation.push(item);
    }
  });

  // Sort items with location by distance
  itemsWithLocation.sort((a, b) => a.distance - b.distance);

  // Return sorted items with location first, then items without location
  return [
    ...itemsWithLocation.map(({ distance, ...item }) => item as T),
    ...itemsWithoutLocation,
  ];
}
