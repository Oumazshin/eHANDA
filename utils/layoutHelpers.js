import { Platform, StatusBar, Dimensions } from "react-native";
import { COLORS } from "../styles/theme";

const { width, height } = Dimensions.get("window");

const isIOS = Platform.OS === "ios";
const isAndroid = Platform.OS === "android";

// iOS notch detection (approximate)
const isIPhoneX = isIOS && (height >= 812 || width >= 812);

export const SafeLayout = {
  topInset: isIPhoneX ? 44 : isIOS ? 20 : StatusBar.currentHeight,
  bottomInset: isIPhoneX ? 34 : 0,
  screenWidth: width,
  screenHeight: height,
  safeWidth: width - 32, // common safe area
  safeHeight:
    height - (isIPhoneX ? 78 : isIOS ? 20 : StatusBar.currentHeight || 0),
  isIPhoneX,
  isIOS,
  isAndroid,
};

export const getSafeAreaInsets = () => {
  return {
    top: SafeLayout.topInset,
    bottom: SafeLayout.bottomInset,
    left: 0,
    right: 0,
  };
};

export const getStatusBarHeight = () => {
  return isIOS ? (isIPhoneX ? 44 : 20) : StatusBar.currentHeight || 0;
};

/**
 * Safe layout helpers to handle different platforms and screen areas
 */
export const SafeLayoutHelpers = {
  fill: {
    flex: 1,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  safeTop: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS?.background || "#F9FAFB",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  rowCenter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
};

export default SafeLayoutHelpers;
