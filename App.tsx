import "./global.css";
import { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import RootNavigator from "./src/navigation/RootNavigator";
import { initializeFCMListeners, setupTokenRefreshListener } from "./src/services/fcmService";
import { createNotificationChannels } from "./src/services/notificationChannels";

export default function App() {
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    // Initialize notification system
    const initializeNotifications = async () => {
      console.log("🚀 Initializing notification system...");

      // Create notification channels for Android
      await createNotificationChannels();

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
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
