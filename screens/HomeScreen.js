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

// Safe sizes without potential undefined references
const { width } = Dimensions.get("window");
const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  screenPadding: 16,
  screenHorizontalPadding: 16,
  tabBarHeight: 64,
  borderRadius: 8,
  cardRadius: 12,
  iconSize: 24,
  avatarMedium: 44,
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
            <Ionicons name={icon} size={20} color="#FFFFFF" />

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
        <Ionicons name={typeStyles.icon} size={20} color={typeStyles.color} />
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
            size={68}
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
    <SafeAreaView style={styles.safeArea}>
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
  // Container styles
  safeArea: {
    flex: 1,
    backgroundColor: COLORS?.background || "#F9FAFB",
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.screenPadding,
    paddingBottom: SIZES.tabBarHeight + SIZES.screenPadding,
  },

  // Header section
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.lg,
    paddingTop: SIZES.sm,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS?.textDark || "#111827",
  },
  dateText: {
    fontSize: 14,
    color: COLORS?.textLight || "#9CA3AF",
    marginTop: SIZES.xs / 2,
  },
  profileButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderRadius: SIZES.avatarMedium / 2,
  },
  avatar: {
    width: SIZES.avatarMedium,
    height: SIZES.avatarMedium,
    borderRadius: SIZES.avatarMedium / 2,
  },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: SIZES.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS?.textDark || "#111827",
    marginVertical: SIZES.md,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS?.primary || "#2563EB",
    marginRight: 2,
  },

  // Quick actions
  quickActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SIZES.lg,
    marginHorizontal: -SIZES.xs, // Negative margin to offset padding
  },
  quickActionItem: {
    flex: 1,
    marginHorizontal: SIZES.xs,
    aspectRatio: 1,
    borderRadius: SIZES.cardRadius,
    maxWidth: (SIZES.width - SIZES.screenPadding * 2) / 3 - SIZES.sm,
  },
  quickActionButton: {
    width: "100%",
    height: "100%",
    borderRadius: SIZES.cardRadius,
    padding: SIZES.sm,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    overflow: "hidden", // Prevent badge from getting cut off
  },
  quickActionIcon: {
    width: SIZES.iconSize * 1.8, // Slightly smaller for better proportions
    height: SIZES.iconSize * 1.8,
    borderRadius: SIZES.iconSize,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SIZES.sm,
    position: "relative", // Ensure badge positioning works
  },
  quickActionTitle: {
    fontSize: 11, // Slightly smaller for better fit
    lineHeight: 13,
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
    marginTop: SIZES.xs,
  },

  // Weather card
  weatherCard: {
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  weatherTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS?.textDark || "#111827",
  },
  weatherTemp: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: SIZES.xs / 2,
    color: COLORS?.textDark || "#111827",
  },
  weatherDesc: {
    fontSize: 16,
    color: COLORS?.textDark || "#111827",
  },
  weatherLocation: {
    fontSize: 14,
    color: COLORS?.textLight || "#9CA3AF",
    marginLeft: 4,
  },
  weatherIconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  weatherDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SIZES.lg,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS?.border || "#E5E7EB",
  },
  weatherDetailItem: {
    alignItems: "center",
    flex: 1,
  },
  weatherDetailValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS?.textDark || "#111827",
    marginTop: 4,
  },
  weatherDetailLabel: {
    fontSize: 12,
    color: COLORS?.textLight || "#9CA3AF",
  },
  moreButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  moreText: {
    fontSize: 14,
    color: COLORS?.primary || "#2563EB",
    marginRight: 2,
  },

  // Alert card
  alertCard: {
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SIZES.sm,
  },
  alertIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS?.warning || "#F59E0B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SIZES.sm,
  },
  alertHeaderText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS?.warning || "#F59E0B",
    letterSpacing: 1,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS?.textDark || "#111827",
    marginBottom: SIZES.xs,
  },
  alertDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS?.textLight || "#9CA3AF",
    marginBottom: SIZES.md,
  },
  alertActions: {
    marginTop: SIZES.sm,
  },
  alertAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS?.border || "#E5E7EB",
  },
  alertActionText: {
    fontSize: 14,
    color: COLORS?.primary || "#2563EB",
  },

  // News items
  newsItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS?.white || "#FFFFFF",
    padding: SIZES.md,
    borderRadius: SIZES.borderRadius,
    marginBottom: SIZES.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  newsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SIZES.md,
  },
  newsContent: {
    flex: 1,
    marginRight: SIZES.sm,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS?.textDark || "#111827",
    marginBottom: 4,
  },
  newsTime: {
    fontSize: 12,
    color: COLORS?.textLight || "#9CA3AF",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS?.border || "#E5E7EB",
    marginVertical: SIZES.xs,
  },

  // Tip card
  tipCard: {
    padding: SIZES.lg,
    marginTop: SIZES.md,
    marginBottom: SIZES.xl,
    backgroundColor: COLORS?.primary + "08" || "#2563EB08",
  },
  tipHeaderText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS?.primary || "#2563EB",
    marginLeft: SIZES.xs,
    letterSpacing: 1,
  },
  tipDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS?.textDark || "#111827",
    marginTop: SIZES.md,
    marginBottom: SIZES.md,
  },
  tipAction: {
    flexDirection: "row",
    alignItems: "center",
  },
  tipActionText: {
    fontSize: 14,
    color: COLORS?.primary || "#2563EB",
    marginRight: 4,
    fontWeight: "500",
  },

  // Badge
  badgeContainer: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444", // Hardcoded color for reliability
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    zIndex: 1, // Ensure badge appears on top
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 2,
  },
});

// Export component with memo for optimal performance
export default memo(HomeScreen);
