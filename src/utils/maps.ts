import { Linking, Platform } from 'react-native';
import type { Address } from '../types/api';

export type Coordinates = { latitude: number; longitude: number };

// Backend stores `address.coordinates: {latitude,longitude}`. Older code paths
// may also use flat fields. Normalize defensively.
export function getCoordinates(address?: Address | null): Coordinates | null {
  if (!address) return null;
  const lat = address.coordinates?.latitude ?? address.latitude;
  const lng = address.coordinates?.longitude ?? address.longitude;
  if (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng)
  ) {
    return { latitude: lat, longitude: lng };
  }
  return null;
}

export type NavigateTarget = {
  coordinates?: Coordinates | null;
  address?: string;
  label?: string;
};

// Builds the prioritized URL list.
// - Android: Google Maps directions URL (opens the Google Maps app directly
//   when installed; otherwise falls through to geo: pin then to the browser).
// - iOS: Google Maps app first (comgooglemaps://), then web Google Maps as
//   the fallback. Apple Maps is intentionally NOT used — drivers should only
//   ever see Google Maps.
function buildCandidateUrls(target: NavigateTarget): string[] {
  const { coordinates, address, label } = target;
  const out: string[] = [];
  const labelPart = label ? `(${encodeURIComponent(label)})` : '';

  if (coordinates) {
    const { latitude: lat, longitude: lng } = coordinates;
    if (Platform.OS === 'android') {
      out.push(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
      );
      out.push(`geo:${lat},${lng}?q=${lat},${lng}${labelPart}`);
    } else {
      out.push(`comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`);
      out.push(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
      );
    }
  } else if (address) {
    const q = encodeURIComponent(address);
    if (Platform.OS === 'android') {
      out.push(
        `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`
      );
      out.push(`geo:0,0?q=${q}`);
    } else {
      out.push(`comgooglemaps://?daddr=${q}&directionsmode=driving`);
      out.push(
        `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`
      );
    }
  }
  return out;
}

export async function openExternalNavigation(target: NavigateTarget): Promise<void> {
  if (!target.coordinates && !target.address) {
    throw new Error('openExternalNavigation: no coordinates or address provided');
  }
  const urls = buildCandidateUrls(target);
  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return;
    } catch {
      // Try next candidate
    }
  }
}
