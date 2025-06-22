import React, { useState, useCallback, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Switch,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

// Get device dimensions for responsive layout
const { height } = Dimensions.get("window");

// Sample user data (in real app, would come from context/redux)
const USER_DATA = {
  name: "John Dela Cruz",
  location: "Quezon City, Metro Manila",
  image:
    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
  family: [
    {
      id: 1,
      name: "Maria Dela Cruz",
      relation: "Wife",
      initial: "M",
      phone: "9123456789",
    },
    {
      id: 2,
      name: "David Dela Cruz",
      relation: "Son",
      initial: "D",
      phone: "9223456789",
    },
  ],
  emergencyContacts: [
    {
      id: 1,
      name: "Maria Dela Cruz",
      phone: "(+63) 9123456789",
      type: "Primary Contact",
    },
    {
      id: 2,
      name: "Carlos Santos",
      phone: "(+63) 9876543210",
      type: "Secondary Contact",
    },
  ],
};

// Memoized components for better performance
const FamilyMember = memo(({ member, onCall }) => (
  <View style={styles.familyMember}>
    <View
      style={[
        styles.memberAvatar,
        { backgroundColor: getColorFromName(member.name) },
      ]}
    >
      <Text style={styles.memberAvatarText}>{member.initial}</Text>
    </View>
    <View style={styles.memberInfo}>
      <Text style={styles.memberName}>{member.name}</Text>
      <Text style={styles.memberRelation}>{member.relation}</Text>
    </View>
    <TouchableOpacity
      style={styles.callButton}
      onPress={() => onCall(member)}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="call-outline" size={20} color="#3884ff" />
    </TouchableOpacity>
  </View>
));

const EmergencyContact = memo(({ contact, onEdit }) => (
  <View style={styles.contactItem}>
    <View style={styles.contactHeader}>
      <View style={styles.contactBadge}>
        <Text style={styles.contactBadgeText}>{contact.type}</Text>
      </View>
      <TouchableOpacity
        onPress={() => onEdit(contact)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="create-outline" size={18} color="#666" />
      </TouchableOpacity>
    </View>
    <Text style={styles.contactName}>{contact.name}</Text>
    <Text style={styles.contactPhone}>{contact.phone}</Text>
  </View>
));

const SettingItem = memo(({ icon, title, action, rightElement }) => (
  <TouchableOpacity
    style={styles.settingItem}
    onPress={action}
    disabled={rightElement && typeof rightElement !== "string"}
  >
    <View style={styles.settingContent}>
      <Ionicons name={icon} size={24} color="#666" />
      <Text style={styles.settingText}>{title}</Text>
    </View>
    {typeof rightElement === "string" ? (
      <Ionicons name={rightElement} size={20} color="#999" />
    ) : (
      rightElement
    )}
  </TouchableOpacity>
));

// Helper function to generate colors from name
const getColorFromName = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 90%)`;
};

const ProfileScreen = ({ navigation }) => {
  const [offlineMode, setOfflineMode] = useState(false);
  const [userData, setUserData] = useState(USER_DATA);

  // Reload user data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // In a real app, you would fetch updated data here
      return () => {}; // cleanup
    }, [])
  );

  const toggleOfflineMode = () => {
    setOfflineMode((prev) => !prev);
    // Show feedback to the user
    Alert.alert(
      "Offline Mode",
      `Offline mode has been ${!offlineMode ? "enabled" : "disabled"}.`,
      [{ text: "OK" }]
    );
  };

  const handleCallMember = (member) => {
    Alert.alert("Call Family Member", `Calling ${member.name}...`, [
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleEditContact = (contact) => {
    navigation.navigate("EditContact", { contact });
  };

  const handleAddFamilyMember = () => {
    navigation.navigate("AddFamilyMember");
  };

  const handleAddEmergencyContact = () => {
    navigation.navigate("AddEmergencyContact");
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: () => navigation.navigate("Welcome") },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        // Add content insets to avoid footer overlap
        contentInsetAdjustmentBehavior="automatic"
        contentInset={{ bottom: 60 }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate("Settings")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image source={{ uri: userData.image }} style={styles.profileImage} />
          <Text style={styles.profileName}>{userData.name}</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.profileAddress}>{userData.location}</Text>
          </View>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => navigation.navigate("EditProfile", { userData })}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Family Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Family Members</Text>
            <Text style={styles.sectionCount}>{userData.family.length}</Text>
          </View>

          {userData.family.map((member) => (
            <FamilyMember
              key={member.id}
              member={member}
              onCall={handleCallMember}
            />
          ))}

          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddFamilyMember}
          >
            <Ionicons name="add" size={20} color="#3884ff" />
            <Text style={styles.addButtonText}>Add Family Member</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Contacts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <Text style={styles.sectionCount}>
              {userData.emergencyContacts.length}
            </Text>
          </View>

          {userData.emergencyContacts.map((contact) => (
            <EmergencyContact
              key={contact.id}
              contact={contact}
              onEdit={handleEditContact}
            />
          ))}

          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddEmergencyContact}
          >
            <Ionicons name="add" size={20} color="#3884ff" />
            <Text style={styles.addButtonText}>Add Emergency Contact</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <SettingItem
            icon="cloud-offline-outline"
            title="Offline Mode"
            action={toggleOfflineMode}
            rightElement={
              <Switch
                trackColor={{ false: "#e0e0e0", true: "#c8e0ff" }}
                thumbColor={offlineMode ? "#3884ff" : "#f4f3f4"}
                onValueChange={toggleOfflineMode}
                value={offlineMode}
              />
            }
          />

          <SettingItem
            icon="download-outline"
            title="Manage Offline Downloads"
            action={() => navigation.navigate("OfflineDownloads")}
            rightElement="chevron-forward"
          />

          <SettingItem
            icon="notifications-outline"
            title="Notification Settings"
            action={() => navigation.navigate("NotificationSettings")}
            rightElement="chevron-forward"
          />

          <SettingItem
            icon="lock-closed-outline"
            title="Privacy Settings"
            action={() => navigation.navigate("PrivacySettings")}
            rightElement="chevron-forward"
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>eHANDA v1.0.0</Text>

        {/* Extra padding space to ensure content doesn't overlap with footer */}
        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const shadowStyle = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  android: { elevation: 2 },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f9fc",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    // Ensure content doesn't touch the footer
    paddingBottom: 70,
  },
  // Header styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  settingsButton: {
    padding: 8,
  },
  // Profile section
  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    ...shadowStyle,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#f0f6ff",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileAddress: {
    fontSize: 16,
    color: "#666",
    marginLeft: 4,
  },
  editProfileButton: {
    flexDirection: "row",
    backgroundColor: "#3884ff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: "center",
  },
  editProfileText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "600",
  },
  // Section styles
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...shadowStyle,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  sectionCount: {
    backgroundColor: "#e6f0ff",
    color: "#3884ff",
    fontSize: 14,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  // Family member styles
  familyMember: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f9fafc",
    borderRadius: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3884ff",
  },
  memberInfo: { flex: 1 },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  memberRelation: {
    fontSize: 14,
    color: "#666",
  },
  callButton: {
    padding: 8,
    backgroundColor: "#f0f6ff",
    borderRadius: 20,
  },
  // Add button styles
  addButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#3884ff",
    borderRadius: 12,
    borderStyle: "dashed",
    marginTop: 8,
  },
  addButtonText: {
    color: "#3884ff",
    fontWeight: "600",
    marginLeft: 8,
  },
  // Contact styles
  contactItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f9fafc",
    borderRadius: 12,
  },
  contactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  contactBadge: {
    backgroundColor: "#e6f0ff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  contactBadgeText: {
    fontSize: 12,
    color: "#3884ff",
    fontWeight: "500",
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: "#666",
  },
  // Setting styles
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
  },
  // Logout styles
  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#ff6b6b",
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    ...shadowStyle,
  },
  logoutText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "600",
    fontSize: 16,
  },
  versionText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginTop: 16,
  },
  // Extra bottom space to avoid footer overlap
  footerSpace: {
    height: 60,
  },
});

export default ProfileScreen;
