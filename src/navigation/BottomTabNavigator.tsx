import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MainTabsParamList } from "./types";
import DashboardStackNavigator from "./DashboardStackNavigator";
import DeliveryStackNavigator from "./DeliveryStackNavigator";
import DeliveryStatusScreen from "../screens/delivery-status/DeliveryStatusScreen";
import ProfileStackNavigator from "./ProfileStackNavigator";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const Tab = createBottomTabNavigator<MainTabsParamList>();

export default function BottomTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      id="BottomTabs"
      screenOptions={{
        headerShown: false,
        tabBarShadowVisible: false,
        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: '#ffffff' }} />
        ),
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          height: 56 + insets.bottom,
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#6b7280",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStackNavigator}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "home" : "home-outline"}
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Deliveries"
        component={DeliveryStackNavigator}
        options={{
          tabBarLabel: "Deliveries",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "package-variant" : "package-variant-closed"}
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="DeliveryStatus"
        component={DeliveryStatusScreen}
        options={{
          tabBarLabel: "Status",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "clipboard-check" : "clipboard-check-outline"}
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "account" : "account-outline"}
              size={28}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
