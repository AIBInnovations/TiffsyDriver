import "./global.css";
import { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";
import { initializeFCMListeners, setupTokenRefreshListener } from "./src/services/fcmService";

export default function App() {
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    // Initialize FCM notification listeners
    console.log("🚀 Initializing FCM listeners in App.tsx...");

    // Set up foreground, background, and notification opened listeners
    const unsubscribeForeground = initializeFCMListeners(navigationRef.current);

    // Set up FCM token refresh listener
    const unsubscribeTokenRefresh = setupTokenRefreshListener();

    // Cleanup on unmount
    return () => {
      unsubscribeForeground();
      unsubscribeTokenRefresh();
      console.log("🧹 FCM listeners cleaned up");
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
