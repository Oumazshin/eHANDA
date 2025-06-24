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
  Keyboard,
  Vibration,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SHADOWS } from "../styles/theme";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics"; // Consider adding haptic feedback

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const FOOTER_HEIGHT = 60; // Bottom tab height
const PULL_THRESHOLD = 50; // Pull distance to trigger dropdown collapse

const LocationScreen = ({ navigation = {} }) => {
  // Core UI state
  const [dropdownExpanded, setDropdownExpanded] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [startLocation, setStartLocation] = useState("");
  const [destinationLocation, setDestinationLocation] = useState("");
  const [transportMode, setTransportMode] = useState("car");
  const [recentSearches, setRecentSearches] = useState([
    "Home",
    "Work",
    "City Center",
    "Airport",
  ]);

  // Animation values
  const dropdownAnimation = useRef(new Animated.Value(0)).current;
  const backgroundBlurAnimation = useRef(new Animated.Value(0)).current;
  const searchBarExpansion = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const panResponderY = useRef(new Animated.Value(0)).current;

  // Refs
  const scrollViewRef = useRef(null);
  const startLocationInputRef = useRef(null);
  const destinationInputRef = useRef(null);

  // Handle keyboard appearance - collapse dropdown if keyboard opens when searching
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setSearchFocused(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setSearchFocused(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // Animation control with improved timing and easing
  useEffect(() => {
    if (dropdownExpanded) {
      // Provide haptic feedback when opening dropdown
      if (Platform.OS === "ios") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Vibration.vibrate(10);
      }

      Animated.parallel([
        Animated.timing(dropdownAnimation, {
          toValue: 1,
          duration: 350,
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

  // Enhanced dropdown behavior with scroll interactivity
  const animatedHeaderHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [80, 50],
    extrapolate: "clamp",
  });

  // Toggle dropdown with improved state management
  const toggleDropdown = () => {
    // Hide keyboard if open
    Keyboard.dismiss();

    // Toggle dropdown state
    setDropdownExpanded((prevState) => !prevState);

    // Reset search focused state when closing dropdown
    if (dropdownExpanded) {
      setSearchFocused(false);
    }

    // Scroll to top when opening dropdown
    if (!dropdownExpanded && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
      }, 300);
    }
  };

  // Handle outside press with improved touch handling
  const handleOutsidePress = () => {
    if (dropdownExpanded) {
      // Don't close if user is typing in search
      if (!searchFocused) {
        setDropdownExpanded(false);
      }
    }
  };

  // Handle transport mode selection with feedback
  const handleTransportMode = (mode) => {
    setTransportMode(mode);

    // Provide haptic feedback on selection
    if (Platform.OS === "ios") {
      Haptics.selectionAsync();
    } else {
      Vibration.vibrate(15);
    }
  };

  // Smart location search handling
  const handleLocationInput = (text, isStartLocation) => {
    if (isStartLocation) {
      setStartLocation(text);
    } else {
      setDestinationLocation(text);
    }

    // Automatically expand dropdown when typing
    if (!dropdownExpanded && text.length > 0) {
      setDropdownExpanded(true);
    }
  };

  // Clear text fields with improved UX
  const clearLocationInput = (isStartLocation) => {
    if (isStartLocation) {
      setStartLocation("");
      startLocationInputRef.current?.focus();
    } else {
      setDestinationLocation("");
      destinationInputRef.current?.focus();
    }
  };

  // Handle swap locations with animation
  const handleSwapLocations = () => {
    // Create a swapping animation for better feedback
    Animated.sequence([
      Animated.timing(searchBarExpansion, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(searchBarExpansion, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Swap the actual values
    const tempStart = startLocation;
    setStartLocation(destinationLocation);
    setDestinationLocation(tempStart);

    // Provide haptic feedback
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Vibration.vibrate(20);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top search bar - always visible, with enhanced interactivity */}
        <Animated.View
          style={[
            styles.searchWrapper,
            {
              transform: [
                {
                  translateY: searchBarExpansion.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, -5, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.searchContainer}>
            <View style={styles.backButtonContainer}>
              {/* Dropdown toggle button with improved visual feedback */}
              <TouchableOpacity
                style={[
                  styles.dropdownToggle,
                  dropdownExpanded && styles.dropdownToggleActive,
                ]}
                onPress={toggleDropdown}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={dropdownExpanded ? "chevron-up" : "chevron-down"}
                  size={24}
                  color={dropdownExpanded ? "#3884ff" : "#333"}
                />
              </TouchableOpacity>

              <View style={styles.searchBarWrapper}>
                {/* Start location input - improved interaction */}
                <TouchableOpacity
                  style={styles.searchBarInput}
                  onPress={() => {
                    if (!dropdownExpanded) {
                      setDropdownExpanded(true);
                    }
                    setTimeout(() => {
                      startLocationInputRef.current?.focus();
                    }, 300);
                  }}
                >
                  <View style={styles.searchInputIcon}>
                    <Ionicons name="locate" size={20} color="#D32F2F" />
                  </View>
                  {dropdownExpanded ? (
                    <TextInput
                      ref={startLocationInputRef}
                      style={
                        startLocation
                          ? styles.searchInputText
                          : styles.searchInputPlaceholder
                      }
                      placeholder="Choose start location"
                      placeholderTextColor="#999"
                      value={startLocation}
                      onChangeText={(text) => handleLocationInput(text, true)}
                    />
                  ) : (
                    <Text
                      style={
                        startLocation
                          ? styles.searchInputText
                          : styles.searchInputPlaceholder
                      }
                    >
                      {startLocation || "Choose start location"}
                    </Text>
                  )}
                  {startLocation ? (
                    <TouchableOpacity
                      style={styles.clearInputButton}
                      onPress={() => clearLocationInput(true)}
                    >
                      <Ionicons name="close-circle" size={18} color="#999" />
                    </TouchableOpacity>
                  ) : null}
                </TouchableOpacity>

                {/* Destination input - improved interaction */}
                <TouchableOpacity
                  style={styles.searchBarInput}
                  onPress={() => {
                    if (!dropdownExpanded) {
                      setDropdownExpanded(true);
                    }
                    setTimeout(() => {
                      destinationInputRef.current?.focus();
                    }, 300);
                  }}
                >
                  <View style={styles.searchInputIcon}>
                    <Ionicons name="navigate" size={20} color="#333" />
                  </View>
                  {dropdownExpanded ? (
                    <TextInput
                      ref={destinationInputRef}
                      style={
                        destinationLocation
                          ? styles.searchInputText
                          : styles.searchInputPlaceholder
                      }
                      placeholder="Choose destination"
                      placeholderTextColor="#999"
                      value={destinationLocation}
                      onChangeText={(text) => handleLocationInput(text, false)}
                    />
                  ) : (
                    <Text
                      style={
                        destinationLocation
                          ? styles.searchInputText
                          : styles.searchInputPlaceholder
                      }
                    >
                      {destinationLocation || "Choose destination"}
                    </Text>
                  )}
                  {destinationLocation ? (
                    <TouchableOpacity
                      style={styles.clearInputButton}
                      onPress={() => clearLocationInput(false)}
                    >
                      <Ionicons name="close-circle" size={18} color="#999" />
                    </TouchableOpacity>
                  ) : null}
                </TouchableOpacity>
              </View>

              {/* Swap locations button with improved feedback */}
              <TouchableOpacity
                style={[
                  styles.swapButton,
                  startLocation && destinationLocation
                    ? styles.swapButtonActive
                    : null,
                ]}
                onPress={handleSwapLocations}
                disabled={!startLocation || !destinationLocation}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="swap-vertical"
                  size={24}
                  color={
                    startLocation && destinationLocation ? "#3884ff" : "#999"
                  }
                />
              </TouchableOpacity>
            </View>

            {/* Transportation mode options with improved selection UX */}
            <View style={styles.transportModeContainer}>
              {[
                { id: "car", icon: "car", label: "Car" },
                { id: "motorcycle", icon: "bicycle", label: "Motorcycle" },
                { id: "walk", icon: "walk", label: "Walk" },
              ].map((mode) => (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.transportModeButton,
                    transportMode === mode.id &&
                      styles.transportModeButtonActive,
                  ]}
                  onPress={() => handleTransportMode(mode.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={mode.icon}
                    size={22}
                    color={transportMode === mode.id ? "#fff" : "#333"}
                  />
                  <Text
                    style={[
                      styles.transportModeLabel,
                      transportMode === mode.id &&
                        styles.transportModeLabelActive,
                    ]}
                  >
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Background blur with improved behavior */}
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

        {/* Dropdown panel - with pull-to-close gesture and improved animations */}
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
              opacity: dropdownAnimation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0.8, 1],
              }),
            },
          ]}
          pointerEvents={dropdownExpanded ? "auto" : "none"}
        >
          {/* Pull indicator for better usability */}
          <View style={styles.pullIndicator}>
            <View style={styles.pullIndicatorBar} />
          </View>

          {/* Dropdown header with collapsible animation */}
          <Animated.View
            style={[styles.dropdownHeader, { height: animatedHeaderHeight }]}
          >
            <Text style={styles.dropdownTitle}>
              {startLocation && destinationLocation
                ? "Route Information"
                : "Location Details"}
            </Text>
            <TouchableOpacity
              style={styles.closeDropdownButton}
              onPress={() => setDropdownExpanded(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </Animated.View>

          {/* Scrollable content with enhanced scroll behavior */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.dropdownScrollContent}
            contentContainerStyle={styles.dropdownScrollContentContainer}
            showsVerticalScrollIndicator={true}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            bounces={true}
            onScrollBeginDrag={() => {
              // Track for pull-to-close gesture
              panResponderY.setValue(0);
            }}
            onScroll={(e) => {
              // Implement pull-to-close
              if (e.nativeEvent.contentOffset.y < -PULL_THRESHOLD) {
                setDropdownExpanded(false);
              }
            }}
          >
            {/* Recent searches for better UX */}
            {(startLocationInputRef.current?.isFocused() ||
              destinationInputRef.current?.isFocused()) && (
              <View style={styles.recentSearchesContainer}>
                <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
                {recentSearches.map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.recentSearchItem}
                    onPress={() => {
                      if (startLocationInputRef.current?.isFocused()) {
                        setStartLocation(search);
                      } else if (destinationInputRef.current?.isFocused()) {
                        setDestinationLocation(search);
                      }
                      Keyboard.dismiss();
                    }}
                  >
                    <Ionicons name="time-outline" size={18} color="#666" />
                    <Text style={styles.recentSearchText}>{search}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Main content area - Location list example */}
            <View style={styles.contentContainer}>
              <View style={styles.locationsListContainer}>
                <Text style={styles.locationsListTitle}>
                  Nearby Evacuation Centers
                </Text>
                {/* Sample evacuation center item with enhanced interaction */}
                <TouchableOpacity
                  style={styles.locationListItem}
                  onPress={() => {
                    // Set as destination on tap
                    setDestinationLocation("Central Evacuation Center");

                    // Provide feedback
                    if (Platform.OS === "ios") {
                      Haptics.selectionAsync();
                    }
                  }}
                  activeOpacity={0.7}
                >
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
                  <View style={styles.locationActionContainer}>
                    <Text style={styles.locationDistance}>1.2 km</Text>
                    <Ionicons name="chevron-forward" size={18} color="#999" />
                  </View>
                </TouchableOpacity>

                {/* Another sample item with enhanced interaction */}
                <TouchableOpacity
                  style={styles.locationListItem}
                  onPress={() => {
                    // Set as destination on tap
                    setDestinationLocation("Westside Community Shelter");

                    // Provide feedback
                    if (Platform.OS === "ios") {
                      Haptics.selectionAsync();
                    }
                  }}
                  activeOpacity={0.7}
                >
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
                  <View style={styles.locationActionContainer}>
                    <Text style={styles.locationDistance}>2.5 km</Text>
                    <Ionicons name="chevron-forward" size={18} color="#999" />
                  </View>
                </TouchableOpacity>

                {/* Add a third option for better selection */}
                <TouchableOpacity
                  style={styles.locationListItem}
                  onPress={() => {
                    // Set as destination on tap
                    setDestinationLocation("Eastside Hospital");

                    // Provide feedback
                    if (Platform.OS === "ios") {
                      Haptics.selectionAsync();
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.locationIconContainer,
                      { backgroundColor: "rgba(244, 67, 54, 0.1)" },
                    ]}
                  >
                    <Ionicons name="medkit" size={20} color="#F44336" />
                  </View>
                  <View style={styles.locationInfoContainer}>
                    <Text style={styles.locationTitle}>Eastside Hospital</Text>
                    <Text style={styles.locationDescription}>
                      Medical facility with emergency services
                    </Text>
                  </View>
                  <View style={styles.locationActionContainer}>
                    <Text style={styles.locationDistance}>3.8 km</Text>
                    <Ionicons name="chevron-forward" size={18} color="#999" />
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
              <TouchableOpacity
                style={[
                  styles.navigationButton,
                  (!startLocation || !destinationLocation) &&
                    styles.navigationButtonDisabled,
                ]}
                activeOpacity={0.7}
                disabled={!startLocation || !destinationLocation}
                onPress={() => {
                  setDropdownExpanded(false);
                  // Provide strong feedback for important action
                  if (Platform.OS === "ios") {
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success
                    );
                  } else {
                    Vibration.vibrate(40);
                  }
                }}
              >
                <Ionicons name="navigate" size={24} color="#fff" />
                <Text style={styles.navigationButtonText}>
                  Start Navigation
                </Text>
              </TouchableOpacity>

              {/* Quick action buttons for better UX */}
              <View style={styles.quickActionContainer}>
                {startLocation && destinationLocation && (
                  <>
                    <TouchableOpacity style={styles.quickActionButton}>
                      <Ionicons name="heart-outline" size={20} color="#666" />
                      <Text style={styles.quickActionText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionButton}>
                      <Ionicons name="share-outline" size={20} color="#666" />
                      <Text style={styles.quickActionText}>Share</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
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
  dropdownToggleActive: {
    backgroundColor: "rgba(56, 132, 255, 0.1)",
  },
  searchBarWrapper: {
    flex: 1,
  },
  searchBarInput: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
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
  clearInputButton: {
    padding: 4,
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
  swapButtonActive: {
    backgroundColor: "rgba(56, 132, 255, 0.1)",
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
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#f1f1f1",
  },
  transportModeButtonActive: {
    backgroundColor: "#3884ff",
  },
  transportModeLabel: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
  },
  transportModeLabelActive: {
    color: "#fff",
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

  // Pull indicator
  pullIndicator: {
    width: "100%",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },
  pullIndicatorBar: {
    width: 40,
    height: 5,
    backgroundColor: "#ddd",
    borderRadius: 3,
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

  // Recent searches UI
  recentSearchesContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  recentSearchesTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  recentSearchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  recentSearchText: {
    fontSize: 15,
    color: "#333",
    marginLeft: 10,
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

  navigationButtonDisabled: {
    backgroundColor: "#b3c7e6",
  },

  navigationButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
  },

  quickActionContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },

  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  quickActionText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
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
  locationActionContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationDistance: {
    fontSize: 13,
    fontWeight: "500",
    color: "#3884ff",
    marginRight: 4,
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
