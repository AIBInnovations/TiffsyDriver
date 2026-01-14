import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthStackParamList } from "./types";
import LoginScreen from "../screens/auth/LoginScreen";
import OtpVerifyScreen from "../screens/auth/OtpVerifyScreen";
import RoleSelectionScreen from "../screens/auth/RoleSelectionScreen";
import DriverRegistrationScreen from "../screens/auth/DriverRegistrationScreen";
import ProfileOnboardingScreen from "../screens/auth/ProfileOnboardingScreen";
import ApprovalWaitingScreen from "../screens/auth/ApprovalWaitingScreen";
import RejectionScreen from "../screens/auth/RejectionScreen";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator
      id="AuthStack"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="DriverRegistration" component={DriverRegistrationScreen} />
      <Stack.Screen name="ProfileOnboarding" component={ProfileOnboardingScreen} />
      <Stack.Screen name="ApprovalWaiting" component={ApprovalWaitingScreen} />
      <Stack.Screen name="Rejection" component={RejectionScreen} />
    </Stack.Navigator>
  );
}
