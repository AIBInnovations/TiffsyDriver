import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DeliveriesStackParamList } from "./types";
import DeliveriesScreen from "../screens/deliveries/DeliveriesScreen";
import DeliveryDetailScreen from "../screens/deliveries/DeliveryDetailScreen";

const Stack = createNativeStackNavigator<DeliveriesStackParamList>();

export default function DeliveryStackNavigator() {
  return (
    <Stack.Navigator
      id="DeliveryStack"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="DeliveriesList" component={DeliveriesScreen} />
      <Stack.Screen name="DeliveryDetail" component={DeliveryDetailScreen} />
    </Stack.Navigator>
  );
}
