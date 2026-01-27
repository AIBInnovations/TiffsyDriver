import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DashboardStackParamList } from "./types";
import DashboardScreen from "../screens/dashboard/DashboardScreen";
import NotificationScreen from "../screens/notifications/NotificationScreen";

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export default function DashboardStackNavigator() {
  return (
    <Stack.Navigator
      id="DashboardStack"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="DashboardMain" component={DashboardScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
    </Stack.Navigator>
  );
}
