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
  Keyboard,
  Vibration,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';

import * as Location from 'expo-location';
import { supabase, supabaseAnonKey } from '../utils/supabaseClient'; // Now importing both
import MapView, { Marker, Polyline } from 'react-native-maps'; // For map display

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const FOOTER_HEIGHT = 60;
const PULL_THRESHOLD = 50;

// Default region for map if current location isn't available yet
const DEFAULT_MAP_REGION = {
  latitude: 14.83, // Approx center of Sta. Monica, Hagonoy, Bulacan
  longitude: 120.76,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Nominatim API Base URL
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search?format=json&limit=1';


const LocationScreen = ({ navigation = {} }) => {
  const [dropdownExpanded, setDropdownExpanded] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [startLocation, setStartLocation] = useState("");
  const [destinationLocation, setDestinationLocation] = useState("");
  const [transportMode, setTransportMode] = useState("car");
  const [recentSearches, setRecentSearches] = useState([
    "Home", "Work", "City Center", "Airport",
  ]);

  const [currentLocation, setCurrentLocation] = useState(null); // Will be set when "Home" is chosen
  const [matchedStartLocationCoords, setMatchedStartLocationCoords] = useState(null); // For matched names from DB or Nominatim
  const [allSupabaseLocations, setAllSupabaseLocations] = useState([]);
  const [evacuationCenters, setEvacuationCenters] = useState([]);
  const [selectedEvacCenterId, setSelectedEvacCenterId] = useState(null);
  const [route, setRoute] = useState(null);
  const [totalDistance, setTotalDistance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dropdownAnimation = useRef(new Animated.Value(0)).current;
  const backgroundBlurAnimation = useRef(new Animated.Value(0)).current;
  const searchBarExpansion = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const panResponderY = useRef(new Animated.Value(0)).current;

  const scrollViewRef = useRef(null);
  const startLocationInputRef = useRef(null);
  const destinationInputRef = useRef(null);

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
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (dropdownExpanded) {
      if (Platform.OS === "ios") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Vibration.vibrate(10);
      }
      Animated.parallel([
        Animated.timing(dropdownAnimation, { toValue: 1, duration: 350, useNativeDriver: true, }).start(),
        Animated.timing(backgroundBlurAnimation, { toValue: 1, duration: 300, useNativeDriver: Platform.OS !== "web", }).start(),
      ]);
    } else {
      Animated.parallel([
        Animated.timing(backgroundBlurAnimation, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== "web", }).start(),
        Animated.timing(dropdownAnimation, { toValue: 0, duration: 300, useNativeDriver: true, }).start(),
      ]);
    }
  }, [dropdownExpanded]);

  // Initial fetch of locations (evacuation centers and road nodes) from Supabase on component mount
  useEffect(() => {
    console.log("1. useEffect for initial data fetch triggered.");
    (async () => {
      try {
        console.log("2. Calling fetchAllLocations (without direct location permissions yet)...");
        await fetchAllLocations();
        console.log("3. fetchAllLocations call completed within initial useEffect.");
      } catch (mainEffectError) {
        console.error("4. Unhandled error in initial useEffect async block:", mainEffectError);
        setError(`An unexpected error occurred during initial setup: ${mainEffectError.message}`);
      }
    })();
  }, []);

  const requestAndSetCurrentLocation = async () => {
    console.log("Requesting foreground location permissions for 'Home' location...");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log("Location permission status received:", status);

      if (status !== 'granted') {
        setError('Permission to access location was denied. Please enable it in settings to use "Home" location.');
        Alert.alert('Location Permission Denied', 'Please grant location permission to use "Home" as your starting point.');
        console.warn("Location permission denied. Cannot set 'Home' as current location.");
        return false; // Indicate failure
      }
      console.log("Location permission granted. Attempting to get current position...");

      let newLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCurrentLocation(newLocation.coords);
      console.log("Current location obtained:", newLocation.coords);
      setMatchedStartLocationCoords(null); // Clear any matched manual start if "Home" is chosen
      return true; // Indicate success
    } catch (locationError) {
      console.error("Error getting current position for 'Home' location:", locationError);
      setError(`Failed to get current location for "Home": ${locationError.message}`);
      Alert.alert('Location Error', `Failed to get current location for "Home": ${locationError.message}`);
      setCurrentLocation(null); // Ensure current location is cleared on failure
      setMatchedStartLocationCoords(null); // Clear any matched manual start on failure
      return false; // Indicate failure
    }
  };


  const fetchAllLocations = async () => {
    setLoading(true);
    setError(null);
    console.log("--- fetchAllLocations started (Log from inside the function) ---");
    try {
      const { data, error } = await supabase
        .from('location') // Corrected to 'location' (singular) as per your table name
        .select('id, name, latitude, longitude, type, osm_id');

      if (error) {
        console.error("Supabase fetch error (from fetchAllLocations):", error);
        throw new Error(error.message);
      }

      console.log('Raw data fetched from Supabase:', data); // NEW LOG
      
      // NEW: Log each location's ID, Name, and Type for inspection
      if (data && data.length > 0) {
        data.forEach(loc => {
            console.log(`Location: ID=${loc.id}, Name="${loc.name}", Type="${loc.type}"`);
        });
      }

      setAllSupabaseLocations(data || []);
      // Robust filtering for evacuation centers: lowercase and trim
      const filteredEvacCenters = (data || []).filter(loc => 
        loc.type && typeof loc.type === 'string' && loc.type.toLowerCase().trim() === 'evacuation_center'
      );
      setEvacuationCenters(filteredEvacCenters);
      
      console.log('All Supabase Locations (after setAllSupabaseLocations - will be stale here):', allSupabaseLocations.length); // will be stale here
      console.log('Filtered Evacuation Centers (after setEvacuationCenters):', filteredEvacCenters);
      console.log(`Number of Evacuation Centers found: ${filteredEvacCenters.length}`);

      console.log('Successfully fetched locations (from fetchAllLocations):', data);
    } catch (e) {
      console.error('Caught error during fetchAllLocations (outer catch):', e);
      setError(`Failed to load locations: ${e.message}`);
    } finally {
      setLoading(false);
      console.log("--- fetchAllLocations finished (Log from inside the function) ---");
    }
  };

  // Geocoding function using Nominatim
  const geocodeAddress = async (query) => {
    console.log(`Attempting to geocode: "${query}" using Nominatim...`);
    try {
        const response = await fetch(`${NOMINATIM_BASE_URL}&q=${encodeURIComponent(query)}`, {
            headers: {
                'User-Agent': 'eHANDA-App/1.0 (contact@example.com)' // Replace with your actual app name and contact
            }
        });
        if (!response.ok) {
            throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (data && data.length > 0) {
            console.log("Nominatim geocoding successful:", data[0]);
            // Return first result's lat, lon, and display_name
            return {
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon),
                name: data[0].display_name || query // Use display_name or fallback to query
            };
        } else {
            console.log(`Nominatim found no results for: "${query}"`);
            return null;
        }
    } catch (e) {
        console.error(`Error geocoding address "${query}":`, e);
        // Do not set global error here, as it's handled by getLiveLocationAndCalculateRoute's overall logic
        return null;
    }
  };


  const getLiveLocationAndCalculateRoute = async () => {
    console.log("--- getLiveLocationAndCalculateRoute started ---");
    setLoading(true);
    setError(null);
    setRoute(null);
    setTotalDistance(null);

    // Validate destination
    if (!selectedEvacCenterId) {
      Alert.alert('Selection Needed', 'Please select an evacuation center as your destination.');
      setLoading(false);
      console.log("--- getLiveLocationAndCalculateRoute finished: No evacuation center selected ---");
      return;
    }

    // Determine start location coordinates
    let actualStartLatitude;
    let actualStartLongitude;

    if (startLocation.toLowerCase().includes('home (my location)')) { // Check for the full 'Home (My Location)' string
      console.log("Start location is 'Home'. Checking currentLocation...");
      if (!currentLocation) {
        Alert.alert('Location Missing', '"Home" was selected, but your current location could not be determined. Please ensure location permissions are granted and try again.');
        setLoading(false);
        console.log("--- getLiveLocationAndCalculateRoute finished: Current location not available for 'Home' ---");
        return;
      }
      actualStartLatitude = currentLocation.latitude;
      actualStartLongitude = currentLocation.longitude;
      console.log(`Using current location for 'Home': ${actualStartLatitude}, ${actualStartLongitude}`);
    } else if (matchedStartLocationCoords) { // If a pre-existing location (DB or Nominatim) was matched
        console.log("Start location matched a pre-existing location in DB or geocoded by Nominatim.");
        actualStartLatitude = matchedStartLocationCoords.latitude;
        actualStartLongitude = matchedStartLocationCoords.longitude;
        console.log(`Using matched start: ${matchedStartLocationCoords.name} (${actualStartLatitude}, ${actualStartLongitude})`);
    }
    else if (startLocation.trim() === "") { // If no home, no match, and input is empty
      Alert.alert('Starting Point Needed', 'Please enter your starting location.');
      setLoading(false);
      console.log("--- getLiveLocationAndCalculateRoute finished: Start location empty ---");
      return;
    } else {
        // This is the fallback for truly custom, un-geocoded addresses
        Alert.alert('Location Not Found', 'Could not determine coordinates for your starting location. Please check the address or try "Home".');
        setLoading(false);
        console.log("--- getLiveLocationAndCalculateRoute finished: Start location not geocoded ---");
        return;
    }

    try {
      console.log("Finding selected evacuation center details...");
      const endEvacCenter = evacuationCenters.find(ec => ec.id === selectedEvacCenterId);
      if (!endEvacCenter) {
        console.error("Error: Selected evacuation center not found in the list!");
        throw new Error('Selected evacuation center not found.');
      }
      const endLocationId = endEvacCenter.id;
      console.log(`Destination Evac Center ID: ${endLocationId}`);

      const EDGE_FUNCTION_URL = 'https://ejzoaoihgrzccpiwtwsb.supabase.co/functions/v1/find-shortest-path';

      const payload = {
        start_latitude: actualStartLatitude,
        start_longitude: actualStartLongitude,
        end_location_id: endLocationId,
      };

      console.log('Calling Edge Function with payload:', payload);

      console.log("Sending fetch request to Edge Function...");
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(payload),
      });

      console.log(`Edge Function response status: ${response.status}`);
      const data = await response.json();
      console.log("Edge Function raw response data:", data);

      if (!response.ok) {
        console.error("Edge Function returned non-OK status. Error data:", data);
        throw new Error(data.error || `Edge Function error: ${response.status} ${response.statusText}`);
      }

      setRoute(data.path);
      setTotalDistance(data.total_distance);
      console.log('Route from Edge Function:', data);
      console.log("--- getLiveLocationAndCalculateRoute finished: Success ---");

    } catch (e) {
      console.error('Caught error in getLiveLocationAndCalculateRoute:', e);
      setError(`Failed to calculate route: ${e.message}`);
      Alert.alert('Route Error', `Failed to calculate route: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const animatedHeaderHeight = scrollY.interpolate({
    inputRange: [0, 100], outputRange: [80, 50], extrapolate: "clamp",
  });

  const toggleDropdown = () => {
    Keyboard.dismiss();
    setDropdownExpanded((prevState) => !prevState);
    if (dropdownExpanded) {
      setSearchFocused(false);
    }
    if (!dropdownExpanded && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
      }, 300);
    }
  };

  const handleOutsidePress = () => {
    if (dropdownExpanded) {
      if (!searchFocused) {
        setDropdownExpanded(false);
      }
    }
  };

  const handleTransportMode = (mode) => {
    setTransportMode(mode);
    if (Platform.OS === "ios") {
      Haptics.selectionAsync();
    } else {
      Vibration.vibrate(15);
    }
  };

  const handleLocationInput = async (text, isStartLocation) => {
    if (isStartLocation) {
      setStartLocation(text); // Always set the displayed text to what the user typed.
      setCurrentLocation(null); // Clear live location if input changes.
      setMatchedStartLocationCoords(null); // Clear any previous matched location.

      if (text.toLowerCase() === "home") {
        const success = await requestAndSetCurrentLocation();
        if (success) {
          // If "Home" is successful, we can update the display for clarity
          setStartLocation("Home (My Location)");
        } else {
          // If "Home" failed, clear input as it's no longer 'Home (My Location)'
          setStartLocation("");
        }
      } else if (text.trim() === "") {
        // If input is empty, ensure all relevant states are cleared
        setStartLocation("");
        setCurrentLocation(null);
        setMatchedStartLocationCoords(null);
      } else {
        // Try to find a match in allSupabaseLocations
        const matchedLoc = allSupabaseLocations.find(loc =>
          loc.name && loc.name.toLowerCase().includes(text.toLowerCase())
        );

        if (matchedLoc) {
            setMatchedStartLocationCoords({
                id: matchedLoc.id,
                latitude: matchedLoc.latitude,
                longitude: matchedLoc.longitude,
                name: matchedLoc.name
            });
            console.log(`Internal match from Supabase found for: "${text}" -> "${matchedLoc.name}"`);
            // DO NOT setStartLocation(matchedLoc.name) here. Keep user's typed text.
        } else {
            // If no match in Supabase, try Nominatim for exact match or best guess
            console.log(`No direct match in Supabase for "${text}". Trying Nominatim...`);
            const geocodedResult = await geocodeAddress(text);
            if (geocodedResult) {
                setMatchedStartLocationCoords({
                    id: null, // No direct DB ID from Nominatim, as it's a geocoded point
                    latitude: geocodedResult.latitude,
                    longitude: geocodedResult.longitude,
                    name: geocodedResult.name // Nominatim's full name for the location
                });
                console.log(`Nominatim geocoded: "${text}" -> "${geocodedResult.name}"`);
                // DO NOT setStartLocation(geocodedResult.name) here. Keep user's typed text.
            } else {
                setMatchedStartLocationCoords(null); // No match from Nominatim either
                console.log(`No match found by Nominatim for "${text}".`);
            }
        }
      }
    } else { // This is for destination - its autofill logic is fine as it's a selection
      setDestinationLocation(text);
      const matchedEvac = evacuationCenters.find(ec =>
        ec.name && ec.name.toLowerCase().includes(text.toLowerCase())
      );
      if (matchedEvac) {
        setSelectedEvacCenterId(matchedEvac.id);
        setDestinationLocation(matchedEvac.name); // This autofill is desired for selection
      } else {
        setSelectedEvacCenterId(null);
      }
    }
    // Only expand dropdown if user types something, and it's not already expanded
    if (!dropdownExpanded && text.length > 0) {
      setDropdownExpanded(true);
    }
  };

  const clearLocationInput = (isStartLocation) => {
    if (isStartLocation) {
      setStartLocation("");
      setCurrentLocation(null);
      setMatchedStartLocationCoords(null);
      startLocationInputRef.current?.focus();
    } else {
      setDestinationLocation("");
      destinationInputRef.current?.focus();
      setSelectedEvacCenterId(null);
    }
  };

  const handleSwapLocations = () => {
    Animated.sequence([
      Animated.timing(searchBarExpansion, { toValue: 1, duration: 150, useNativeDriver: true, }).start(),
      Animated.timing(searchBarExpansion, { toValue: 0, duration: 150, useNativeDriver: true, }).start(),
    ]);
    const tempStart = startLocation;
    setStartLocation(destinationLocation);
    setDestinationLocation(tempStart);
    
    // Logic for setting new start location (original destination)
    const originalDestinationLoc = allSupabaseLocations.find(loc => loc.name === destinationLocation);
    if (originalDestinationLoc) {
        setMatchedStartLocationCoords({
            id: originalDestinationLoc.id,
            latitude: originalDestinationLoc.latitude,
            longitude: originalDestinationLoc.longitude,
            name: originalDestinationLoc.name
        });
        setCurrentLocation(null); // Clear live location
    } else if (destinationLocation.toLowerCase().includes('home')) {
        requestAndSetCurrentLocation(); // Re-trigger live location
        setMatchedStartLocationCoords(null);
    } else {
        // If original destination was custom text not matched in DB, try geocoding it for new start
        geocodeAddress(destinationLocation).then(geocodedResult => {
            if (geocodedResult) {
                setMatchedStartLocationCoords({
                    id: null,
                    latitude: geocodedResult.latitude,
                    longitude: geocodedResult.longitude,
                    name: geocodedResult.name
                });
            } else {
                setMatchedStartLocationCoords(null);
            }
        });
        setCurrentLocation(null);
    }

    // Logic for setting new destination (original start)
    const originalStartLoc = evacuationCenters.find(loc => loc.name === tempStart);
    if (originalStartLoc) {
        setSelectedEvacCenterId(originalStartLoc.id);
    } else {
        setSelectedEvacCenterId(null);
    }

    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Vibration.vibrate(20);
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" translucent />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={currentLocation || matchedStartLocationCoords ? {
                latitude: (currentLocation || matchedStartLocationCoords).latitude,
                longitude: (currentLocation || matchedStartLocationCoords).longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              } : DEFAULT_MAP_REGION}
              showsUserLocation={currentLocation ? true : false}
            >
              {/* Current Location Marker - only render if currentLocation exists */}
              {currentLocation && (
                <Marker
                  coordinate={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }}
                  title="Your Current Location"
                  description="Starting Point (Home)"
                  pinColor="blue"
                />
              )}

              {/* Matched Start Location Marker - only render if matchedStartLocationCoords exists and no live location */}
              {matchedStartLocationCoords && !currentLocation && (
                <Marker
                  coordinate={{ latitude: matchedStartLocationCoords.latitude, longitude: matchedStartLocationCoords.longitude }}
                  title={matchedStartLocationCoords.name}
                  description="Starting Point (Pre-defined)"
                  pinColor="purple"
                />
              )}

              {evacuationCenters.map((center) => (
                <Marker
                  key={center.id}
                  coordinate={{ latitude: center.latitude, longitude: center.longitude }}
                  title={center.name}
                  description={center.type === 'evacuation_center' ? 'Evacuation Center' : 'Map Point'}
                  pinColor={selectedEvacCenterId === center.id ? "green" : "red"}
                  onPress={() => {
                        setSelectedEvacCenterId(center.id);
                        setDestinationLocation(center.name);
                        setDropdownExpanded(false);
                        Keyboard.dismiss();
                  }}
                />
              ))}

              {route && route.length > 1 && (
                <Polyline
                  coordinates={route.map(loc => ({ latitude: loc.latitude, longitude: loc.longitude }))}
                  strokeColor="#0000FF"
                  strokeWidth={5}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
            </MapView>
          </View>

          <Animated.View style={[styles.headerContainer, { height: animatedHeaderHeight }]}>
            <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFillObject} />
            <TouchableOpacity onPress={toggleDropdown} style={styles.menuButton}>
              <Ionicons name="menu" size={28} color="#333" />
            </TouchableOpacity>
            <Animated.View
              style={[
                styles.searchBar,
                {
                  transform: [
                    {
                      scaleX: searchBarExpansion.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0.9],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TextInput
                style={styles.searchInput}
                placeholder="Search location..."
                value={startLocation}
                onFocus={() => {
                    setSearchFocused(true);
                    setDropdownExpanded(true);
                }}
                onChangeText={text => handleLocationInput(text, true)}
                ref={startLocationInputRef}
                editable={true}
              />
              {startLocation.length > 0 && (
                <TouchableOpacity onPress={() => clearLocationInput(true)} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </Animated.View>
            <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.profileButton}>
              <Ionicons name="person-circle-outline" size={32} color="#333" />
            </TouchableOpacity>
          </Animated.View>

          {dropdownExpanded && (
            <TouchableWithoutFeedback onPress={handleOutsidePress}>
              <Animated.View
                style={[
                  styles.dropdownOverlay,
                  {
                    opacity: backgroundBlurAnimation,
                  },
                ]}
              >
                <BlurView
                  intensity={90}
                  tint="dark"
                  style={StyleSheet.absoluteFillObject}
                />
                <LinearGradient
                  colors={["rgba(255,255,255,1)", "rgba(255,255,255,0.8)"]}
                  style={styles.dropdownContent}
                >
                  <TouchableOpacity onPress={toggleDropdown} style={styles.closeDropdownButton}>
                    <Ionicons name="chevron-down" size={28} color="#666" />
                  </TouchableOpacity>

                  <Text style={styles.dropdownTitle}>Where to?</Text>

                  <View style={styles.locationInputsContainer}>
                    <View style={styles.inputRow}>
                      <Ionicons name="navigate-circle" size={24} color="#007bff" style={styles.inputIcon} />
                      <TextInput
                        style={styles.dropdownInput}
                        placeholder="Your starting location (e.g., 'Home')"
                        value={startLocation}
                        onChangeText={text => handleLocationInput(text, true)}
                        ref={startLocationInputRef}
                        onFocus={() => { setSearchFocused(true); setDropdownExpanded(true); }}
                        onBlur={() => setSearchFocused(false)}
                      />
                      {startLocation.length > 0 && (
                        <TouchableOpacity onPress={() => clearLocationInput(true)} style={styles.clearButton}>
                          <Ionicons name="close-circle" size={20} color="#999" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <TouchableOpacity onPress={handleSwapLocations} style={styles.swapButton}>
                      <Ionicons name="swap-vertical" size={24} color="#007bff" />
                    </TouchableOpacity>
                    <View style={styles.inputRow}>
                      <Ionicons name="location-sharp" size={24} color="#dc3545" style={styles.inputIcon} />
                      <TextInput
                        style={styles.dropdownInput}
                        placeholder="Choose destination"
                        value={destinationLocation}
                        onChangeText={(text) => handleLocationInput(text, false)}
                        ref={destinationInputRef}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                      />
                      {destinationLocation.length > 0 && (
                        <TouchableOpacity onPress={() => clearLocationInput(false)} style={styles.clearButton}>
                          <Ionicons name="close-circle" size={20} color="#999" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <View style={styles.transportModeContainer}>
                    <Text style={styles.sectionTitle}>Mode of Transport</Text>
                    <View style={styles.modeButtons}>
                      <TouchableOpacity
                        style={[styles.modeButton, transportMode === "car" && styles.selectedMode]}
                        onPress={() => handleTransportMode("car")}
                      >
                        <Ionicons name="car" size={24} color={transportMode === "car" ? "#fff" : "#333"} />
                        <Text style={[styles.modeButtonText, transportMode === "car" && styles.selectedModeText]}>Car</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modeButton, transportMode === "walk" && styles.selectedMode]}
                        onPress={() => handleTransportMode("walk")}
                      >
                        <Ionicons name="walk" size={24} color={transportMode === "walk" ? "#fff" : "#333"} />
                        <Text style={[styles.modeButtonText, transportMode === "walk" && styles.selectedModeText]}>Walk</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modeButton, transportMode === "bike" && styles.selectedMode]}
                        onPress={() => handleTransportMode("bike")}
                      >
                        <Ionicons name="bicycle" size={24} color={transportMode === "bike" ? "#fff" : "#333"} />
                        <Text style={[styles.modeButtonText, transportMode === "bike" && styles.selectedModeText]}>Bike</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <Text style={styles.sectionTitle}>Evacuation Centers</Text>
                  <ScrollView style={styles.evacCentersScrollView} keyboardShouldPersistTaps="handled">
                    {loading ? (
                        <ActivityIndicator size="small" color="#0000ff" />
                    ) : error ? (
                        <Text style={styles.errorText}>{error}</Text>
                    ) : evacuationCenters.length > 0 ? (
                        evacuationCenters.map((center) => (
                            <TouchableOpacity
                                key={center.id}
                                style={styles.evacCenterItem}
                                onPress={() => {
                                    setSelectedEvacCenterId(center.id);
                                    setDestinationLocation(center.name);
                                    setDropdownExpanded(false);
                                    Keyboard.dismiss();
                                }}
                            >
                                <Ionicons name="flag" size={20} color="#28a745" style={styles.evacCenterIcon} />
                                <Text style={styles.evacCenterName}>{center.name}</Text>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={styles.noDataText}>No evacuation centers found.</Text>
                    )}
                  </ScrollView>

                  <TouchableOpacity
                    style={styles.calculateRouteButton}
                    onPress={getLiveLocationAndCalculateRoute}
                    // Disable if loading, no destination selected, and (neither live location nor matched DB/Nominatim location available for start)
                    disabled={loading || !selectedEvacCenterId || (!currentLocation && !matchedStartLocationCoords)}
                  >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.calculateRouteButtonText}>Calculate Route</Text>
                    )}
                  </TouchableOpacity>

                  {totalDistance !== null && (
                    <Text style={styles.resultText}>
                      Estimated Distance: {totalDistance.toFixed(2)} km
                    </Text>
                  )}
                  {error && (
                    <Text style={styles.errorTextSmall}>{error}</Text>
                  )}

                </LinearGradient>
              </Animated.View>
            </TouchableWithoutFeedback>
          )}

          <View style={styles.bottomNav}>
            <Text style={styles.bottomNavText}>Bottom Navigation (Placeholder)</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f0f0', },
  container: { flex: 1, backgroundColor: '#fff', },
  mapContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', },
  map: { ...StyleSheet.absoluteFillObject, },
  mapLoadingIndicator: { position: 'absolute', alignSelf: 'center', top: '50%', },
  headerContainer: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', backgroundColor: 'transparent',
    zIndex: 10, overflow: 'hidden',
  },
  menuButton: { padding: 8, },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 25,
    paddingHorizontal: 15, marginHorizontal: 10, height: 40,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, },
      android: { elevation: 3, },
    }),
  },
  searchInput: { flex: 1, fontSize: 16, color: '#333', },
  clearButton: { padding: 5, },
  profileButton: { padding: 8, },
  dropdownOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'flex-start', alignItems: 'center', zIndex: 11,
  },
  dropdownContent: {
    width: '100%', padding: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10, },
      android: { elevation: 10, },
    }),
  },
  closeDropdownButton: { alignSelf: 'center', padding: 10, marginTop: 10, },
  dropdownTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#333', },
  locationInputsContainer: {
    backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, },
      android: { elevation: 3, },
    }),
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee', },
  inputIcon: { marginRight: 10, },
  dropdownInput: { flex: 1, fontSize: 16, color: '#333', paddingVertical: 5, },
  swapButton: {
    position: 'absolute', right: 10, top: '50%',
    transform: [{ translateY: -12 }], zIndex: 1,
    backgroundColor: '#f0f0f0', borderRadius: 20, padding: 5,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, },
      android: { elevation: 2, },
    }),
  },
  transportModeContainer: { marginBottom: 20, },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10, color: '#555', },
  modeButtons: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#f0f0f0', borderRadius: 10, padding: 5, },
  modeButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8, },
  selectedMode: { backgroundColor: '#007bff', },
  modeButtonText: { marginLeft: 8, fontSize: 16, fontWeight: '500', color: '#333', },
  selectedModeText: { color: '#fff', },
  evacCentersScrollView: {
    maxHeight: SCREEN_HEIGHT * 0.25, backgroundColor: '#fff', borderRadius: 10, marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, },
      android: { elevation: 3, },
    }),
  },
  evacCenterItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', },
  evacCenterIcon: { marginRight: 10, },
  evacCenterName: { fontSize: 16, color: '#333', },
  noDataText: { textAlign: 'center', padding: 20, color: '#777', fontStyle: 'italic', },
  calculateRouteButton: {
    backgroundColor: '#007bff', padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10,
    ...Platform.select({
      ios: { shadowColor: '#007bff', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 5, },
      android: { elevation: 5, },
    }),
  },
  calculateRouteButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', },
  resultText: { fontSize: 18, fontWeight: 'bold', marginTop: 15, textAlign: 'center', color: '#28a745', },
  errorTextSmall: { color: 'red', textAlign: 'center', marginTop: 10, fontSize: 14, },
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: FOOTER_HEIGHT,
    backgroundColor: '#f8f8f8', borderTopWidth: 1, borderTopColor: '#eee',
    justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  bottomNavText: { color: '#666', },
});

export default LocationScreen;
