import * as Location from "expo-location";

/**
 * Convert address to coordinates with improved error handling and caching
 * @param {string} address - The address to geocode
 * @param {object} options - Optional parameters
 * @returns {Promise<object|null>} - Coordinates or null if not found
 */
// Cache for geocoding results to prevent redundant API calls
const geocodeCache = new Map();

export const geocodeAddress = async (address, options = {}) => {
  if (!address || typeof address !== "string") {
    return null;
  }

  const cacheKey = address.trim().toLowerCase();

  // Return cached result if available
  if (geocodeCache.has(cacheKey) && !options.bypassCache) {
    return geocodeCache.get(cacheKey);
  }

  try {
    const result = await Location.geocodeAsync(address);

    if (result && result.length > 0) {
      const coordinates = {
        latitude: result[0].latitude,
        longitude: result[0].longitude,
        accuracy: result[0].accuracy,
      };

      // Cache the result for future use
      geocodeCache.set(cacheKey, coordinates);

      return coordinates;
    }

    // Cache negative results to prevent repeated failed lookups
    geocodeCache.set(cacheKey, null);
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);

    // Implement exponential backoff for retries
    if (
      options.retry &&
      (!options.maxRetries || options.retry < options.maxRetries)
    ) {
      const nextRetry = (options.retry || 0) + 1;
      const delayMs = Math.min(1000 * Math.pow(2, nextRetry), 8000); // 2s, 4s, 8s max

      console.log(`Retrying geocode attempt ${nextRetry} after ${delayMs}ms`);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(
            geocodeAddress(address, {
              ...options,
              retry: nextRetry,
            })
          );
        }, delayMs);
      });
    }

    return null;
  }
};

/**
 * Convert coordinates to address with improved formatting and caching
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @param {object} options - Optional parameters
 * @returns {Promise<object|null>} - Address information or null if not found
 */
// Cache for reverse geocoding results
const reverseGeocodeCache = new Map();

export const reverseGeocodeLocation = async (
  latitude,
  longitude,
  options = {}
) => {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  // Round coordinates to 5 decimal places for cache key (about 1.1m precision)
  const lat = parseFloat(latitude.toFixed(5));
  const lng = parseFloat(longitude.toFixed(5));
  const cacheKey = `${lat},${lng}`;

  // Return cached result if available
  if (reverseGeocodeCache.has(cacheKey) && !options.bypassCache) {
    return reverseGeocodeCache.get(cacheKey);
  }

  try {
    const result = await Location.reverseGeocodeAsync(
      {
        latitude,
        longitude,
      },
      options
    );

    if (result && result.length > 0) {
      const location = result[0];

      // Create a more detailed and structured response
      const addressInfo = {
        name: location.name || "",
        street: location.street || "",
        district: location.district || "",
        city: location.city || "",
        region: location.region || "",
        postalCode: location.postalCode || "",
        country: location.country || "",
        countryCode: location.isoCountryCode || "",
        timezone: location.timezone || "",
        formattedAddress: formatAddress(location),
        coordinates: {
          latitude: lat,
          longitude: lng,
        },
      };

      // Cache the result
      reverseGeocodeCache.set(cacheKey, addressInfo);
      return addressInfo;
    }

    // Cache negative results
    reverseGeocodeCache.set(cacheKey, null);
    return null;
  } catch (error) {
    console.error("Reverse geocoding error:", error);

    // Implement exponential backoff for retries
    if (
      options.retry &&
      (!options.maxRetries || options.retry < options.maxRetries)
    ) {
      const nextRetry = (options.retry || 0) + 1;
      const delayMs = Math.min(1000 * Math.pow(2, nextRetry), 8000);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(
            reverseGeocodeLocation(latitude, longitude, {
              ...options,
              retry: nextRetry,
            })
          );
        }, delayMs);
      });
    }

    return null;
  }
};

/**
 * Format address components into a readable string
 * @param {object} addressComponents - Address components
 * @returns {string} - Formatted address
 */
const formatAddress = (addressComponents) => {
  // Create address parts array with only non-empty values
  const addressParts = [
    addressComponents.name,
    addressComponents.street,
    addressComponents.district,
    addressComponents.city,
    addressComponents.region,
    addressComponents.postalCode,
    addressComponents.country,
  ].filter(Boolean);

  // For addresses in the US, follow a standard format
  if (addressComponents.isoCountryCode === "US") {
    const mainPart = [addressComponents.name, addressComponents.street]
      .filter(Boolean)
      .join(", ");

    const secondaryPart = [
      addressComponents.city,
      addressComponents.region,
      addressComponents.postalCode,
    ]
      .filter(Boolean)
      .join(", ");

    return [mainPart, secondaryPart].filter(Boolean).join(", ");
  }

  // Default formatting: join with commas, limiting to 3 address parts for display brevity
  return addressParts.slice(0, 4).join(", ");
};

/**
 * Calculate distance between two coordinates using the Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} - Distance in kilometers
 */
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  // Input validation
  if (
    typeof lat1 !== "number" ||
    typeof lon1 !== "number" ||
    typeof lat2 !== "number" ||
    typeof lon2 !== "number"
  ) {
    console.warn("Invalid coordinates passed to haversineDistance");
    return 0;
  }

  const R = 6371; // Earth radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Return distance with 2 decimal precision
  return parseFloat((R * c).toFixed(2));
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Value in degrees
 * @returns {number} - Value in radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Get estimated travel time between two points
 * @param {number} distance - Distance in kilometers
 * @param {string} transportMode - Mode of transportation
 * @param {object} options - Additional options like traffic conditions
 * @returns {object} - Time estimate in different formats
 */
export const getEstimatedTime = (
  distance,
  transportMode = "car",
  options = {}
) => {
  if (typeof distance !== "number" || distance < 0) {
    console.warn("Invalid distance passed to getEstimatedTime");
    return { minutes: 0, formatted: "0 min" };
  }

  // Base speeds in km/h
  const baseSpeedsKmh = {
    car: 40,
    motorcycle: 30,
    bus: 20,
    walk: 5,
    bicycle: 15,
    boat: 25,
    emergency: 60,
  };

  // Get base speed or default to car speed
  const baseSpeed = baseSpeedsKmh[transportMode] || baseSpeedsKmh.car;

  // Apply adjustment factors
  let adjustedSpeed = baseSpeed;

  // Traffic condition adjustments
  if (options.trafficCondition) {
    const trafficFactor =
      {
        light: 1.1, // 10% faster than average
        normal: 1.0, // average speed
        moderate: 0.8, // 20% slower
        heavy: 0.6, // 40% slower
        severe: 0.4, // 60% slower
      }[options.trafficCondition] || 1.0;

    adjustedSpeed *= trafficFactor;
  }

  // Weather condition adjustments
  if (options.weatherCondition) {
    const weatherFactor =
      {
        clear: 1.0, // no impact
        cloudy: 0.95, // 5% slower
        rainy: 0.8, // 20% slower
        stormy: 0.6, // 40% slower
        flood: 0.4, // 60% slower
      }[options.weatherCondition] || 1.0;

    adjustedSpeed *= weatherFactor;
  }

  // Emergency adjustment - override all for emergency vehicles in emergency mode
  if (transportMode === "emergency" && options.emergencyMode) {
    adjustedSpeed = baseSpeedsKmh.emergency * 1.2; // 20% faster than base emergency speed
  }

  // Calculate time in hours, then convert to minutes
  const timeHours = distance / adjustedSpeed;
  const minutes = Math.round(timeHours * 60);

  // Format output
  let formatted = "";
  if (minutes < 60) {
    formatted = `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    formatted =
      remainingMinutes > 0
        ? `${hours} hr ${remainingMinutes} min`
        : `${hours} hr`;
  }

  return {
    minutes,
    formatted,
    hours: timeHours,
    speed: adjustedSpeed,
  };
};

/**
 * Clear geocoding caches
 */
export const clearLocationCaches = () => {
  geocodeCache.clear();
  reverseGeocodeCache.clear();
  console.log("Location caches cleared");
};

/**
 * Get nearest points from a reference location
 * @param {object} referencePoint - Reference coordinates
 * @param {array} points - Array of points to check
 * @param {number} limit - Maximum number of points to return
 * @returns {array} - Array of nearest points with distances
 */
export const getNearestPoints = (referencePoint, points, limit = 5) => {
  if (
    !referencePoint ||
    !referencePoint.latitude ||
    !referencePoint.longitude ||
    !Array.isArray(points)
  ) {
    return [];
  }

  // Calculate distance for each point
  const pointsWithDistance = points.map((point) => {
    const distance = haversineDistance(
      referencePoint.latitude,
      referencePoint.longitude,
      point.latitude,
      point.longitude
    );

    return { ...point, distance };
  });

  // Sort by distance and limit results
  return pointsWithDistance
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
};

/**
 * Get a human-friendly distance description
 * @param {number} distance - Distance in kilometers
 * @returns {string} - Formatted distance
 */
export const getHumanFriendlyDistance = (distance) => {
  if (typeof distance !== "number") return "Unknown distance";

  if (distance < 0.1) {
    // Less than 100m
    const meters = Math.round(distance * 1000);
    return `${meters} m`;
  } else if (distance < 1) {
    // Less than 1km, show in meters with 50m precision
    const meters = Math.round((distance * 1000) / 50) * 50;
    return `${meters} m`;
  } else if (distance < 10) {
    // Less than 10km, show with 1 decimal
    return `${distance.toFixed(1)} km`;
  } else {
    // 10km or more, show as integer
    return `${Math.round(distance)} km`;
  }
};

/**
 * Get compass bearing between two points
 * @param {number} startLat - Start latitude
 * @param {number} startLng - Start longitude
 * @param {number} destLat - Destination latitude
 * @param {number} destLng - Destination longitude
 * @returns {number} - Bearing in degrees (0-360)
 */
export const getBearing = (startLat, startLng, destLat, destLng) => {
  startLat = toRadians(startLat);
  startLng = toRadians(startLng);
  destLat = toRadians(destLat);
  destLng = toRadians(destLng);

  const y = Math.sin(destLng - startLng) * Math.cos(destLat);
  const x =
    Math.cos(startLat) * Math.sin(destLat) -
    Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);

  let bearing = Math.atan2(y, x) * (180 / Math.PI);
  bearing = (bearing + 360) % 360; // Normalize to 0-360

  return bearing;
};

/**
 * Get compass direction from bearing
 * @param {number} bearing - Bearing in degrees
 * @returns {string} - Cardinal direction (N, NE, E, etc.)
 */
export const getCompassDirection = (bearing) => {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"];
  return directions[Math.round(bearing / 45) % 8];
};

/**
 * Format navigation instructions based on bearing
 * @param {number} bearing - Bearing in degrees
 * @returns {object} - Navigation instruction details
 */
export const getNavigationInstruction = (bearing) => {
  // Convert bearing to 0-360 range
  bearing = ((bearing % 360) + 360) % 360;

  let action, icon;

  if (bearing < 22.5 || bearing >= 337.5) {
    action = "Head north";
    icon = "arrow-up";
  } else if (bearing < 67.5) {
    action = "Head northeast";
    icon = "arrow-up-right";
  } else if (bearing < 112.5) {
    action = "Head east";
    icon = "arrow-forward";
  } else if (bearing < 157.5) {
    action = "Head southeast";
    icon = "arrow-down-right";
  } else if (bearing < 202.5) {
    action = "Head south";
    icon = "arrow-down";
  } else if (bearing < 247.5) {
    action = "Head southwest";
    icon = "arrow-down-left";
  } else if (bearing < 292.5) {
    action = "Head west";
    icon = "arrow-back";
  } else {
    action = "Head northwest";
    icon = "arrow-up-left";
  }

  return { action, icon, bearing };
};

/**
 * Check if a point is inside a polygon (for flood zone detection)
 * @param {object} point - Point coordinates
 * @param {array} polygon - Array of polygon coordinates
 * @returns {boolean} - True if point is inside polygon
 */
export const isPointInPolygon = (point, polygon) => {
  if (!point || !polygon || !Array.isArray(polygon) || polygon.length < 3) {
    return false;
  }

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].latitude;
    const yi = polygon[i].longitude;
    const xj = polygon[j].latitude;
    const yj = polygon[j].longitude;

    const intersect =
      yi > point.longitude !== yj > point.longitude &&
      point.latitude < ((xj - xi) * (point.longitude - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
};
