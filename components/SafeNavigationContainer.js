import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Platform, Text } from "react-native"; // Add Platform import

// Theme import
import { COLORS, FONTS } from "../styles/theme";

const defaultTheme = {
  colors: {
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.card,
    text: COLORS.textDark,
    border: COLORS.border,
    notification: COLORS.secondary,
  },
  dark: false,
  fonts: {
    regular: {
      fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
      fontWeight: "normal",
    },
    medium: {
      fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
      fontWeight: "500",
    },
    light: {
      fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
      fontWeight: "300",
    },
    thin: {
      fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
      fontWeight: "100",
    },
  },
};

const SafeNavigationContainer = ({ children, theme = defaultTheme }) => {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={theme} fallback={<Text>Loading...</Text>}>
        <StatusBar style="auto" />
        {children}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default SafeNavigationContainer;
