import { useEffect, useState } from "react";
import { ActivityIndicator, StatusBar, StyleSheet, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import AuthNavigator from "./AuthNavigator";
import BottomTabNavigator from "./BottomTabNavigator";
import { tokenStorage } from "../utils/tokenStorage";
import { getCurrentUser } from "../services/authService";
import { setAuthBootstrap } from "./authBootstrap";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    (async () => {
      const hasToken = await tokenStorage.hasValidToken();
      if (!hasToken) {
        setAuthBootstrap({ initialRoute: "Login" });
        setInitialRoute("Auth");
        return;
      }

      try {
        const me = await getCurrentUser();
        const user = me.data.user as any;
        const phoneNumber: string = user?.phone ?? "";
        const approvalStatus: string | undefined = user?.approvalStatus;
        const rejectionReason: string | undefined = user?.rejectionReason;
        const isProfileComplete: boolean | undefined =
          (me.data as any)?.isProfileComplete ?? user?.isProfileComplete;

        // OWNER super-role (god-mode) is allowed in alongside DRIVER; it falls
        // through to the `default` case below and lands on Main.
        if (user?.role && user.role !== "DRIVER" && user.role !== "OWNER") {
          await tokenStorage.clearAll();
          setAuthBootstrap({ initialRoute: "Login" });
          setInitialRoute("Auth");
          return;
        }

        switch (approvalStatus) {
          case "REJECTED":
            setAuthBootstrap({
              initialRoute: "Rejection",
              params: {
                phoneNumber,
                rejectionReason: rejectionReason || "No reason provided",
              },
            });
            setInitialRoute("Auth");
            return;

          case "PENDING":
            setAuthBootstrap({
              initialRoute: "ApprovalWaiting",
              params: { phoneNumber },
            });
            setInitialRoute("Auth");
            return;

          case "APPROVED":
            if (isProfileComplete === false) {
              setAuthBootstrap({
                initialRoute: "ProfileOnboarding",
                params: { phoneNumber },
              });
              setInitialRoute("Auth");
              return;
            }
            setInitialRoute("Main");
            return;

          default:
            setInitialRoute("Main");
            return;
        }
      } catch (error: any) {
        console.warn("⚠️ Auth bootstrap /auth/me failed:", error?.message);
        // Token invalid or unreachable — force re-auth so the driver can't get
        // stranded on Main without a verified approval status.
        await tokenStorage.clearAll();
        setAuthBootstrap({ initialRoute: "Login" });
        setInitialRoute("Auth");
      }
    })();
  }, []);

  if (initialRoute === null) {
    return (
      <View style={styles.bootstrap}>
        <StatusBar barStyle="light-content" backgroundColor="#FE8733" />
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      id="RootStack"
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="Main" component={BottomTabNavigator} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  bootstrap: {
    flex: 1,
    backgroundColor: "#FE8733",
    alignItems: "center",
    justifyContent: "center",
  },
});
