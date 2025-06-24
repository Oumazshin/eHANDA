import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SHADOWS } from "../styles/theme";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const FOOTER_HEIGHT = 60; // Bottom tab height

const LocationScreen = ({ navigation = {} }) => {
  // Core UI state
  const [dropdownExpanded, setDropdownExpanded] = useState(false);
  const dropdownAnimation = useRef(new Animated.Value(0)).current;
  const backgroundBlurAnimation = useRef(new Animated.Value(0)).current;

  // Animation control
  useEffect(() => {
    if (dropdownExpanded) {
      Animated.parallel([
        Animated.timing(dropdownAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundBlurAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backgroundBlurAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(dropdownAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [dropdownExpanded]);

  // Toggle dropdown
  const toggleDropdown = () => setDropdownExpanded(!dropdownExpanded);
  const handleOutsidePress = () =>
    dropdownExpanded && setDropdownExpanded(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top search bar - always visible */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <View style={styles.backButtonContainer}>
              {/* Dropdown toggle button */}
              <TouchableOpacity
                style={styles.dropdownToggle}
                onPress={toggleDropdown}
              >
                <Ionicons
                  name={dropdownExpanded ? "chevron-up" : "chevron-down"}
                  size={24}
                  color="#333"
                />
              </TouchableOpacity>

              <View style={styles.searchBarWrapper}>
                {/* Start location input */}
                <TouchableOpacity style={styles.searchBarInput}>
                  <View style={styles.searchInputIcon}>
                    <Ionicons name="locate" size={20} color="#D32F2F" />
                  </View>
                  <Text style={styles.searchInputPlaceholder}>
                    Choose start location
                  </Text>
                </TouchableOpacity>

                {/* Destination input */}
                <TouchableOpacity style={styles.searchBarInput}>
                  <View style={styles.searchInputIcon}>
                    <Ionicons name="navigate" size={20} color="#333" />
                  </View>
                  <Text style={styles.searchInputPlaceholder}>
                    Choose destination
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Swap locations button */}
              <TouchableOpacity style={styles.swapButton}>
                <Ionicons name="swap-vertical" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Transportation mode options */}
            <View style={styles.transportModeContainer}>
              {/* Car option */}
              <TouchableOpacity
                style={[
                  styles.transportModeButton,
                  styles.transportModeButtonActive,
                ]}
              >
                <Ionicons name="car" size={22} color="#fff" />
              </TouchableOpacity>

              {/* Motorcycle option */}
              <TouchableOpacity style={styles.transportModeButton}>
                <Ionicons name="bicycle" size={22} color="#333" />
              </TouchableOpacity>

              {/* Walk option */}
              <TouchableOpacity style={styles.transportModeButton}>
                <Ionicons name="walk" size={22} color="#333" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Background blur that respects footer */}
        {Platform.OS === "ios" ? (
          <Animated.View
            style={[
              styles.blurContainer,
              {
                opacity: backgroundBlurAnimation,
                zIndex: dropdownExpanded ? 9 : -1,
              },
            ]}
            pointerEvents={dropdownExpanded ? "auto" : "none"}
          >
            <BlurView
              intensity={15}
              style={[StyleSheet.absoluteFill, { bottom: FOOTER_HEIGHT }]}
            />
            <TouchableWithoutFeedback onPress={handleOutsidePress}>
              <View
                style={[StyleSheet.absoluteFill, { bottom: FOOTER_HEIGHT }]}
              />
            </TouchableWithoutFeedback>
          </Animated.View>
        ) : (
          <Animated.View
            style={[
              styles.blurContainer,
              {
                backgroundColor: backgroundBlurAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["rgba(0,0,0,0)", "rgba(0,0,0,0.5)"],
                }),
                zIndex: dropdownExpanded ? 9 : -1,
              },
            ]}
            pointerEvents={dropdownExpanded ? "auto" : "none"}
          >
            <TouchableWithoutFeedback onPress={handleOutsidePress}>
              <View
                style={[StyleSheet.absoluteFill, { bottom: FOOTER_HEIGHT }]}
              />
            </TouchableWithoutFeedback>
          </Animated.View>
        )}

        {/* Dropdown panel - stops above footer */}
        <Animated.View
          style={[
            styles.dropdownPanel,
            {
              transform: [
                {
                  translateY: dropdownAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [SCREEN_HEIGHT - FOOTER_HEIGHT, 0],
                  }),
                },
              ],
              height: SCREEN_HEIGHT - FOOTER_HEIGHT,
              zIndex: 10,
            },
          ]}
          pointerEvents={dropdownExpanded ? "auto" : "none"}
        >
          {/* Dropdown header with close button */}
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>Location Details</Text>
            <TouchableOpacity
              style={styles.closeDropdownButton}
              onPress={() => setDropdownExpanded(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Scrollable content */}
          <ScrollView
            style={styles.dropdownScrollContent}
            contentContainerStyle={styles.dropdownScrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Main content area - Location list example */}
            <View style={styles.contentContainer}>
              <View style={styles.locationsListContainer}>
                <Text style={styles.locationsListTitle}>
                  Nearby Evacuation Centers
                </Text>
                {/* Sample evacuation center item */}
                <TouchableOpacity style={styles.locationListItem}>
                  <View
                    style={[
                      styles.locationIconContainer,
                      { backgroundColor: "rgba(76, 175, 80, 0.1)" },
                    ]}
                  >
                    <Ionicons name="shield" size={20} color="#4CAF50" />
                  </View>
                  <View style={styles.locationInfoContainer}>
                    <Text style={styles.locationTitle}>
                      Central Evacuation Center
                    </Text>
                    <Text style={styles.locationDescription}>
                      Large facility with medical services
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Another sample item */}
                <TouchableOpacity style={styles.locationListItem}>
                  <View
                    style={[
                      styles.locationIconContainer,
                      { backgroundColor: "rgba(76, 175, 80, 0.1)" },
                    ]}
                  >
                    <Ionicons name="shield" size={20} color="#4CAF50" />
                  </View>
                  <View style={styles.locationInfoContainer}>
                    <Text style={styles.locationTitle}>
                      Westside Community Shelter
                    </Text>
                    <Text style={styles.locationDescription}>
                      Emergency supplies and accommodation
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Legend panel */}
            <View style={styles.dropdownBottomPanel}>
              <View style={styles.legendContainer}>
                <Text style={styles.legendTitle}>Location Legend</Text>
                <View style={styles.legendItems}>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendColor,
                        { backgroundColor: "#4CAF50" },
                      ]}
                    />
                    <Text style={styles.legendText}>Evacuation Centers</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendColor,
                        { backgroundColor: "#FF9800" },
                      ]}
                    />
                    <Text style={styles.legendText}>Flood Areas</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendColor,
                        { backgroundColor: "#F44336" },
                      ]}
                    />
                    <Text style={styles.legendText}>Danger Zones</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendColor,
                        { backgroundColor: "#3884ff" },
                      ]}
                    />
                    <Text style={styles.legendText}>Favorite Locations</Text>
                  </View>
                </View>
                <Text style={styles.legendHelp}>
                  Search for a location or tap any evacuation center to find the
                  safest route.
                </Text>
              </View>
            </View>

            {/* Navigation button */}
            <View style={styles.dropdownActionContainer}>
              <TouchableOpacity style={styles.navigationButton}>
                <Ionicons name="navigate" size={24} color="#fff" />
                <Text style={styles.navigationButtonText}>
                  Start Navigation
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    position: "relative",
  },
  searchWrapper: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: "transparent",
  },
  searchContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...SHADOWS.medium,
    elevation: 4,
  },
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dropdownToggle: {
    padding: 8,
    marginRight: 8,
    backgroundColor: "#f1f1f1",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBarWrapper: {
    flex: 1,
  },
  searchBarInput: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    marginVertical: 4,
  },
  searchInputIcon: {
    marginRight: 12,
  },
  searchInputPlaceholder: {
    fontSize: 15,
    color: "#999",
    flex: 1,
  },
  searchInputText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  swapButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f1f1f1",
    marginLeft: 8,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  transportModeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    marginTop: 4,
  },
  transportModeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f1f1f1",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  transportModeButtonActive: {
    backgroundColor: "#3884ff",
  },

  // Fullscreen blur that respects footer
  blurContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },

  // Dropdown panel that stops above footer
  dropdownPanel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...SHADOWS.medium,
  },

  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  dropdownTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },

  closeDropdownButton: {
    padding: 8,
  },

  dropdownScrollContent: {
    flex: 1,
  },

  dropdownScrollContentContainer: {
    padding: 16,
    paddingBottom: 32, // Extra padding at the bottom
  },

  contentContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.small,
  },

  dropdownBottomPanel: {
    marginVertical: 16,
  },

  dropdownActionContainer: {
    marginTop: 16,
    marginBottom: 40,
  },

  navigationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3884ff",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    ...SHADOWS.medium,
  },

  navigationButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
  },

  // Locations list
  locationsListContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  locationsListTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  locationListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  locationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  locationInfoContainer: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  locationDescription: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },

  // Legend
  legendContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    ...SHADOWS.small,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  legendItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    width: "48%",
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
  },
  legendHelp: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
});

export default LocationScreen;
