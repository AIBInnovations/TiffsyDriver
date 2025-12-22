import "./global.css";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";
import { DeliveryProvider } from "./src/context/DeliveryContext";

export default function App() {
  return (
    <SafeAreaProvider>
      <DeliveryProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </DeliveryProvider>
    </SafeAreaProvider>
  );
}
