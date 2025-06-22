import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Animated,
  StatusBar,
} from "react-native";
// Use the safe platform utils
import { getPlatformValue } from "../utils/platformUtils";
import AppButton from "../components/AppButton";
import { COLORS, SIZES, FONTS, LAYOUT } from "../styles/theme";
import { Ionicons } from "@expo/vector-icons";
// Import safe layout helpers
import { SafeLayout } from "../utils/layoutHelpers";

// Define LAYOUT for use in this component
const LOCAL_LAYOUT = {
  row: { flexDirection: "row", alignItems: "center" },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  center: { justifyContent: "center", alignItems: "center" },
  fill: { flex: 1 },
  columnCenter: {
    justifyContent: "center",
    alignItems: "center",
  },
  rowCenter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
};

// Use getPlatformValue instead of direct Platform.OS checks
const systemFont = getPlatformValue("System", "Roboto");

const { width, height } = Dimensions.get("window");

// Fallback values for theme properties
const h1 = SIZES?.h1 || 30;
const h3 = SIZES?.h3 || 20;
const body1 = SIZES?.body1 || 16;
const body2 = SIZES?.body2 || 14;
const body3 = SIZES?.body3 || 12;
const xs = SIZES?.xs || 4;
const sm = SIZES?.sm || 8;
const md = SIZES?.md || 16;
const lg = SIZES?.lg || 24;
const xl = SIZES?.xl || 32;
const xxl = SIZES?.xxl || 40;
const screenHorizontalPadding = SIZES?.padding || 16;
const buttonHeight = SIZES?.buttonHeight || 48;

const WelcomeScreen = ({ navigation }) => {
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeInButtons = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Splash screen animation sequence
    const timer = setTimeout(() => {
      Animated.sequence([
        // Fade out splash screen
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSplash(false);

        // After splash is gone, animate welcome screen elements
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(fadeInButtons, {
            toValue: 1,
            duration: 900,
            delay: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Splash Screen UI
  if (showSplash) {
    return (
      <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <Image
          source={require("../assets/EHandaLogo.png")}
          style={styles.splashLogo}
          resizeMode="contain"
        />
        <Text style={styles.splashTitle}>eHANDA</Text>
        <Text style={styles.splashSubtitle}>
          Evacuation & Hazard Navigation Digital Assistant
        </Text>

        <View style={styles.loadingIndicator}>
          <Animated.View
            style={[
              styles.loadingBar,
              {
                transform: [{ scaleX: progressAnim }],
                transformOrigin: "left",
              },
            ]}
          />
        </View>
      </Animated.View>
    );
  }

  // Animation interpolations
  const logoTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  const textTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  // Main Welcome Screen UI
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.content}>
        {/* Logo Section */}
        <Animated.View
          style={[
            styles.logoSection,
            {
              transform: [{ translateY: logoTranslateY }],
              opacity: slideAnim,
            },
          ]}
        >
          <Image
            source={require("../assets/EHandaLogo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>eHANDA</Text>
        </Animated.View>

        {/* Text Section */}
        <Animated.View
          style={[
            styles.textSection,
            {
              transform: [{ translateY: textTranslateY }],
              opacity: slideAnim,
            },
          ]}
        >
          <Text style={styles.subtitle}>
            Your Digital Companion for Emergency Evacuations
          </Text>
          <Text style={styles.description}>
            Find safe routes, prepare for emergencies, and stay connected with
            essential services during disasters.
          </Text>
        </Animated.View>

        {/* Buttons Section */}
        <Animated.View
          style={[styles.buttonContainer, { opacity: fadeInButtons }]}
        >
          <AppButton
            title="Sign In"
            onPress={() => navigation.navigate("Login")}
            fullWidth
            style={styles.button}
            icon="log-in-outline"
            iconPosition="right"
          />

          <AppButton
            title="Create Account"
            type="outline"
            onPress={() => navigation.navigate("Register")}
            fullWidth
            style={styles.button}
            icon="person-add-outline"
            iconPosition="right"
          />

          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => navigation.navigate("MainApp")}
          >
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Splash screen styles
  splashContainer: {
    ...LAYOUT.fill,
    ...LAYOUT.center,
    backgroundColor: COLORS.primary,
  },
  splashLogo: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: lg,
  },
  splashTitle: {
    fontSize: 36, // Intentionally larger than standard
    color: COLORS.white,
    marginBottom: xs,
    fontWeight: "800",
  },
  splashSubtitle: {
    fontSize: 14, // Direct value instead of FONTS.body2
    color: COLORS.white,
    textAlign: "center",
    paddingHorizontal: screenHorizontalPadding * 2,
    opacity: 0.9,
  },
  loadingIndicator: {
    position: "absolute",
    bottom: xxl + lg,
    width: width * 0.7,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  loadingBar: {
    height: "100%",
    backgroundColor: COLORS.white,
  },

  // Welcome screen styles
  container: {
    ...LAYOUT.fill,
    backgroundColor: COLORS?.white || "#FFFFFF",
  },
  content: {
    ...LAYOUT.fill,
    ...LAYOUT.center,
    paddingHorizontal: screenHorizontalPadding,
  },
  logoSection: {
    ...LAYOUT.columnCenter,
    marginBottom: xl,
  },
  textSection: {
    ...LAYOUT.columnCenter,
    marginBottom: xxl,
  },
  logo: {
    width: width * 0.35,
    height: width * 0.35,
    marginBottom: md,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: FONTS?.h3?.fontSize || 20,
    fontWeight: FONTS?.h3?.fontWeight || "bold",
    color: COLORS.textDark,
    textAlign: "center",
    marginBottom: lg,
    lineHeight: 30,
  },
  description: {
    fontSize: FONTS?.body1?.fontSize || 16,
    color: COLORS.textMedium,
    textAlign: "center",
    marginBottom: xl,
    lineHeight: 24,
  },
  buttonContainer: {
    width: "100%",
    marginTop: lg,
  },
  button: {
    marginBottom: md,
    height: buttonHeight,
  },
  guestButton: {
    paddingVertical: md,
    ...LAYOUT.rowCenter,
  },
  guestButtonText: {
    fontSize: FONTS?.body2?.fontSize || 14,
    fontWeight: "600",
    color: COLORS.primary,
    marginRight: xs / 2,
  },
});

export default WelcomeScreen;
