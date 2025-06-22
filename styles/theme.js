// Basic theme configuration for eHANDA app
import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

// Colors
export const COLORS = {
  primary: "#2563EB",
  secondary: "#F59E0B",
  background: "#F9FAFB",
  white: "#FFFFFF",
  black: "#000000",
  textDark: "#111827",
  textLight: "#9CA3AF",
  textMuted: "#6B7280",
  textMedium: "#4B5563",
  border: "#E5E7EB",
  divider: "#F3F4F6",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
};

// Font sizes
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Fonts - using only system fonts without custom fontFamily references
export const FONTS = {
  h1: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: "bold",
  },
  h2: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: "bold",
  },
  h3: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "bold",
  },
  h4: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "bold",
  },
  body1: {
    fontSize: FONT_SIZES.md,
  },
  body2: {
    fontSize: FONT_SIZES.sm,
  },
  body3: {
    fontSize: FONT_SIZES.xs,
  },
};

// Sizes for spacing, border radius, etc.
export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,

  h1: 30,
  h2: 24,
  h3: 20,
  h4: 18,
  body1: 16,
  body2: 14,
  body3: 12,

  borderRadius: 8,
  cardRadius: 12,
  buttonHeight: 48,
  padding: 16,

  // New sizes for tab bar
  tabBarHeight: 56, // Match the height defined in MainTabs
  tabBarPadding: 16, // Extra padding for bottom content
  screenPadding: 24, // General screen padding
};

// Common shadows
export const SHADOWS = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
};

// Common layout styles
export const LAYOUT = {
  fill: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  columnCenter: {
    alignItems: "center",
  },
  absolute: {
    position: "absolute",
  },
};

// Screen dimensions
export const SCREEN = {
  width,
  height,
  padding: SIZES.padding,
};

// Export everything in one default object
export default {
  COLORS,
  SIZES,
  FONTS,
  SHADOWS,
  LAYOUT,
};
