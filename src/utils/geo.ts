import { Coordinates } from '../types';

/**
 * Calculates Great-Circle distance between two points on Earth using Haversine formula in meters.
 */
export function calculateDistanceMeters(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Computes compass bearing from origin to target in degrees (0-360, where 0 is North).
 */
export function calculateBearing(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const dLng = toRad(to.lng - from.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Formats distance in meters or kilometers.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Validates GPS proximity with security guardrails.
 */
export function verifyGPSProximity(
  userCoord: Coordinates,
  itemCoord: { lat: number; lng: number; radiusMeters: number },
  options?: { bypassForSimulation?: boolean }
): { verified: boolean; distanceMeters: number; reason?: string } {
  if (options?.bypassForSimulation) {
    return { verified: true, distanceMeters: 5, reason: "Simulation override" };
  }

  const distance = calculateDistanceMeters(userCoord, itemCoord);
  const allowedRadius = itemCoord.radiusMeters || 40;

  // If user device GPS has large error margin (accuracy > 50m), give slight tolerance
  const tolerance = Math.min(25, userCoord.accuracy ? userCoord.accuracy / 2 : 10);
  const maxDistance = allowedRadius + tolerance;

  if (distance <= maxDistance) {
    return { verified: true, distanceMeters: distance };
  }

  return {
    verified: false,
    distanceMeters: distance,
    reason: `Too far from real item! You are ${formatDistance(distance)} away. You must be within ${allowedRadius}m of ${itemCoord.lat}, ${itemCoord.lng} to unlock it.`,
  };
}
