import React, { memo } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES, SHADOWS } from "../styles/theme";

const AppButton = ({
  title,
  onPress,
  type = "primary",
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = "left",
  style = {},
  textStyle = {},
  fullWidth = false,
  size = "default",
}) => {
  // Button type styles
  const buttonTypeStyle = {
    primary: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
    },
    secondary: {
      backgroundColor: COLORS.secondary,
      borderColor: COLORS.secondary,
    },
    success: {
      backgroundColor: COLORS.success,
      borderColor: COLORS.success,
    },
    danger: {
      backgroundColor: COLORS.danger,
      borderColor: COLORS.danger,
    },
    warning: {
      backgroundColor: COLORS.warning,
      borderColor: COLORS.warning,
    },
    outline: {
      backgroundColor: "transparent",
      borderColor: COLORS.primary,
      borderWidth: 1,
    },
    ghost: {
      backgroundColor: "transparent",
      borderColor: "transparent",
    },
  };

  // Button text colors
  const textColor = {
    primary: COLORS.white,
    secondary: COLORS.white,
    success: COLORS.white,
    danger: COLORS.white,
    warning: COLORS.textDark,
    outline: COLORS.primary,
    ghost: COLORS.primary,
  };

  // Button sizes
  const buttonSize = {
    small: {
      paddingVertical: SIZES?.xs || 4,
      paddingHorizontal: SIZES?.md || 16,
      minHeight: 36,
    },
    default: {
      paddingVertical: SIZES?.sm || 8,
      paddingHorizontal: SIZES?.lg || 24,
      minHeight: SIZES?.buttonHeight || 48,
    },
    large: {
      paddingVertical: SIZES?.md || 16,
      paddingHorizontal: SIZES?.xl || 32,
      minHeight: 56,
    },
  };

  // Icon sizes
  const iconSize = {
    small: 16,
    default: 20,
    large: 24,
  };

  // Apply disabled styles
  const disabledStyle = disabled || loading ? { opacity: 0.6 } : {};

  // Icon component
  const IconComponent = icon ? (
    <Ionicons
      name={icon}
      size={iconSize[size]}
      color={textColor[type]}
      style={iconPosition === "left" ? styles.iconLeft : styles.iconRight}
    />
  ) : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        buttonTypeStyle[type],
        buttonSize[size],
        fullWidth && styles.fullWidth,
        disabledStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={textColor[type]}
          size="small"
          style={styles.loader}
        />
      ) : (
        <View style={styles.contentContainer}>
          {icon && iconPosition === "left" && IconComponent}
          <Text
            style={[
              styles.text,
              { color: textColor[type] },
              FONTS?.button || {},
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === "right" && IconComponent}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: SIZES?.borderRadius || 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    ...(SHADOWS?.small || {}),
  },
  fullWidth: {
    width: "100%",
  },
  text: {
    textAlign: "center",
    fontWeight: "600",
  },
  iconLeft: {
    marginRight: SIZES?.xs || 4,
  },
  iconRight: {
    marginLeft: SIZES?.xs || 4,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loader: {
    marginHorizontal: SIZES?.xs || 4,
  },
});

export default memo(AppButton);
