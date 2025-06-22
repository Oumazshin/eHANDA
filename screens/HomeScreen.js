import React, { useEffect, useRef, memo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Animated,
  StatusBar,
  FlatList,
  Dimensions,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Import theme safely
import { COLORS, FONTS, SHADOWS, LAYOUT } from "../styles/theme";

// Safe sizes with optimized values for better visual hierarchy
const { width } = Dimensions.get("window");
const SIZES = {
  xs: 4,
  sm: 8,
  md: 14, // Reduced from 16 for tighter spacing
  lg: 20, // Reduced from 24 for more compact layout
  xl: 28, // Reduced from 32 for more compact sections
  xxl: 36, // Reduced from 40 for better proportions
  screenPadding: 16, // Reduced side padding for cleaner look
  tabBarHeight: 64,
  borderRadius: 10, // Reduced for more minimal appearance
  cardRadius: 14, // Reduced for more minimal look
  iconSize: 24,
  avatarMedium: 42, // Slightly smaller for cleaner proportions
  width,
};

// Create a standalone LAYOUT object as fallback if import fails
const safeLayout = LAYOUT || {
  row: { flexDirection: "row", alignItems: "center" },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  center: { justifyContent: "center", alignItems: "center" },
  fill: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  columnCenter: {
    justifyContent: "center",
    alignItems: "center",
  },
};

import Card from "../components/Card";
import { LinearGradient } from "expo-linear-gradient";

// Animated card component with memo for performance optimization
const AnimatedCard = memo(({ delay = 0, children, style }) => {
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateY }],
          opacity,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
});

// QuickActionButton with notification badge - fixed implementation
const QuickActionButton = memo(
  ({ icon, title, onPress, color, delay, style, badgeCount }) => {
    return (
      <AnimatedCard delay={delay} style={style}>
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: color }]}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <View style={styles.quickActionIcon}>
            <Ionicons name={icon} size={18} color="#FFFFFF" />

            {badgeCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{badgeCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.quickActionTitle} numberOfLines={2}>
            {title}
          </Text>
        </TouchableOpacity>
      </AnimatedCard>
    );
  }
);

// News item component for latest alerts and updates
const NewsItem = memo(({ title, time, type, onPress }) => {
  const getTypeStyles = () => {
    switch (type) {
      case "warning":
        return {
          icon: "warning-outline",
          color: COLORS.warning || "#F59E0B",
        };
      case "alert":
        return {
          icon: "alert-circle-outline",
          color: COLORS.danger || "#EF4444",
        };
      default:
        return {
          icon: "information-circle-outline",
          color: COLORS.info || "#3B82F6",
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <TouchableOpacity
      style={styles.newsItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.newsIconContainer,
          { backgroundColor: typeStyles.color + "20" },
        ]}
      >
        <Ionicons name={typeStyles.icon} size={18} color={typeStyles.color} />
      </View>
      <View style={styles.newsContent}>
        <Text style={styles.newsTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.newsTime}>{time}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={COLORS?.textLight || "#9CA3AF"}
      />
    </TouchableOpacity>
  );
});

const WeatherCard = memo(() => (
  <AnimatedCard delay={200}>
    <Card style={styles.weatherCard} shadowLevel="medium">
      <View style={safeLayout.rowBetween}>
        <Text style={styles.weatherTitle}>Weather Forecast</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreText}>More details</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={COLORS?.primary || "#2563EB"}
          />
        </TouchableOpacity>
      </View>

      <View style={[safeLayout.rowBetween, { marginTop: SIZES.md }]}>
        <View>
          <Text style={styles.weatherTemp}>28°C</Text>
          <Text style={styles.weatherDesc}>Partly Cloudy</Text>
          <View style={safeLayout.row}>
            <Ionicons
              name="location-outline"
              size={14}
              color={COLORS?.textLight || "#9CA3AF"}
            />
            <Text style={styles.weatherLocation}>Quezon City</Text>
          </View>
        </View>
        <View style={styles.weatherIconContainer}>
          <Ionicons
            name="partly-sunny"
            size={64}
            color={COLORS?.secondary || "#F59E0B"}
          />
        </View>
      </View>

      <View style={styles.weatherDetails}>
        <View style={styles.weatherDetailItem}>
          <Ionicons
            name="water-outline"
            size={18}
            color={COLORS?.info || "#3B82F6"}
          />
          <Text style={styles.weatherDetailValue}>68%</Text>
          <Text style={styles.weatherDetailLabel}>Humidity</Text>
        </View>

        <View style={styles.weatherDetailItem}>
          <Ionicons
            name="speedometer-outline"
            size={18}
            color={COLORS?.info || "#3B82F6"}
          />
          <Text style={styles.weatherDetailValue}>1013</Text>
          <Text style={styles.weatherDetailLabel}>Pressure</Text>
        </View>

        <View style={styles.weatherDetailItem}>
          <Ionicons
            name="navigate-outline"
            size={18}
            color={COLORS?.info || "#3B82F6"}
          />
          <Text style={styles.weatherDetailValue}>8 km/h</Text>
          <Text style={styles.weatherDetailLabel}>Wind</Text>
        </View>
      </View>
    </Card>
  </AnimatedCard>
));

const AlertCard = memo(({ navigation }) => (
  <AnimatedCard delay={300}>
    <Card style={styles.alertCard} shadowLevel="small">
      <View style={styles.alertHeader}>
        <View style={styles.alertIconContainer}>
          <Ionicons name="warning" size={22} color="#ffffff" />
        </View>
        <Text style={styles.alertHeaderText}>WEATHER ALERT</Text>
      </View>
      <Text style={styles.alertTitle}>Flood Warning</Text>
      <Text style={styles.alertDesc}>
        Light to moderate rain expected in your area for the next 24 hours.
        Potential for localized flooding in low-lying areas.
      </Text>

      <View style={styles.alertActions}>
        <TouchableOpacity
          style={styles.alertAction}
          onPress={() => navigation.navigate("Checklist")}
        >
          <Text style={styles.alertActionText}>View Safety Tips</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={COLORS?.primary || "#2563EB"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.alertAction}
          onPress={() => navigation.navigate("Location")}
        >
          <Text style={styles.alertActionText}>Evacuation Routes</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={COLORS?.primary || "#2563EB"}
          />
        </TouchableOpacity>
      </View>
    </Card>
  </AnimatedCard>
));

const HomeScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);

  // Navigation functions
  const goToLocation = useCallback(
    () => navigation.navigate("Location"),
    [navigation]
  );
  const goToChecklist = useCallback(
    () => navigation.navigate("Checklist"),
    [navigation]
  );
  const goToContacts = useCallback(
    () => navigation.navigate("Contacts"),
    [navigation]
  );

  // Current date for welcome message
  const currentDate = new Date();
  const options = { weekday: "long", month: "long", day: "numeric" };
  const dateString = currentDate.toLocaleDateString("en-US", options);

  // Sample news/alerts data
  const newsItems = [
    {
      id: "1",
      title: "Flood Warning: Heavy Rain Expected in Quezon City",
      time: "30 mins ago",
      type: "warning",
    },
    {
      id: "2",
      title: 'PAGASA: Tropical Depression "Agaton" Update',
      time: "2 hours ago",
      type: "alert",
    },
    {
      id: "3",
      title: "NDRRMC Advisory: Earthquake Preparedness",
      time: "5 hours ago",
      type: "info",
    },
  ];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: "#FCFCFC" }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS?.background || "#F9FAFB"}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS?.primary || "#2563EB"]}
          />
        }
      >
        {/* Header */}
        <AnimatedCard delay={100}>
          <View style={styles.header}>
            <View>
              <Text style={styles.welcomeText}>Welcome to eHANDA</Text>
              <Text style={styles.dateText}>{dateString}</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("Profile")}
              style={styles.profileButton}
            >
              <Image
                source={{
                  uri: "https://ui-avatars.com/api/?name=John+Doe&background=2563EB&color=fff&size=128",
                }}
                style={styles.avatar}
              />
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        {/* Weather Card */}
        <WeatherCard />

        {/* Alert Card */}
        <AlertCard navigation={navigation} />

        {/* Quick Actions */}
        <AnimatedCard delay={400}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={COLORS?.primary || "#2563EB"}
              />
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        {/* Update the quick actions container to use flex layout */}
        <View style={styles.quickActionsContainer}>
          <QuickActionButton
            icon="map-outline"
            title="Find Safe Routes"
            onPress={goToLocation}
            color="#2563EB" // Hardcoded color for reliability
            delay={450}
            style={styles.quickActionItem}
          />
          <QuickActionButton
            icon="list-outline"
            title="Emergency Checklist"
            onPress={goToChecklist}
            color="#10B981" // Hardcoded color for reliability
            delay={500}
            style={styles.quickActionItem}
            badgeCount={3}
          />
          <QuickActionButton
            icon="call-outline"
            title="Emergency Contacts"
            onPress={goToContacts}
            color="#F59E0B" // Hardcoded color for reliability
            delay={550}
            style={styles.quickActionItem}
          />
        </View>

        {/* Latest Updates */}
        <AnimatedCard delay={800}>
          <Text style={styles.sectionTitle}>Latest Updates</Text>

          {newsItems.map((item) => (
            <NewsItem
              key={item.id}
              title={item.title}
              time={item.time}
              type={item.type}
              onPress={() => {}}
            />
          ))}
        </AnimatedCard>

        {/* Safety Tip */}
        <AnimatedCard delay={900}>
          <Card style={styles.tipCard}>
            <View style={safeLayout.row}>
              <Ionicons
                name="bulb"
                size={22}
                color={COLORS?.primary || "#2563EB"}
              />
              <Text style={styles.tipHeaderText}>DAILY SAFETY TIP</Text>
            </View>
            <Text style={styles.tipDesc}>
              Always keep emergency supplies in an easily accessible location
              and ensure your family knows the evacuation plan. Consider
              creating a "go-bag" with essentials.
            </Text>
            <TouchableOpacity style={styles.tipAction}>
              <Text style={styles.tipActionText}>View All Safety Tips</Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={COLORS?.primary || "#2563EB"}
              />
            </TouchableOpacity>
          </Card>
        </AnimatedCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Container styles - sleeker spacing
  safeArea: {
    flex: 1,
    backgroundColor: COLORS?.background || "#FCFCFC", // Lighter background for minimal look
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.screenPadding,
    paddingBottom: SIZES.tabBarHeight + SIZES.md, // Reduced bottom padding
  },

  // Header section - cleaner alignment
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.lg, // Reduced for tighter layout
    paddingTop: SIZES.sm, // Reduced top padding
  },
  welcomeText: {
    fontSize: 20, // Reduced for cleaner look
    fontWeight: "600", // Lighter weight for minimal aesthetic
    color: COLORS?.textDark || "#222222",
    marginBottom: 2, // Tighter spacing
  },
  dateText: {
    fontSize: 14, // Reduced for cleaner look
    color: COLORS?.textLight || "#777777",
    marginTop: 1, // Tighter spacing
  },
  profileButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 }, // Reduced shadow
    shadowOpacity: 0.08, // Lighter shadow for minimal look
    shadowRadius: 2,
    elevation: 1, // Reduced elevation
    borderRadius: SIZES.avatarMedium / 2,
  },
  avatar: {
    width: SIZES.avatarMedium,
    height: SIZES.avatarMedium,
    borderRadius: SIZES.avatarMedium / 2,
  },

  // Section headers - cleaner spacing
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: SIZES.sm, // Tighter vertical margins
    paddingVertical: 2, // Reduced padding for minimal look
  },
  sectionTitle: {
    fontSize: 18, // Reduced for cleaner aesthetic
    fontWeight: "600", // Lighter weight for minimal look
    color: COLORS?.textDark || "#222222",
    marginVertical: SIZES.sm, // Tighter spacing
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6, // Reduced for cleaner touch target
    paddingHorizontal: 2,
  },
  viewAllText: {
    fontSize: 13, // Smaller for minimal look
    color: COLORS?.primary || "#2563EB",
    marginRight: 2, // Tighter spacing
    fontWeight: "500",
  },

  // Quick actions - cleaner layout
  quickActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SIZES.lg, // Reduced for tighter layout
    marginHorizontal: -SIZES.xs / 2, // Tighter negative margin
  },
  quickActionItem: {
    flex: 1,
    marginHorizontal: SIZES.xs / 2, // Tighter horizontal spacing
    aspectRatio: 0.95, // Slightly squarer for cleaner look
    borderRadius: SIZES.cardRadius,
    maxWidth: (SIZES.width - SIZES.screenPadding * 2) / 3 - SIZES.sm / 2, // Adjusted for tighter spacing
  },
  quickActionButton: {
    width: "100%",
    height: "100%",
    borderRadius: SIZES.cardRadius,
    padding: SIZES.xs, // Reduced internal padding for cleaner look
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, // Reduced shadow opacity for minimal look
    shadowRadius: 3,
    elevation: 3, // Reduced elevation
    overflow: "hidden",
    paddingVertical: SIZES.sm, // Tighter padding
  },
  quickActionIcon: {
    width: SIZES.iconSize * 1.7, // Slightly smaller for minimal look
    height: SIZES.iconSize * 1.7,
    borderRadius: SIZES.iconSize,
    backgroundColor: "rgba(255,255,255,0.15)", // More subtle background
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SIZES.sm, // Tighter spacing
    position: "relative",
  },
  quickActionTitle: {
    fontSize: 11, // Smaller text for minimal look
    lineHeight: 14, // Adjusted line height
    color: "#FFFFFF",
    fontWeight: "500", // Slightly lighter weight
    textAlign: "center",
    marginTop: SIZES.xs / 2, // Tighter top margin
  },

  // Weather card - sleeker internal spacing
  weatherCard: {
    padding: SIZES.lg, // Reduced padding for cleaner look
    marginBottom: SIZES.lg, // Reduced margin for tighter layout
  },
  weatherTitle: {
    fontSize: 16, // Smaller for minimal aesthetic
    fontWeight: "600", // Lighter weight
    color: COLORS?.textDark || "#222222",
  },
  weatherTemp: {
    fontSize: 34, // Slightly smaller for cleaner proportion
    fontWeight: "600", // Lighter weight for minimal look
    marginBottom: 0, // Tighter spacing
    color: COLORS?.textDark || "#222222",
  },
  weatherDesc: {
    fontSize: 14, // Smaller for minimal look
    color: COLORS?.textDark || "#222222",
    marginBottom: 2, // Tighter spacing
  },
  weatherLocation: {
    fontSize: 13, // Smaller for minimal look
    color: COLORS?.textLight || "#777777",
    marginLeft: 2, // Tighter spacing
  },
  weatherIconContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingRight: 0, // Removed unnecessary padding
  },
  weatherDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SIZES.md, // Reduced top margin
    paddingTop: SIZES.sm, // Reduced top padding
    borderTopWidth: 1,
    borderTopColor: COLORS?.border || "#EEEEEE", // Lighter border for minimal look
  },
  weatherDetailItem: {
    alignItems: "center",
    flex: 1,
    paddingVertical: SIZES.xs / 2, // Tighter padding
  },
  weatherDetailValue: {
    fontSize: 14, // Smaller for minimal look
    fontWeight: "600", // Lighter weight
    color: COLORS?.textDark || "#222222",
    marginTop: 4, // Tighter spacing
  },
  weatherDetailLabel: {
    fontSize: 11, // Smaller for minimal look
    color: COLORS?.textLight || "#777777",
    marginTop: 1, // Tighter spacing
  },
  moreButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4, // Reduced padding for cleaner touch target
    paddingHorizontal: 2,
  },
  moreText: {
    fontSize: 13, // Smaller for minimal look
    color: COLORS?.primary || "#2563EB",
    marginRight: 2, // Tighter spacing
    fontWeight: "500",
  },

  // Alert card - sleeker internal spacing
  alertCard: {
    padding: SIZES.lg, // Reduced padding for cleaner look
    marginBottom: SIZES.lg, // Reduced for tighter layout
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SIZES.sm, // Reduced for tighter spacing
  },
  alertIconContainer: {
    width: 32, // Slightly smaller for minimal look
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS?.warning || "#F59E0B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SIZES.sm, // Tighter spacing
  },
  alertHeaderText: {
    fontSize: 12, // Smaller for minimal look
    fontWeight: "600", // Lighter weight
    color: COLORS?.warning || "#F59E0B",
    letterSpacing: 0.8, // Slightly reduced letter spacing for cleaner look
  },
  alertTitle: {
    fontSize: 18, // Smaller for cleaner proportion
    fontWeight: "600", // Lighter weight for minimal look
    color: COLORS?.textDark || "#222222",
    marginBottom: SIZES.xs, // Tighter spacing
  },
  alertDesc: {
    fontSize: 14, // Smaller for minimal look
    lineHeight: 20, // Reduced line height for cleaner look
    color: COLORS?.textLight || "#555555", // Slightly darker for better readability
    marginBottom: SIZES.sm, // Tighter spacing
  },
  alertActions: {
    marginTop: SIZES.sm, // Reduced top margin
  },
  alertAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SIZES.sm, // Tighter padding
    borderBottomWidth: 1,
    borderBottomColor: COLORS?.border || "#EEEEEE", // Lighter border
  },
  alertActionText: {
    fontSize: 14, // Smaller for minimal look
    color: COLORS?.primary || "#2563EB",
    fontWeight: "500",
  },

  // News items - sleeker spacing and sizing
  newsItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS?.white || "#FFFFFF",
    padding: SIZES.sm, // Reduced padding for cleaner look
    borderRadius: SIZES.borderRadius,
    marginBottom: SIZES.sm, // Tighter bottom margin
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 }, // Reduced shadow
    shadowOpacity: 0.07, // Lighter shadow for minimal look
    shadowRadius: 2,
    elevation: 1, // Reduced elevation
  },
  newsIconContainer: {
    width: 40, // Slightly smaller for minimal look
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SIZES.sm, // Tighter spacing
  },
  newsContent: {
    flex: 1,
    marginRight: SIZES.xs, // Tighter spacing
    paddingVertical: 1, // Reduced padding
  },
  newsTitle: {
    fontSize: 14, // Smaller for minimal look
    fontWeight: "500", // Lighter weight
    color: COLORS?.textDark || "#222222",
    marginBottom: 4, // Tighter spacing
  },
  newsTime: {
    fontSize: 12, // Smaller for minimal look
    color: COLORS?.textLight || "#777777",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS?.border || "#EEEEEE", // Lighter border
    marginVertical: SIZES.xs, // Tighter spacing
  },

  // Tip card - sleeker internal spacing
  tipCard: {
    padding: SIZES.lg, // Reduced padding for cleaner look
    marginTop: SIZES.md, // Reduced top margin
    marginBottom: SIZES.xl, // Reduced bottom margin
    backgroundColor: COLORS?.primary + "06" || "#2563EB06", // Lighter background for minimal look
  },
  tipHeaderText: {
    fontSize: 12, // Smaller for minimal look
    fontWeight: "600", // Lighter weight
    color: COLORS?.primary || "#2563EB",
    marginLeft: SIZES.xs, // Tighter spacing
    letterSpacing: 0.8, // Slightly reduced letter spacing
  },
  tipDesc: {
    fontSize: 14, // Smaller for minimal look
    lineHeight: 20, // Reduced line height for cleaner look
    color: COLORS?.textDark || "#222222",
    marginTop: SIZES.sm, // Tighter spacing
    marginBottom: SIZES.sm, // Tighter spacing
  },
  tipAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4, // Reduced padding for cleaner touch target
  },
  tipActionText: {
    fontSize: 14, // Smaller for minimal look
    color: COLORS?.primary || "#2563EB",
    marginRight: 4, // Tighter spacing
    fontWeight: "500", // Lighter weight for minimal look
  },

  // Badge - sleeker minimal look
  badgeContainer: {
    position: "absolute",
    top: -4, // Adjusted positioning
    right: -4,
    backgroundColor: "#EF4444",
    minWidth: 18, // Smaller for minimal look
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5, // Thinner border for minimal look
    borderColor: "#FFFFFF",
    zIndex: 1,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9, // Smaller for minimal look
    fontWeight: "600", // Slightly lighter weight
    textAlign: "center",
    paddingHorizontal: 2, // Tighter padding
  },
});

// Export component with memo for optimal performance
export default memo(HomeScreen);
