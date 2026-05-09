import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Address } from '../types/api';

export type Coordinates = { latitude: number; longitude: number };
export type IosMapsApp = 'google' | 'apple';

const PREF_KEY = '@tiffsy_driver/preferred_maps_app';

// Backend serializes coords at address.coordinates.{lat,lng}; older / future
// shapes may use flat fields, so we read both defensively.
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

export async function getPreferredIosMapsApp(): Promise<IosMapsApp | null> {
  try {
    const v = await AsyncStorage.getItem(PREF_KEY);
    return v === 'google' || v === 'apple' ? v : null;
  } catch {
    return null;
  }
}

export async function setPreferredIosMapsApp(app: IosMapsApp): Promise<void> {
  try {
    await AsyncStorage.setItem(PREF_KEY, app);
  } catch (error) {
    console.error('Error saving preferred maps app:', error);
  }
}

export async function clearPreferredIosMapsApp(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREF_KEY);
  } catch (error) {
    console.error('Error clearing preferred maps app:', error);
  }
}

export async function isGoogleMapsAvailable(): Promise<boolean> {
  if (Platform.OS === 'android') return true;
  try {
    return await Linking.canOpenURL('comgooglemaps://');
  } catch {
    return false;
  }
}

export type NavigateTarget = {
  coordinates?: Coordinates | null;
  address?: string;
  label?: string;
};

// Open the destination in directions-PREVIEW mode — the maps app loads the route
// to the destination but does NOT auto-start turn-by-turn navigation. The driver
// taps "Start" / "GO" themselves once they're ready.
function buildCandidateUrls(target: NavigateTarget, iosApp?: IosMapsApp): string[] {
  const { coordinates, address, label } = target;
  const out: string[] = [];
  const labelPart = label ? `(${encodeURIComponent(label)})` : '';

  if (coordinates) {
    const { latitude: lat, longitude: lng } = coordinates;
    if (Platform.OS === 'android') {
      // Google's universal directions URL — opens Google Maps directly when installed,
      // shows the route preview with a Start button (does NOT auto-start navigation).
      out.push(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
      );
      // Last-resort fallback: drop a pin in whichever maps app handles geo:
      out.push(`geo:${lat},${lng}?q=${lat},${lng}${labelPart}`);
    } else if (iosApp === 'apple') {
      // Apple Maps with driving directions; user taps GO to start.
      out.push(`maps://?daddr=${lat},${lng}&dirflg=d`);
      out.push(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
      );
    } else {
      // Google Maps on iOS — directions preview, user starts navigation manually.
      out.push(`comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`);
      out.push(`maps://?daddr=${lat},${lng}&dirflg=d`);
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
    } else if (iosApp === 'apple') {
      out.push(`maps://?daddr=${q}&dirflg=d`);
      out.push(
        `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`
      );
    } else {
      out.push(`comgooglemaps://?daddr=${q}&directionsmode=driving`);
      out.push(`maps://?daddr=${q}&dirflg=d`);
      out.push(
        `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`
      );
    }
  }
  return out;
}

export async function openExternalNavigation(
  target: NavigateTarget,
  iosApp?: IosMapsApp
): Promise<void> {
  if (!target.coordinates && !target.address) {
    throw new Error('openExternalNavigation: no coordinates or address provided');
  }
  const urls = buildCandidateUrls(target, iosApp);
  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return;
    } catch {
      // Try next candidate
    }
  }
}
