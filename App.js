import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
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

// Base shadow style
const BASE_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 2,
  elevation: 2,
};

// Tab navigation
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const { active, inactive } = TAB_ICONS[route.name] || {
            active: "help",
            inactive: "help-outline",
          };
          const iconName = focused ? active : inactive;
          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: BASE_COLORS.primary,
        tabBarInactiveTintColor: BASE_COLORS.textLight,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: BASE_COLORS.white,
          borderTopWidth: 1,
          borderTopColor: BASE_COLORS.divider,
          ...BASE_SHADOW,
        },
        tabBarLabelStyle: {
          fontWeight: "500",
          fontSize: 10,
          marginTop: -4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Location"
        component={LocationScreen}
        options={{
          title: "Find Route",
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
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
