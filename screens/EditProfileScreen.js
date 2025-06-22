import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// Colors and sizes for consistent design
const COLORS = {
  primary: "#3884ff",
  background: "#FFFFFF",
  inputBg: "#f9f9f9",
  border: "#eeeeee",
  text: {
    dark: "#333333",
    medium: "#555555",
    light: "#999999",
  },
  error: "#FF3B30",
  success: "#34C759",
};

const SIZES = {
  padding: 16,
  radius: 12,
  iconSize: 20,
};

// Reusable form field component with improved styling
const FormField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
  icon,
}) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputContainer}>
      {icon && (
        <Ionicons
          name={icon}
          size={SIZES.iconSize}
          color={COLORS.text.medium}
          style={styles.inputIcon}
        />
      )}
      <TextInput
        style={[
          styles.input,
          icon && { paddingLeft: 36 },
          multiline && { height: 80, textAlignVertical: "top", paddingTop: 12 },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        multiline={multiline}
        placeholderTextColor={COLORS.text.light}
      />
    </View>
  </View>
);

// Reusable option button component for settings section
const SettingOption = ({ icon, title, onPress }) => (
  <TouchableOpacity
    style={styles.settingOption}
    activeOpacity={0.7}
    onPress={onPress}
  >
    <View style={styles.settingOptionContent}>
      <View style={styles.settingIconContainer}>
        <Ionicons
          name={icon}
          size={SIZES.iconSize}
          color={COLORS.text.medium}
        />
      </View>
      <Text style={styles.settingOptionText}>{title}</Text>
    </View>
    <Ionicons
      name="chevron-forward"
      size={SIZES.iconSize}
      color={COLORS.text.light}
    />
  </TouchableOpacity>
);

const EditProfileScreen = ({ navigation }) => {
  // Hide the default navigation header to avoid duplication
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false, // Hide the default navigation header
    });
  }, [navigation]);

  const [formData, setFormData] = useState({
    name: "John Dela Cruz",
    email: "john@example.com",
    phone: "(+63) 9123456789",
    address: "Quezon City, Metro Manila",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    // Here you would save profile changes to storage/database
    console.log("Saving profile data:", formData);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        {/* Custom header - keeping only this one */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.text.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.7}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.formContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile image section */}
          <View style={styles.profileImageSection}>
            <View style={styles.imageWrapper}>
              <Image
                source={{
                  uri: "https://ui-avatars.com/api/?name=John+Dela+Cruz&background=3884ff&color=fff&size=200",
                }}
                style={styles.profileImage}
              />
              <TouchableOpacity style={styles.cameraButton}>
                <Ionicons name="camera" size={SIZES.iconSize} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.profileName}>{formData.name}</Text>
          </View>

          {/* Form fields */}
          <View style={styles.formSection}>
            <FormField
              label="Full Name"
              value={formData.name}
              onChangeText={(text) => handleChange("name", text)}
              placeholder="Enter your full name"
              icon="person-outline"
            />

            <FormField
              label="Email Address"
              value={formData.email}
              onChangeText={(text) => handleChange("email", text)}
              placeholder="Enter your email address"
              keyboardType="email-address"
              icon="mail-outline"
            />

            <FormField
              label="Phone Number"
              value={formData.phone}
              onChangeText={(text) => handleChange("phone", text)}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              icon="call-outline"
            />

            <FormField
              label="Address"
              value={formData.address}
              onChangeText={(text) => handleChange("address", text)}
              placeholder="Enter your address"
              multiline={true}
              icon="location-outline"
            />
          </View>

          {/* Settings section */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Settings</Text>

            <SettingOption
              icon="lock-closed-outline"
              title="Change Password"
              onPress={() => console.log("Change password")}
            />

            <SettingOption
              icon="notifications-outline"
              title="Notification Settings"
              onPress={() => console.log("Notification settings")}
            />

            <SettingOption
              icon="shield-checkmark-outline"
              title="Privacy & Security"
              onPress={() => console.log("Privacy settings")}
            />
          </View>

          {/* Delete account button */}
          <TouchableOpacity
            style={styles.deleteAccount}
            activeOpacity={0.7}
            onPress={() => console.log("Delete account")}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text.dark,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  formContainer: {
    flex: 1,
  },
  profileImageSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  imageWrapper: {
    position: "relative",
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: COLORS.background,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text.dark,
    marginTop: 12,
  },
  formSection: {
    paddingHorizontal: SIZES.padding,
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.text.medium,
    marginBottom: 6,
    fontWeight: "500",
  },
  inputContainer: {
    backgroundColor: COLORS.inputBg,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: 12,
    top: 15,
    zIndex: 1,
  },
  input: {
    height: 50,
    fontSize: 16,
    color: COLORS.text.dark,
    paddingHorizontal: 12,
  },
  settingsSection: {
    paddingHorizontal: SIZES.padding,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text.dark,
    marginBottom: 16,
    marginTop: 8,
  },
  settingOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingOptionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f5ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingOptionText: {
    fontSize: 16,
    color: COLORS.text.dark,
  },
  deleteAccount: {
    flexDirection: "row",
    paddingVertical: 16,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteAccountText: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: "500",
    marginLeft: 8,
  },
});

export default EditProfileScreen;
