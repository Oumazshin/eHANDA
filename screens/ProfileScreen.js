import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ProfileScreen = ({ navigation }) => {
  const [offlineMode, setOfflineMode] = useState(false);

  const toggleOfflineMode = () => {
    setOfflineMode((previousState) => !previousState);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <Image
            source={{
              uri: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
            }}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>John Dela Cruz</Text>
          <Text style={styles.profileAddress}>Quezon City, Metro Manila</Text>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family Members</Text>

          <View style={styles.familyMember}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>M</Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>Maria Dela Cruz</Text>
              <Text style={styles.memberRelation}>Wife</Text>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <Ionicons name="call-outline" size={20} color="#3884ff" />
            </TouchableOpacity>
          </View>

          <View style={styles.familyMember}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>D</Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>David Dela Cruz</Text>
              <Text style={styles.memberRelation}>Son</Text>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <Ionicons name="call-outline" size={20} color="#3884ff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={20} color="#3884ff" />
            <Text style={styles.addButtonText}>Add Family Member</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>

          <View style={styles.contactItem}>
            <View style={styles.contactHeader}>
              <Text style={styles.contactType}>Primary Contact</Text>
              <TouchableOpacity>
                <Ionicons name="create-outline" size={18} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.contactName}>Maria Dela Cruz</Text>
            <Text style={styles.contactPhone}>(+63) 9123456789</Text>
          </View>

          <View style={styles.contactItem}>
            <View style={styles.contactHeader}>
              <Text style={styles.contactType}>Secondary Contact</Text>
              <TouchableOpacity>
                <Ionicons name="create-outline" size={18} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.contactName}>Carlos Santos</Text>
            <Text style={styles.contactPhone}>(+63) 9876543210</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="cloud-offline-outline" size={24} color="#666" />
              <Text style={styles.settingText}>Offline Mode</Text>
            </View>
            <Switch
              trackColor={{ false: "#e0e0e0", true: "#c8e0ff" }}
              thumbColor={offlineMode ? "#3884ff" : "#f4f3f4"}
              onValueChange={toggleOfflineMode}
              value={offlineMode}
            />
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate("OfflineDownloads")}
          >
            <View style={styles.settingContent}>
              <Ionicons name="download-outline" size={24} color="#666" />
              <Text style={styles.settingText}>Manage Offline Downloads</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="notifications-outline" size={24} color="#666" />
              <Text style={styles.settingText}>Notification Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => navigation.navigate("Welcome")}
        >
          <Ionicons name="log-out-outline" size={24} color="#ff6b6b" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>eHANDA v1.0.0</Text>
      </ScrollView>
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  settingsButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  profileAddress: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  editProfileButton: {
    flexDirection: "row",
    backgroundColor: "#3884ff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
  },
  editProfileText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  familyMember: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e6f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3884ff",
  },
  memberInfo: {
    flex: 1,
  },
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
  },
  addButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#3884ff",
    borderRadius: 8,
    borderStyle: "dashed",
  },
  addButtonText: {
    color: "#3884ff",
    fontWeight: "600",
    marginLeft: 8,
  },
  contactItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
  },
  contactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  contactType: {
    fontSize: 14,
    color: "#666",
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
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
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
  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#ff6b6b",
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  logoutText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "600",
  },
  versionText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginTop: 16,
  },
});

export default ProfileScreen;
