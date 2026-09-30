import { GeoLocation } from './types';

/**
 * Calculates Haversine distance in kilometers between two latitude/longitude points.
 * Earth radius = 6371.0088 km
 */
export function calculateHaversineDistanceKm(pointA: GeoLocation, pointB: GeoLocation): number {
  const toRad = (angle: number) => (angle * Math.PI) / 180;

  const lat1 = pointA.latitude;
  const lon1 = pointA.longitude;
  const lat2 = pointB.latitude;
  const lon2 = pointB.longitude;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = 6371.0088 * c;

  // Round to two decimal places
  return Math.round(distance * 100) / 100;
}

/**
 * Checks if a point is within the maximum delivery radius of another point.
 */
export function isWithinRadiusKm(origin: GeoLocation, target: GeoLocation, maxKm: number): boolean {
  const dist = calculateHaversineDistanceKm(origin, target);
  return dist <= maxKm;
}
