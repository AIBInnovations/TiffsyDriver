import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthStackParamList } from "./types";
import LoginScreen from "../screens/auth/LoginScreen";
import OtpVerifyScreen from "../screens/auth/OtpVerifyScreen";
import DriverRegistrationScreen from "../screens/auth/DriverRegistrationScreen";
import ProfileOnboardingScreen from "../screens/auth/ProfileOnboardingScreen";
import ApprovalWaitingScreen from "../screens/auth/ApprovalWaitingScreen";
import RejectionScreen from "../screens/auth/RejectionScreen";
import { getAuthBootstrap } from "./authBootstrap";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  const bootstrap = getAuthBootstrap();

  return (
    <Stack.Navigator
      id="AuthStack"
      initialRouteName={bootstrap.initialRoute}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
      <Stack.Screen name="DriverRegistration" component={DriverRegistrationScreen} />
      <Stack.Screen
        name="ProfileOnboarding"
        component={ProfileOnboardingScreen}
        initialParams={bootstrap.initialRoute === "ProfileOnboarding" ? bootstrap.params : undefined}
      />
      <Stack.Screen
        name="ApprovalWaiting"
        component={ApprovalWaitingScreen}
        initialParams={bootstrap.initialRoute === "ApprovalWaiting" ? bootstrap.params : undefined}
      />
      <Stack.Screen
        name="Rejection"
        component={RejectionScreen}
        initialParams={bootstrap.initialRoute === "Rejection" ? bootstrap.params : undefined}
      />
    </Stack.Navigator>
  );
}
