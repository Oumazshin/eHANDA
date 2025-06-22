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

// Constant styles and configurations that don't rely on theme
const BASE_COLORS = {
  primary: "#2563EB",
  background: "#F9FAFB",
  white: "#FFFFFF",
  textDark: "#111827",
  textLight: "#9CA3AF",
  border: "#E5E7EB",
  divider: "#F3F4F6",
  secondary: "#F59E0B",
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
  shadowColor: "#000",
  shadowOffset: { width: 0, height: -1 }, // More subtle shadow direction
  shadowOpacity: 0.04, // Reduced opacity for minimalist feel
  shadowRadius: 4,
  elevation: 4,
};

// Optimized tab bar height
const TAB_BAR_HEIGHT = 85; // Increased from 80 to 88 for more space

// Custom TabIcon component with animations - increased vertical padding
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
        height: 46, // Increased from 42 to 46
        paddingBottom: 4, // Added bottom padding
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
          paddingBottom: 42, // Increased from 38 to 42 for more space at bottom
          backgroundColor: BASE_COLORS.white,
          borderTopColor: "transparent", // Hide border for cleaner look
          ...BASE_SHADOW,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          borderTopLeftRadius: 24, // Slightly larger radius for modern feel
          borderTopRightRadius: 24,
          overflow: "hidden",
        },
        // Clean, minimal label style
        tabBarLabelStyle: {
          fontWeight: "500", // Slightly lighter for minimalist look
          fontSize: 11, // Smaller for cleaner appearance
          marginTop: 1,
          marginBottom: 10, // Increased from 8 to 10
          letterSpacing: 0.2, // Subtle letter spacing for modern typography
        },
        tabBarItemStyle: {
          height: 54, // Increased from 50 to 54
          paddingVertical: 6, // Increased from 4 to 6
          paddingBottom: 8, // Added explicit bottom padding
          justifyContent: "center",
        },
        // Smooth spring animation for tab transitions
        tabBarAnimation: {
          type: "spring",
          config: {
            stiffness: 800, // Slightly reduced for smoother feel
            damping: 50,
            mass: 1.5, // Reduced mass for lighter feel
            overshootClamping: false, // Allow slight overshoot for natural feel
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
        component={LocationScreen}
        options={{
          title: "Routes", // Shortened for minimalist look
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
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text>Loading...</Text>
  </View>
);

// Define a safe navigation theme that doesn't use custom fonts
const SAFE_THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: BASE_COLORS.primary,
    background: BASE_COLORS.background,
    card: BASE_COLORS.white,
    text: BASE_COLORS.textDark,
    border: BASE_COLORS.border,
    notification: BASE_COLORS.secondary,
  },
};

// Main App component - renamed to AppContainer
function AppContainer() {
  // Skip any state or effects for now to troubleshoot the font issue
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={SAFE_THEME}>
        <StatusBar style="auto" />
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
              // DO NOT add fontFamily here
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

// Main App wrapper with error boundary
export default function App() {
  return (
    <ErrorBoundary>
      <AppContainer />
    </ErrorBoundary>
  );
}
