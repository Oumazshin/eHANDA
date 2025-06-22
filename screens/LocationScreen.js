import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Polyline } from "react-native-maps"; // This is the proper import
import * as Location from "expo-location";
import { useFocusEffect } from "@react-navigation/native";

// Import theme properly
import { COLORS, FONTS, SIZES, SHADOWS, LAYOUT } from "../styles/theme";

// Sta Monica, Hagonoy, Bulacan region coordinates
const REGION = {
  latitude: 14.8321,
  longitude: 120.7354,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

// Evacuation centers in Sta Monica
const EVACUATION_CENTERS = [
  {
    id: 1,
    name: "Sta Monica Elementary School",
    latitude: 14.8325,
    longitude: 120.736,
    type: "evacuation",
  },
  {
    id: 2,
    name: "Sta Monica Community Center",
    latitude: 14.8342,
    longitude: 120.7375,
    type: "evacuation",
  },
  {
    id: 3,
    name: "Hagonoy Municipal Evacuation Center",
    latitude: 14.831,
    longitude: 120.734,
    type: "evacuation",
  },
];

// Flood prone areas in Sta Monica
const FLOOD_ZONES = [
  {
    id: 1,
    name: "Junction Area",
    latitude: 14.833,
    longitude: 120.7365,
    type: "flood",
    radius: 150,
  },
  {
    id: 2,
    name: "Riverside Area",
    latitude: 14.835,
    longitude: 120.733,
    type: "flood",
    radius: 200,
  },
  {
    id: 3,
    name: "Low-lying Residential Zone",
    latitude: 14.8315,
    longitude: 120.7385,
    type: "flood",
    radius: 180,
  },
];

// Danger zones in Sta Monica
const DANGER_ZONES = [
  {
    id: 1,
    name: "Bridge Crossing",
    latitude: 14.8335,
    longitude: 120.7345,
    type: "danger",
    radius: 100,
  },
  {
    id: 2,
    name: "Power Station Area",
    latitude: 14.8355,
    longitude: 120.737,
    type: "danger",
    radius: 120,
  },
];

// All nodes for Dijkstra's algorithm
const GRAPH_NODES = [
  { id: "start", type: "node" }, // Will be replaced with user's current location
  ...EVACUATION_CENTERS.map((center) => ({
    id: `evac-${center.id}`,
    latitude: center.latitude,
    longitude: center.longitude,
    type: "node",
  })),
  { id: "node-1", latitude: 14.832, longitude: 120.735, type: "node" },
  { id: "node-2", latitude: 14.833, longitude: 120.736, type: "node" },
  { id: "node-3", latitude: 14.834, longitude: 120.7355, type: "node" },
  { id: "node-4", latitude: 14.8335, longitude: 120.7375, type: "node" },
  { id: "node-5", latitude: 14.8315, longitude: 120.7365, type: "node" },
];

// Safety ratings: 1 (safe) to 10 (dangerous)
const GRAPH_EDGES = [
  { from: "node-1", to: "evac-1", distance: 0.5, safety: 2 },
  { from: "node-2", to: "evac-1", distance: 0.3, safety: 1 },
  { from: "node-2", to: "node-3", distance: 0.6, safety: 4 },
  { from: "node-3", to: "evac-2", distance: 0.4, safety: 2 },
  { from: "node-1", to: "node-5", distance: 0.5, safety: 6 },
  { from: "node-5", to: "node-4", distance: 0.7, safety: 7 },
  { from: "node-4", to: "evac-2", distance: 0.2, safety: 3 },
  { from: "node-5", to: "evac-3", distance: 0.8, safety: 5 },
  // More edges will be dynamically created based on user's location
];

const LocationScreen = ({ navigation = {} }) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvacuation, setSelectedEvacuation] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeSummary, setRouteSummary] = useState(null);
  const mapRef = useRef(null);

  // Request location permissions and get current location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        setLoading(false);
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(location);
      } catch (error) {
        setErrorMsg("Could not get current location");
        // Fall back to Sta Monica center if we can't get user's location
        setLocation({
          coords: {
            latitude: REGION.latitude,
            longitude: REGION.longitude,
          },
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Reset route when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setRoute(null);
        setSelectedEvacuation(null);
        setRouteSummary(null);
      };
    }, [])
  );

  // Dijkstra's Algorithm Implementation
  const findSafeRoute = (destinationId) => {
    setLoading(true);

    if (!location) {
      Alert.alert("Error", "Your location is not available");
      setLoading(false);
      return;
    }

    // Create a dynamic graph based on current location
    const currentGraph = [...GRAPH_NODES];
    const currentEdges = [...GRAPH_EDGES];

    // Add user's current position as the start node
    currentGraph[0] = {
      id: "start",
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      type: "node",
    };

    // Add connections from start to other nodes
    GRAPH_NODES.slice(1).forEach((node) => {
      // Calculate distance and safety rating based on proximity to danger/flood zones
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        node.latitude,
        node.longitude
      );

      const safety = calculateSafetyRating(node.latitude, node.longitude);

      // Only add connections if they're within reasonable distance (1km)
      if (distance < 1) {
        currentEdges.push({
          from: "start",
          to: node.id,
          distance,
          safety,
        });
      }
    });

    // Find target evacuation center
    const destination = EVACUATION_CENTERS.find(
      (center) => `evac-${center.id}` === destinationId
    );
    if (!destination) {
      Alert.alert("Error", "Selected evacuation center not found");
      setLoading(false);
      return;
    }

    // Run Dijkstra's algorithm for shortest+safest path
    const result = dijkstra(currentGraph, currentEdges, "start", destinationId);

    if (result.path.length === 0) {
      Alert.alert(
        "No Route",
        "Could not find a safe route to this evacuation center"
      );
      setLoading(false);
      return;
    }

    // Convert node IDs to coordinates for the route
    const routeCoordinates = result.path.map((nodeId) => {
      const node = currentGraph.find((n) => n.id === nodeId);
      return {
        latitude: node.latitude,
        longitude: node.longitude,
      };
    });

    // Calculate ETA (assuming average walking speed of 5km/h)
    const etaMinutes = Math.round((result.distance / 5) * 60);

    // Set route and summary
    setRoute(routeCoordinates);
    setRouteSummary({
      distance: result.distance.toFixed(2),
      eta: etaMinutes,
      safety: getSafetyRating(result.safety),
    });

    // Set the selected evacuation center
    setSelectedEvacuation(destination);

    // Fit map to show the entire route
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(routeCoordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }

    setLoading(false);
  };

  // Helper function to calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  // Calculate safety rating based on proximity to danger/flood zones
  const calculateSafetyRating = (latitude, longitude) => {
    let maxDanger = 1; // Default safety

    // Check proximity to flood zones
    FLOOD_ZONES.forEach((zone) => {
      const distance =
        calculateDistance(latitude, longitude, zone.latitude, zone.longitude) *
        1000; // in meters
      if (distance < zone.radius) {
        const dangerFactor = 5 * (1 - distance / zone.radius); // 5 is medium danger
        maxDanger = Math.max(maxDanger, dangerFactor);
      }
    });

    // Check proximity to danger zones
    DANGER_ZONES.forEach((zone) => {
      const distance =
        calculateDistance(latitude, longitude, zone.latitude, zone.longitude) *
        1000; // in meters
      if (distance < zone.radius) {
        const dangerFactor = 8 * (1 - distance / zone.radius); // 10 is max danger
        maxDanger = Math.max(maxDanger, dangerFactor);
      }
    });

    return Math.round(maxDanger);
  };

  // Convert numerical safety rating to text
  const getSafetyRating = (rating) => {
    if (rating < 3) return { text: "Safe", color: "#4CAF50" };
    if (rating < 7) return { text: "Caution", color: "#FF9800" };
    return { text: "Dangerous", color: "#F44336" };
  };

  // Dijkstra's algorithm implementation
  const dijkstra = (nodes, edges, startId, endId) => {
    // Initialize distances with infinity for all nodes except start
    const distances = {};
    const previous = {};
    const safetyRatings = {};
    const unvisited = new Set();

    nodes.forEach((node) => {
      distances[node.id] = node.id === startId ? 0 : Infinity;
      safetyRatings[node.id] = node.id === startId ? 0 : Infinity;
      previous[node.id] = null;
      unvisited.add(node.id);
    });

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let current = null;
      let minDistance = Infinity;

      unvisited.forEach((nodeId) => {
        if (distances[nodeId] < minDistance) {
          minDistance = distances[nodeId];
          current = nodeId;
        }
      });

      // Exit if we can't go further or reached destination
      if (current === null || current === endId) break;

      unvisited.delete(current);

      // Get all connecting edges
      const currentEdges = edges.filter((edge) => edge.from === current);

      currentEdges.forEach((edge) => {
        const neighbor = edge.to;

        // Weight function: combine distance and safety (0.7 * distance + 0.3 * safety)
        const weightedDistance = 0.7 * edge.distance + 0.3 * (edge.safety / 10);
        const tentativeDistance = distances[current] + weightedDistance;
        const tentativeSafety = safetyRatings[current] + edge.safety;

        if (tentativeDistance < distances[neighbor]) {
          distances[neighbor] = tentativeDistance;
          safetyRatings[neighbor] = tentativeSafety;
          previous[neighbor] = current;
        }
      });
    }

    // Construct the path
    const path = [];
    let current = endId;

    if (previous[current] !== null || current === startId) {
      while (current !== null) {
        path.unshift(current);
        current = previous[current];
      }
    }

    // Calculate total distance and average safety rating
    let totalDistance = distances[endId];
    let totalSafety =
      safetyRatings[endId] / (path.length > 1 ? path.length - 1 : 1);

    return {
      path,
      distance: totalDistance === Infinity ? 0 : totalDistance,
      safety: totalSafety === Infinity ? 10 : totalSafety,
    };
  };

  // Reset the map view
  const handleReset = () => {
    setRoute(null);
    setSelectedEvacuation(null);
    setRouteSummary(null);

    if (mapRef.current && location) {
      mapRef.current.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    }
  };

  // Download map for offline use
  const handleDownloadMap = () => {
    Alert.alert(
      "Download Map",
      "This will download the Sta Monica, Hagonoy map for offline use (10MB). Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Download",
          onPress: () => {
            // Simulate download with a timeout
            setTimeout(() => {
              Alert.alert(
                "Download Complete",
                "Map data is now available offline"
              );
            }, 2000);
          },
        },
      ]
    );
  };

  // Determine marker color based on type
  const getMarkerColor = (type) => {
    switch (type) {
      case "evacuation":
        return "#4CAF50"; // Green
      case "flood":
        return "#FF9800"; // Orange
      case "danger":
        return "#F44336"; // Red
      default:
        return "#3884ff"; // Blue
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3884ff" />
          <Text style={styles.loadingText}>Loading map data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sta Monica, Hagonoy</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.headerButton} onPress={handleReset}>
              <Ionicons name="refresh" size={24} color="#3884ff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mapContainer}>
          {location ? (
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation
              showsMyLocationButton
            >
              {/* Evacuation Centers */}
              {EVACUATION_CENTERS.map((center) => (
                <Marker
                  key={`evac-${center.id}`}
                  coordinate={{
                    latitude: center.latitude,
                    longitude: center.longitude,
                  }}
                  pinColor={getMarkerColor(center.type)}
                  title={center.name}
                  description="Evacuation Center"
                  onPress={() => findSafeRoute(`evac-${center.id}`)}
                />
              ))}

              {/* Flood Zones */}
              {FLOOD_ZONES.map((zone) => (
                <Marker
                  key={`flood-${zone.id}`}
                  coordinate={{
                    latitude: zone.latitude,
                    longitude: zone.longitude,
                  }}
                  pinColor={getMarkerColor(zone.type)}
                  title={zone.name}
                  description="Flood Prone Area"
                />
              ))}

              {/* Danger Zones */}
              {DANGER_ZONES.map((zone) => (
                <Marker
                  key={`danger-${zone.id}`}
                  coordinate={{
                    latitude: zone.latitude,
                    longitude: zone.longitude,
                  }}
                  pinColor={getMarkerColor(zone.type)}
                  title={zone.name}
                  description="Danger Zone"
                />
              ))}

              {/* Route Display */}
              {route && (
                <Polyline
                  coordinates={route}
                  strokeWidth={4}
                  strokeColor={routeSummary?.safety.color || "#3884ff"}
                />
              )}
            </MapView>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map" size={50} color="#aaa" />
              <Text style={styles.mapPlaceholderText}>Map Error</Text>
              <Text style={styles.mapPlaceholderSubtext}>
                {errorMsg || "Could not load map"}
              </Text>
            </View>
          )}
        </View>

        {routeSummary ? (
          <View style={styles.routeSummaryContainer}>
            <Text style={styles.routeSummaryTitle}>
              Route to {selectedEvacuation?.name}
            </Text>

            <View style={styles.routeDetails}>
              <View style={styles.routeDetail}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.routeDetailText}>
                  ETA: {routeSummary.eta} minutes
                </Text>
              </View>

              <View style={styles.routeDetail}>
                <Ionicons name="walk-outline" size={20} color="#666" />
                <Text style={styles.routeDetailText}>
                  Distance: {routeSummary.distance} km
                </Text>
              </View>

              <View style={styles.routeDetail}>
                <Ionicons
                  name={
                    routeSummary.safety.text === "Safe"
                      ? "shield-checkmark"
                      : "warning"
                  }
                  size={20}
                  color={routeSummary.safety.color}
                />
                <Text
                  style={[
                    styles.routeDetailText,
                    { color: routeSummary.safety.color },
                  ]}
                >
                  Safety: {routeSummary.safety.text}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.startNavigationButton}
              onPress={() =>
                Alert.alert(
                  "Navigation",
                  "Turn-by-turn navigation would start here."
                )
              }
            >
              <Ionicons name="navigate" size={20} color="#fff" />
              <Text style={styles.startNavigationText}>Start Navigation</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.legendContainer}>
            <Text style={styles.legendTitle}>Map Legend</Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: "#4CAF50" }]}
                />
                <Text style={styles.legendText}>Evacuation Centers</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: "#FF9800" }]}
                />
                <Text style={styles.legendText}>Flood Areas</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: "#F44336" }]}
                />
                <Text style={styles.legendText}>Danger Zones</Text>
              </View>
            </View>
            <Text style={styles.legendHelp}>
              Tap any evacuation center to find the safest route.
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleDownloadMap}
          >
            <Ionicons name="download" size={24} color="#fff" />
            <Text style={styles.locationButtonText}>Download Map</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.locationButton}
            onPress={() =>
              Alert.alert(
                "Walk Mode",
                "Walk mode activated. The app will now guide you with voice instructions."
              )
            }
          >
            <Ionicons name="walk" size={24} color="#fff" />
            <Text style={styles.locationButtonText}>Walk Mode</Text>
          </TouchableOpacity>
        </View>
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
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  headerButtons: {
    flexDirection: "row",
  },
  headerButton: {
    marginLeft: 16,
  },
  mapContainer: {
    height: Dimensions.get("window").height * 0.5,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  map: {
    ...LAYOUT.fill,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#e9ecef",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  mapPlaceholderText: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
  },
  mapPlaceholderSubtext: {
    color: "#888",
    fontSize: 14,
  },
  legendContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  legendItems: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },
  legendHelp: {
    fontSize: 12,
    color: "#3884ff",
    fontStyle: "italic",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  locationButton: {
    backgroundColor: "#3884ff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.48,
  },
  locationButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  routeSummaryContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  routeSummaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  routeDetails: {
    marginBottom: 16,
  },
  routeDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  routeDetailText: {
    fontSize: 14,
    marginLeft: 8,
    color: "#444",
  },
  startNavigationButton: {
    backgroundColor: "#3884ff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  startNavigationText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  searchBar: {
    position: "absolute",
    top: SIZES?.lg || 16, // Add fallback values
    left: SIZES?.lg || 16,
    right: SIZES?.lg || 16,
    height: SIZES?.buttonHeight || 48,
    backgroundColor: COLORS.white,
    borderRadius: SIZES?.borderRadius || 8,
    paddingHorizontal: SIZES?.md || 12,
    ...LAYOUT.row,
    ...SHADOWS.medium,
  },
  searchInput: {
    ...LAYOUT.fill,
    height: "100%",
    marginLeft: SIZES?.sm || 8,
    color: COLORS.textDark,
    ...(FONTS?.body1 || {}),
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES?.cardRadius || 12,
    borderTopRightRadius: SIZES?.cardRadius || 12,
    padding: SIZES?.lg || 16,
    paddingBottom: (SIZES?.tabBarHeight || 64) + (SIZES?.lg || 16),
    ...SHADOWS.large,
  },
  locationItem: {
    ...LAYOUT.rowBetween,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  locationName: {
    ...FONTS.h4,
    color: COLORS.textDark,
  },
  locationAddress: {
    ...FONTS.body3,
    color: COLORS.textLight,
    marginTop: SIZES.xs,
  },
  locationDistance: {
    ...FONTS.body2,
    color: COLORS.primary,
    fontWeight: "600",
  },
});

export default LocationScreen;
