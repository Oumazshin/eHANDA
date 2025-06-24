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
import { getPlatformValue } from "../utils/platformUtils";
import AppButton from "../components/AppButton";
import { COLORS, SIZES, FONTS, LAYOUT } from "../styles/theme";
import { Ionicons } from "@expo/vector-icons";
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

  // Splash Screen UI - simplified without background patterns
  if (showSplash) {
    return (
      <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
        <StatusBar barStyle="light-content" backgroundColor="#2C365A" />

        <Image
          source={require("../assets/EHandaLogo.png")}
          style={styles.splashLogo}
          resizeMode="contain"
        />

        <Text style={styles.splashSubtitle}>
          Evacuation & Hazard Navigation Digital Assistant
        </Text>

        <View style={styles.loadingIndicator}>
          <Animated.View
            style={[
              styles.loadingBar,
              { transform: [{ scaleX: progressAnim }] },
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

  // Main Welcome Screen UI - simplified without background elements
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.content}>
        {/* Logo Section */}
        <Animated.View
          style={[
            styles.logoSection,
            { transform: [{ translateY: logoTranslateY }], opacity: slideAnim },
          ]}
        >
          <Image
            source={require("../assets/EHandaLogo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Text Section */}
        <Animated.View
          style={[
            styles.textSection,
            { transform: [{ translateY: textTranslateY }], opacity: slideAnim },
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
  // Splash screen styles - simplified
  splashContainer: {
    ...LAYOUT.fill,
    ...LAYOUT.center,
    backgroundColor: "#2C365A", // Deep Ocean primary
    position: "relative",
  },
  splashLogo: {
    width: width * 0.65,
    height: width * 0.65,
    marginBottom: md,
  },
  splashSubtitle: {
    fontSize: 16,
    color: COLORS.white,
    textAlign: "center",
    paddingHorizontal: screenHorizontalPadding * 1.5,
    opacity: 0.9,
  },
  loadingIndicator: {
    position: "absolute",
    bottom: xxl,
    width: width * 0.75,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  loadingBar: {
    height: "100%",
    backgroundColor: COLORS.white,
  },

  // Welcome screen styles - simplified
  container: {
    ...LAYOUT.fill,
    backgroundColor: "#EEE8DF", // Cream background
  },
  content: {
    ...LAYOUT.fill,
    ...LAYOUT.center,
    paddingHorizontal: screenHorizontalPadding,
    paddingTop: height * 0.02,
  },
  logoSection: {
    ...LAYOUT.columnCenter,
    marginBottom: xl,
    flex: 0.4,
  },
  textSection: {
    ...LAYOUT.columnCenter,
    marginBottom: xl,
    flex: 0.25,
  },
  logo: {
    width: width * 0.6,
    height: width * 0.6,
    marginBottom: 0,
  },
  subtitle: {
    fontSize: FONTS?.h3?.fontSize || 20,
    fontWeight: FONTS?.h3?.fontWeight || "bold",
    color: "#2C365A",
    textAlign: "center",
    marginBottom: md,
    lineHeight: 28,
  },
  description: {
    fontSize: FONTS?.body1?.fontSize || 16,
    color: "#5D6173",
    textAlign: "center",
    marginBottom: md,
    lineHeight: 22,
  },
  buttonContainer: {
    width: "100%",
    marginTop: md,
    flex: 0.35,
  },
  button: {
    marginBottom: sm,
    height: buttonHeight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  guestButton: {
    paddingVertical: sm,
    ...LAYOUT.rowCenter,
    marginTop: xs,
  },
  guestButtonText: {
    fontSize: FONTS?.body2?.fontSize || 14,
    fontWeight: "600",
    color: "#2C365A",
    marginRight: xs / 2,
  },
});

export default WelcomeScreen;
