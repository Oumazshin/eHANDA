import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import ErrorBoundary from "./components/ErrorBoundary";

// Import screens directly without lazy loading for better stability
import HomeScreen from "./screens/HomeScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import LocationScreen from "./screens/LocationScreen";
import ChecklistScreen from "./screens/ChecklistScreen";
import ContactsScreen from "./screens/ContactsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import EditProfileScreen from "./screens/EditProfileScreen";

// Create stacks
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Updated color palette
const BASE_COLORS = {
  primary: "#2C365A", // Deep Ocean - main accent color
  secondary: "#C4BCB0", // Beige - secondary accent
  background: "#EEE8DF", // Cream - background color
  white: "#FFFFFF", // Pure white - for contrast elements
  textDark: "#1F2937", // Dark text - slightly softened from pure black
  textLight: "#A9A195", // Lighter text - derived from beige
  border: "#D8D3C9", // Lighter cream - subtle borders
  divider: "#F2EDE7", // Very light cream - subtle dividers
  error: "#9A3F41", // Muted red - for errors and warnings
};

// Tab configuration
const TAB_ICONS = {
  Home: {
    active: "home",
    inactive: "home-outline",
  },
  Location: {
    active: "map",
    inactive: "map-outline",
  },
  Profile: {
    active: "person",
    inactive: "person-outline",
  },
};

// Refined shadow style for minimalist look
const BASE_SHADOW = {
  shadowColor: "#2C365A", // Using primary color for shadow
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08, // Subtle shadow
  shadowRadius: 4,
  elevation: 4,
};

// Optimized tab bar height
const TAB_BAR_HEIGHT = 85;

// Custom TabIcon component with animations
function TabIcon({ focused, iconName, color }) {
  // Create animations for scale and opacity
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(0.8)).current;

  // Run animation when focus state changes
  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.1 : 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <Animated.View
      style={{
        alignItems: "center",
        justifyContent: "center",
        height: 46,
        paddingBottom: 4,
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }}
    >
      <Ionicons name={iconName} size={24} color={color} />
    </Animated.View>
  );
}

// Enhanced minimalist tab navigation
function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      backBehavior="initialRoute"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          const { active, inactive } = TAB_ICONS[route.name] || {
            active: "help",
            inactive: "help-outline",
          };
          const iconName = focused ? active : inactive;

          // Use custom animated tab icon
          return (
            <TabIcon focused={focused} iconName={iconName} color={color} />
          );
        },
        tabBarActiveTintColor: BASE_COLORS.primary,
        tabBarInactiveTintColor: BASE_COLORS.textLight,
        // Minimalist tab bar style
        tabBarStyle: {
          height: TAB_BAR_HEIGHT,
          paddingTop: 1,
          paddingBottom: 42,
          backgroundColor: BASE_COLORS.white,
          borderTopColor: "transparent",
          ...BASE_SHADOW,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          overflow: "hidden",
        },
        // Clean, minimal label style
        tabBarLabelStyle: {
          fontWeight: "500",
          fontSize: 11,
          marginTop: 1,
          marginBottom: 10,
          letterSpacing: 0.2,
        },
        tabBarItemStyle: {
          height: 54,
          paddingVertical: 6,
          paddingBottom: 8,
          justifyContent: "center",
        },
        // Smooth spring animation for tab transitions
        tabBarAnimation: {
          type: "spring",
          config: {
            stiffness: 800,
            damping: 50,
            mass: 1.5,
            overshootClamping: false,
            restDisplacementThreshold: 0.01,
            restSpeedThreshold: 0.01,
          },
        },
        // Performance optimizations
        detachPreviousScreen: true,
        freezeOnBlur: true,
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
          headerShown: false,
          tabBarAccessibilityLabel: "Home Screen",
        }}
      />
      <Tab.Screen
        name="Location"
        component={LocationScreenWrapper} // Use the wrapper instead
        options={{
          title: "Routes",
          tabBarAccessibilityLabel: "Find safe evacuation routes",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarAccessibilityLabel: "Your profile and settings",
        }}
      />
    </Tab.Navigator>
  );
}

// Loading component
const Loading = () => (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: BASE_COLORS.background,
    }}
  >
    <Text style={{ color: BASE_COLORS.primary }}>Loading...</Text>
  </View>
);

// Define a safe navigation theme with updated colors
const SAFE_THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: BASE_COLORS.primary,
    background: BASE_COLORS.background,
    card: BASE_COLORS.white,
    text: BASE_COLORS.textDark,
    border: BASE_COLORS.border,
    notification: BASE_COLORS.error,
  },
};

// Main App component
function AppContainer() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={SAFE_THEME}>
        <StatusBar style="dark" />
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: BASE_COLORS.background },
            headerStyle: {
              backgroundColor: BASE_COLORS.white,
              height: 56,
              ...BASE_SHADOW,
            },
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: "600",
              color: BASE_COLORS.textDark,
            },
            headerTintColor: BASE_COLORS.primary,
            headerBackTitleVisible: false,
            headerShadowVisible: false,
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MainApp"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{
              headerShown: true,
              title: "Edit Profile",
              headerBackTitle: "Back",
            }}
          />
          <Stack.Screen
            name="Checklist"
            component={ChecklistScreen}
            options={{
              headerShown: true,
              title: "Preparation Checklist",
              headerBackTitle: "Home",
            }}
          />
          <Stack.Screen
            name="Contacts"
            component={ContactsScreen}
            options={{
              headerShown: true,
              title: "Emergency Contacts",
              headerBackTitle: "Home",
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// In your App.js file:

// 1. Create a wrapper component in case there's an issue with the original
const LocationScreenWrapper = (props) => {
  try {
    // Safely render the component, with error catching
    return <LocationScreen {...props} />;
  } catch (error) {
    // Fallback UI if there's an error
    console.error("Error rendering LocationScreen:", error);
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text>There was an error loading this screen.</Text>
        <Text style={{ color: "red" }}>{error.message}</Text>
      </View>
    );
  }
};

// Main App wrapper with error boundary
export default function App() {
  return (
    <ErrorBoundary>
      <AppContainer />
    </ErrorBoundary>
  );
}
