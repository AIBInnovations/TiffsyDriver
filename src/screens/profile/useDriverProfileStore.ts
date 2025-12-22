import { useEffect, useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Enums
export type VehicleType = "BIKE" | "SCOOTER" | "CAR";
export type Language = "EN" | "HI";
export type AvailabilityStatus = "ONLINE" | "OFFLINE";
export type ThemeMode = "SYSTEM" | "LIGHT" | "DARK";

// Types
export interface NotificationPrefs {
  newAssignment: boolean;
  batchUpdates: boolean;
  promotions: boolean;
}

export interface AppSettings {
  darkMode: ThemeMode;
  haptics: boolean;
  compactMode: boolean;
}

export interface UIFlags {
  hasSeenProfileTour: boolean;
}

export interface DriverProfile {
  driverId: string;
  fullName: string;
  phone: string;
  email: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  preferredLanguage: Language;
  notificationPrefs: NotificationPrefs;
  availabilityStatus: AvailabilityStatus;
  appSettings: AppSettings;
  lastSyncedAt: string;
  uiFlags: UIFlags;
}

// Storage key
const STORAGE_KEY = "@driver_profile";

// Default profile
const defaultProfile: DriverProfile = {
  driverId: "DRV-TF-2024-001",
  fullName: "Rahul Sharma",
  phone: "+91 98765 43210",
  email: "",
  vehicleType: "BIKE",
  vehicleNumber: "MH 12 AB 1234",
  preferredLanguage: "EN",
  notificationPrefs: {
    newAssignment: true,
    batchUpdates: true,
    promotions: false,
  },
  availabilityStatus: "OFFLINE",
  appSettings: {
    darkMode: "SYSTEM",
    haptics: true,
    compactMode: false,
  },
  lastSyncedAt: new Date().toISOString(),
  uiFlags: {
    hasSeenProfileTour: false,
  },
};

// Global store state
interface StoreState {
  profile: DriverProfile;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  isSaving: boolean;
}

let globalState: StoreState = {
  profile: defaultProfile,
  isLoading: true,
  isHydrated: false,
  error: null,
  isSaving: false,
};

// Listeners for state changes
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function getSnapshot(): StoreState {
  return globalState;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Persist profile to storage
async function persistProfile(newProfile: DriverProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
  } catch (e) {
    throw new Error("Failed to save profile locally");
  }
}

// Hydrate from storage
async function hydrateProfile(): Promise<void> {
  try {
    globalState = { ...globalState, isLoading: true, error: null };
    notifyListeners();

    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as DriverProfile;
      globalState = {
        ...globalState,
        profile: { ...defaultProfile, ...parsed },
        isHydrated: true,
        isLoading: false,
      };
    } else {
      globalState = {
        ...globalState,
        isHydrated: true,
        isLoading: false,
      };
    }
    notifyListeners();
  } catch (e) {
    globalState = {
      ...globalState,
      error: "Failed to load profile data",
      isLoading: false,
    };
    notifyListeners();
    console.error("Profile hydration error:", e);
  }
}

// Initialize hydration
let hydrationPromise: Promise<void> | null = null;
function ensureHydrated(): Promise<void> {
  if (!hydrationPromise) {
    hydrationPromise = hydrateProfile();
  }
  return hydrationPromise;
}

// Store actions
async function updateProfile(updates: Partial<DriverProfile>): Promise<void> {
  globalState = { ...globalState, isSaving: true };
  notifyListeners();

  try {
    const newProfile = {
      ...globalState.profile,
      ...updates,
      lastSyncedAt: new Date().toISOString(),
    };
    await persistProfile(newProfile);
    globalState = { ...globalState, profile: newProfile, isSaving: false };
    notifyListeners();
  } catch (e) {
    globalState = { ...globalState, isSaving: false };
    notifyListeners();
    throw e;
  }
}

async function updateNotificationPrefs(prefs: Partial<NotificationPrefs>): Promise<void> {
  const newPrefs = { ...globalState.profile.notificationPrefs, ...prefs };
  await updateProfile({ notificationPrefs: newPrefs });
}

async function updateAppSettings(settings: Partial<AppSettings>): Promise<void> {
  const newSettings = { ...globalState.profile.appSettings, ...settings };
  await updateProfile({ appSettings: newSettings });
}

async function setAvailabilityStatus(status: AvailabilityStatus): Promise<void> {
  await updateProfile({ availabilityStatus: status });
}

async function refresh(): Promise<void> {
  await updateProfile({ lastSyncedAt: new Date().toISOString() });
}

async function resetProfile(): Promise<void> {
  globalState = { ...globalState, isSaving: true };
  notifyListeners();

  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    globalState = { ...globalState, profile: defaultProfile, isSaving: false };
    notifyListeners();
  } catch (e) {
    globalState = { ...globalState, isSaving: false };
    notifyListeners();
  }
}

async function clearSessionData(): Promise<void> {
  globalState = { ...globalState, isSaving: true };
  notifyListeners();

  try {
    const newProfile: DriverProfile = {
      ...defaultProfile,
      appSettings: globalState.profile.appSettings,
      uiFlags: globalState.profile.uiFlags,
    };
    await persistProfile(newProfile);
    globalState = { ...globalState, profile: newProfile, isSaving: false };
    notifyListeners();
  } catch (e) {
    globalState = { ...globalState, isSaving: false };
    notifyListeners();
  }
}

async function retryHydration(): Promise<void> {
  hydrationPromise = null;
  await ensureHydrated();
}

// Hook interface
interface UseDriverProfileStore {
  profile: DriverProfile;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  isSaving: boolean;
  updateProfile: (updates: Partial<DriverProfile>) => Promise<void>;
  updateNotificationPrefs: (prefs: Partial<NotificationPrefs>) => Promise<void>;
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
  setAvailabilityStatus: (status: AvailabilityStatus) => Promise<void>;
  refresh: () => Promise<void>;
  resetProfile: () => Promise<void>;
  clearSessionData: () => Promise<void>;
  retryHydration: () => Promise<void>;
}

export function useDriverProfileStore(): UseDriverProfileStore {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Ensure hydration on first use
  useEffect(() => {
    ensureHydrated();
  }, []);

  return {
    profile: state.profile,
    isLoading: state.isLoading,
    isHydrated: state.isHydrated,
    error: state.error,
    isSaving: state.isSaving,
    updateProfile,
    updateNotificationPrefs,
    updateAppSettings,
    setAvailabilityStatus,
    refresh,
    resetProfile,
    clearSessionData,
    retryHydration,
  };
}

// Language labels
export const languageLabels: Record<Language, string> = {
  EN: "English",
  HI: "हिंदी (Hindi)",
};

// Vehicle type labels
export const vehicleTypeLabels: Record<VehicleType, string> = {
  BIKE: "Bike",
  SCOOTER: "Scooter",
  CAR: "Car",
};

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
