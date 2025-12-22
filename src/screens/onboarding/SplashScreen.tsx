import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { CommonActions } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { RootStackParamList } from "../../navigation/types";

export default function SplashScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleGetStarted = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Auth" }],
      })
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#F56B4C" />

      {/* Watermark Background Icon */}
      <View style={styles.watermarkContainer}>
        <View style={styles.watermark}>
          <View style={styles.watermarkBag}>
            <View style={styles.watermarkHandle} />
            <View style={styles.watermarkBody}>
              <Text style={styles.watermarkFace}>☺</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <View style={styles.logoCloche}>
              <View style={styles.clocheTop} />
              <View style={styles.clocheBody}>
                <View style={styles.robotFace}>
                  <View style={styles.antenna} />
                  <View style={styles.eyesContainer}>
                    <View style={styles.eye} />
                    <View style={styles.eye} />
                  </View>
                </View>
              </View>
            </View>
          </View>
          <Text style={styles.logoText}>LOGO</Text>
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>Order  •  Eat  •  Enjoy</Text>
      </View>

      {/* Get Started Button */}
      <SafeAreaView edges={['bottom']} style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleGetStarted}
          activeOpacity={0.9}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <View style={styles.arrowCircle}>
            <Text style={styles.arrowIcon}>→</Text>
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F56B4C",
  },
  watermarkContainer: {
    position: 'absolute',
    top: -20,
    left: -40,
    opacity: 0.15,
  },
  watermark: {
    width: 200,
    height: 200,
  },
  watermarkBag: {
    width: 180,
    height: 180,
  },
  watermarkHandle: {
    width: 60,
    height: 30,
    borderWidth: 12,
    borderColor: 'white',
    borderBottomWidth: 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginLeft: 60,
  },
  watermarkBody: {
    width: 180,
    height: 140,
    backgroundColor: 'transparent',
    borderWidth: 12,
    borderColor: 'white',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermarkFace: {
    fontSize: 60,
    color: 'white',
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    marginRight: 12,
  },
  logoCloche: {
    alignItems: 'center',
  },
  clocheTop: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginBottom: -2,
  },
  clocheBody: {
    width: 44,
    height: 32,
    backgroundColor: 'white',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  robotFace: {
    alignItems: 'center',
  },
  antenna: {
    width: 4,
    height: 6,
    backgroundColor: '#F56B4C',
    borderRadius: 2,
    marginBottom: 2,
  },
  eyesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  eye: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F56B4C',
  },
  logoText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
    letterSpacing: 1,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  button: {
    backgroundColor: "#ffffff",
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    flex: 1,
    textAlign: 'center',
    marginLeft: 40,
  },
  arrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F56B4C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    fontSize: 20,
    color: 'white',
    fontWeight: '600',
  },
});