import "./global.css";
import { useEffect, useRef, useState } from "react";
import { StatusBar, AppState } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import RootNavigator from "./src/navigation/RootNavigator";
import { initializeFCMListeners, setupTokenRefreshListener } from "./src/services/fcmService";
import { createNotificationChannels } from "./src/services/notificationChannels";
import { clearStaleTrackingState } from "./src/services/locationService";
import ForceUpdateModal from "./src/components/ForceUpdateModal";
import { checkForUpdate, UpdateCheckResult } from "./src/services/appUpdate.service";
import { checkForOtaUpdate } from "./src/services/otaUpdate.service";

export default function App() {
  const navigationRef = useRef<any>(null);

  // Force/soft update gate. Fail-open: a backend error leaves the app usable.
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [softDismissed, setSoftDismissed] = useState(false);

  const runUpdateCheck = async () => {
    try {
      const result = await checkForUpdate();
      setUpdateInfo(result);
      if (result.status === "required") setSoftDismissed(false);
    } catch (err: any) {
      console.log("[App] update check failed (non-blocking):", err?.message);
    }
  };

  // Run on launch and whenever the app returns to the foreground.
  useEffect(() => {
    runUpdateCheck();
    // OTA JS-bundle check (silent; applies on next launch). Fail-open.
    checkForOtaUpdate();
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") runUpdateCheck();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    // Initialize notification system
    const initializeNotifications = async () => {
      console.log("🚀 Initializing notification system...");

      // Create notification channels for Android
      await createNotificationChannels();

      // Wipe any "should be tracking" flag left over from a previous crash so we
      // don't auto-retry the foreground service from a cold-boot context.
      await clearStaleTrackingState();

      // Set up foreground, background, and notification opened listeners
      const unsubscribeFCM = initializeFCMListeners(navigationRef.current);

      // Set up FCM token refresh listener
      const unsubscribeTokenRefresh = setupTokenRefreshListener();

      console.log("✅ Notification system initialized");

      // Return cleanup function
      return () => {
        unsubscribeFCM();
        unsubscribeTokenRefresh();
        console.log("🧹 Notification listeners cleaned up");
      };
    };

    // Initialize and store cleanup function
    let cleanup: (() => void) | undefined;
    initializeNotifications().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    // Cleanup on unmount
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
      {updateInfo &&
        updateInfo.status !== "none" &&
        !(updateInfo.status === "available" && softDismissed) && (
          <ForceUpdateModal
            visible
            mode={updateInfo.status === "required" ? "required" : "available"}
            message={updateInfo.message}
            storeUrl={updateInfo.storeUrl}
            onDismiss={() => setSoftDismissed(true)}
          />
        )}
    </GestureHandlerRootView>
  );
}
