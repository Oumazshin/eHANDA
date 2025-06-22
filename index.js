import { registerRootComponent } from "expo";
import { AppRegistry } from "react-native";
import App from "./App"; // Using App directly instead of MinimalApp

// Register with both methods for maximum compatibility
AppRegistry.registerComponent("eHANDA", () => App);
registerRootComponent(App);
