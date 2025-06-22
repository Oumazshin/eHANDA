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
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, SHADOWS, LAYOUT } from "../styles/theme";

// Map region and data constants
const REGION = {
  latitude: 14.8321,
  longitude: 120.7354,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

const LOCATIONS = {
  EVACUATION_CENTERS: [
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
  ],
  FLOOD_ZONES: [
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
  ],
  DANGER_ZONES: [
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
  ],
};

// Graph nodes and edges for pathfinding
const GRAPH_NODES = [
  { id: "start", type: "node" }, // Will be replaced with user's current location
  ...LOCATIONS.EVACUATION_CENTERS.map((center) => ({
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

const GRAPH_EDGES = [
  { from: "node-1", to: "evac-1", distance: 0.5, safety: 2 },
  { from: "node-2", to: "evac-1", distance: 0.3, safety: 1 },
  { from: "node-2", to: "node-3", distance: 0.6, safety: 4 },
  { from: "node-3", to: "evac-2", distance: 0.4, safety: 2 },
  { from: "node-1", to: "node-5", distance: 0.5, safety: 6 },
  { from: "node-5", to: "node-4", distance: 0.7, safety: 7 },
  { from: "node-4", to: "evac-2", distance: 0.2, safety: 3 },
  { from: "node-5", to: "evac-3", distance: 0.8, safety: 5 },
];

const LocationScreen = ({ navigation = {} }) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvacuation, setSelectedEvacuation] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeSummary, setRouteSummary] = useState(null);
  const mapRef = useRef(null);

  // Get current location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        setLoading(false);
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(location);
      } catch (error) {
        setErrorMsg("Could not get current location");
        // Fall back to Sta Monica center
        setLocation({
          coords: { latitude: REGION.latitude, longitude: REGION.longitude },
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Reset route on screen focus
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setRoute(null);
        setSelectedEvacuation(null);
        setRouteSummary(null);
      };
    }, [])
  );

  // Helper functions for distance and safety calculations
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const calculateSafetyRating = (latitude, longitude) => {
    let maxDanger = 1; // Default safety

    // Check proximity to flood zones
    [...LOCATIONS.FLOOD_ZONES, ...LOCATIONS.DANGER_ZONES].forEach((zone) => {
      const distance =
        calculateDistance(latitude, longitude, zone.latitude, zone.longitude) *
        1000; // to meters
      if (distance < zone.radius) {
        const dangerFactor =
          (zone.type === "danger" ? 8 : 5) * (1 - distance / zone.radius);
        maxDanger = Math.max(maxDanger, dangerFactor);
      }
    });

    return Math.round(maxDanger);
  };

  const getSafetyRating = (rating) =>
    rating < 3
      ? { text: "Safe", color: "#4CAF50" }
      : rating < 7
      ? { text: "Caution", color: "#FF9800" }
      : { text: "Dangerous", color: "#F44336" };

  // Dijkstra's algorithm implementation
  const dijkstra = (nodes, edges, startId, endId) => {
    const distances = {},
      previous = {},
      safetyRatings = {};
    const unvisited = new Set();

    // Initialize
    nodes.forEach((node) => {
      distances[node.id] = node.id === startId ? 0 : Infinity;
      safetyRatings[node.id] = node.id === startId ? 0 : Infinity;
      previous[node.id] = null;
      unvisited.add(node.id);
    });

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let current = [...unvisited].reduce(
        (min, nodeId) => (distances[nodeId] < distances[min] ? nodeId : min),
        [...unvisited][0]
      );

      if (distances[current] === Infinity || current === endId) break;
      unvisited.delete(current);

      // Update distances to neighbors
      edges
        .filter((edge) => edge.from === current)
        .forEach((edge) => {
          const { to: neighbor, distance, safety } = edge;
          const weightedDistance = 0.7 * distance + 0.3 * (safety / 10);
          const tentativeDistance = distances[current] + weightedDistance;

          if (tentativeDistance < distances[neighbor]) {
            distances[neighbor] = tentativeDistance;
            safetyRatings[neighbor] = safetyRatings[current] + safety;
            previous[neighbor] = current;
          }
        });
    }

    // Build path
    const path = [];
    let current = endId;
    while (current) {
      path.unshift(current);
      current = previous[current];
    }

    return {
      path,
      distance: distances[endId] === Infinity ? 0 : distances[endId],
      safety: path.length <= 1 ? 10 : safetyRatings[endId] / (path.length - 1),
    };
  };

  // Find safe route to evacuation center
  const findSafeRoute = (destinationId) => {
    setLoading(true);

    if (!location) {
      Alert.alert("Error", "Your location is not available");
      setLoading(false);
      return;
    }

    // Create dynamic graph with current location
    const currentGraph = [...GRAPH_NODES];
    const currentEdges = [...GRAPH_EDGES];

    // Update start node with current location
    currentGraph[0] = {
      id: "start",
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      type: "node",
    };

    // Add connections from start to other nodes
    GRAPH_NODES.slice(1).forEach((node) => {
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        node.latitude,
        node.longitude
      );

      if (distance < 1) {
        // Only connect if within 1km
        currentEdges.push({
          from: "start",
          to: node.id,
          distance,
          safety: calculateSafetyRating(node.latitude, node.longitude),
        });
      }
    });

    // Find target evacuation center
    const destination = LOCATIONS.EVACUATION_CENTERS.find(
      (center) => `evac-${center.id}` === destinationId
    );

    if (!destination) {
      Alert.alert("Error", "Selected evacuation center not found");
      setLoading(false);
      return;
    }

    // Run Dijkstra's algorithm
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
      return { latitude: node.latitude, longitude: node.longitude };
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
    setSelectedEvacuation(destination);

    // Fit map to route
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(routeCoordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }

    setLoading(false);
  };

  // UI handlers
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

  const handleDownloadMap = () => {
    Alert.alert(
      "Download Map",
      "This will download the Sta Monica, Hagonoy map for offline use (10MB). Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Download",
          onPress: () =>
            setTimeout(() => {
              Alert.alert(
                "Download Complete",
                "Map data is now available offline"
              );
            }, 2000),
        },
      ]
    );
  };

  // Render markers based on location type
  const renderMapMarkers = () => {
    const allLocations = [
      ...LOCATIONS.EVACUATION_CENTERS.map((loc) => ({
        ...loc,
        description: "Evacuation Center",
        onPress: () => findSafeRoute(`evac-${loc.id}`),
      })),
      ...LOCATIONS.FLOOD_ZONES.map((loc) => ({
        ...loc,
        description: "Flood Prone Area",
      })),
      ...LOCATIONS.DANGER_ZONES.map((loc) => ({
        ...loc,
        description: "Danger Zone",
      })),
    ];

    return allLocations.map((loc) => (
      <Marker
        key={`${loc.type}-${loc.id}`}
        coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
        pinColor={
          loc.type === "evacuation"
            ? "#4CAF50"
            : loc.type === "flood"
            ? "#FF9800"
            : "#F44336"
        }
        title={loc.name}
        description={loc.description}
        onPress={loc.onPress}
      />
    ));
  };

  // Loading screen
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
          <TouchableOpacity style={styles.headerButton} onPress={handleReset}>
            <Ionicons name="refresh" size={24} color="#3884ff" />
          </TouchableOpacity>
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
              {renderMapMarkers()}

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
              {[
                {
                  icon: "time-outline",
                  text: `ETA: ${routeSummary.eta} minutes`,
                  color: "#666",
                },
                {
                  icon: "walk-outline",
                  text: `Distance: ${routeSummary.distance} km`,
                  color: "#666",
                },
                {
                  icon:
                    routeSummary.safety.text === "Safe"
                      ? "shield-checkmark"
                      : "warning",
                  text: `Safety: ${routeSummary.safety.text}`,
                  color: routeSummary.safety.color,
                },
              ].map((item, index) => (
                <View key={index} style={styles.routeDetail}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                  <Text style={[styles.routeDetailText, { color: item.color }]}>
                    {item.text}
                  </Text>
                </View>
              ))}
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
              {[
                { color: "#4CAF50", text: "Evacuation Centers" },
                { color: "#FF9800", text: "Flood Areas" },
                { color: "#F44336", text: "Danger Zones" },
              ].map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendColor,
                      { backgroundColor: item.color },
                    ]}
                  />
                  <Text style={styles.legendText}>{item.text}</Text>
                </View>
              ))}
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
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  headerButton: { marginLeft: 16 },
  mapContainer: {
    height: Dimensions.get("window").height * 0.5,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  map: { ...LAYOUT.fill },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#e9ecef",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  mapPlaceholderText: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
  },
  mapPlaceholderSubtext: { color: "#888", fontSize: 14 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#666" },

  // Legend styles
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
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendColor: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  legendText: { fontSize: 12, color: "#666" },
  legendHelp: { fontSize: 12, color: "#3884ff", fontStyle: "italic" },

  // Route summary styles
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
  routeDetails: { marginBottom: 16 },
  routeDetail: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  routeDetailText: { fontSize: 14, marginLeft: 8 },

  // Button styles
  buttonContainer: { flexDirection: "row", justifyContent: "space-between" },
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
  locationButtonText: { color: "#fff", fontWeight: "600", marginLeft: 8 },
  startNavigationButton: {
    backgroundColor: "#3884ff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  startNavigationText: { color: "#fff", fontWeight: "600", marginLeft: 8 },
});

export default LocationScreen;
