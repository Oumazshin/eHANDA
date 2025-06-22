import { Platform } from "react-native";

/**
 * Returns a value based on the platform
 * @param {*} iosValue Value for iOS
 * @param {*} androidValue Value for Android
 * @param {*} fallback Fallback value
 * @returns {*} Platform specific value
 */
export function getPlatformValue(iosValue, androidValue, fallback = null) {
  if (Platform.OS === "ios") return iosValue;
  if (Platform.OS === "android") return androidValue;
  return fallback || androidValue;
}

/**
 * Returns a boolean indicating if the platform is iOS
 * @returns {boolean} True if iOS
 */
export function isIOS() {
  return Platform.OS === "ios";
}

/**
 * Returns a boolean indicating if the platform is Android
 * @returns {boolean} True if Android
 */
export function isAndroid() {
  return Platform.OS === "android";
}

export default {
  getPlatformValue,
  isIOS,
  isAndroid,
};
