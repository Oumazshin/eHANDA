import React, { memo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";

// Import with fallback defaults
let COLORS, SIZES, SHADOWS;
try {
  const theme = require("../styles/theme");
  COLORS = theme.COLORS || { white: "#FFFFFF" };
  SIZES = theme.SIZES || {
    cardRadius: 8,
    cardPadding: 16,
    cardSpacing: 16,
    cardElevation: 2,
  };
  SHADOWS = theme.SHADOWS || {
    small: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
  };
} catch (e) {
  console.log("Error loading theme, using defaults");
  COLORS = { white: "#FFFFFF" };
  SIZES = { cardRadius: 8, cardPadding: 16, cardSpacing: 16, cardElevation: 2 };
  SHADOWS = {
    small: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
  };
}

const Card = ({
  children,
  style,
  shadowLevel = "small",
  onPress,
  borderRadius = SIZES.cardRadius || 8,
  padding = SIZES.cardPadding || 16,
  backgroundColor = COLORS.white || "#FFFFFF",
}) => {
  // Choose the right shadow style with fallback
  const shadowStyle = (SHADOWS && SHADOWS[shadowLevel]) ||
    SHADOWS.small || {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    };

  const cardStyle = [
    styles.card,
    shadowStyle,
    {
      borderRadius,
      padding,
      backgroundColor,
    },
    style,
  ];

  // Return either a touchable card or a regular view
  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.9}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SIZES?.cardSpacing || 16,
    overflow: "hidden",
    elevation: SIZES?.cardElevation || 2,
  },
});

export default memo(Card);
