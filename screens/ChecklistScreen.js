import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Initial checklist items
const initialHomeItems = [
  { id: "1", text: "Secure windows and doors", completed: false },
  { id: "2", text: "Clear roof gutters", completed: false },
  { id: "3", text: "Trim trees near power lines", completed: false },
  { id: "4", text: "Move outdoor furniture inside", completed: false },
  { id: "5", text: "Secure loose outdoor items", completed: false },
];

const initialEmergencyItems = [
  { id: "1", text: "First aid kit", completed: false },
  { id: "2", text: "Bottled water (3-day supply)", completed: false },
  { id: "3", text: "Non-perishable food", completed: false },
  { id: "4", text: "Flashlight and batteries", completed: false },
  { id: "5", text: "Emergency radio", completed: false },
  { id: "6", text: "Medication (7-day supply)", completed: false },
];

const initialFamilyItems = [
  { id: "1", text: "Establish meeting points", completed: false },
  { id: "2", text: "Create emergency contact list", completed: false },
  { id: "3", text: "Assign emergency roles", completed: false },
  { id: "4", text: "Plan evacuation routes", completed: false },
  { id: "5", text: "Practice evacuation plan", completed: false },
];

// Define the ChecklistItem component properly
const ChecklistItem = ({ item, toggleItem }) => {
  return (
    <TouchableOpacity
      style={styles.checklistItem}
      onPress={() => toggleItem(item.id)}
    >
      <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
        {item.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
      </View>
      <Text
        style={[
          styles.checklistText,
          item.completed && styles.checklistTextChecked,
        ]}
      >
        {item.text}
      </Text>
    </TouchableOpacity>
  );
};

// Fix the parameters and function definition
const ChecklistScreen = function (props) {
  // Get navigation prop safely
  const navigation = props.navigation;

  // Hide the default navigation header to avoid duplication
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const [activeTab, setActiveTab] = useState("home");
  const [homeItems, setHomeItems] = useState(initialHomeItems);
  const [emergencyItems, setEmergencyItems] = useState(initialEmergencyItems);
  const [familyItems, setFamilyItems] = useState(initialFamilyItems);

  // Calculate progress
  const homeProgress =
    homeItems.filter((item) => item.completed).length / homeItems.length;
  const emergencyProgress =
    emergencyItems.filter((item) => item.completed).length /
    emergencyItems.length;
  const familyProgress =
    familyItems.filter((item) => item.completed).length / familyItems.length;

  const getActiveItems = () => {
    if (activeTab === "home") return homeItems;
    if (activeTab === "emergency") return emergencyItems;
    return familyItems;
  };

  const toggleActiveItem = (id) => {
    if (activeTab === "home") return toggleHomeItem(id);
    if (activeTab === "emergency") return toggleEmergencyItem(id);
    return toggleFamilyItem(id);
  };

  // Toggle item completion functions
  const toggleHomeItem = (id) => {
    setHomeItems(
      homeItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const toggleEmergencyItem = (id) => {
    setEmergencyItems(
      emergencyItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const toggleFamilyItem = (id) => {
    setFamilyItems(
      familyItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Custom header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Preparation Checklist</Text>
          <View style={{ width: 24 }} /> {/* Empty view for alignment */}
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "home" && styles.activeTab]}
            onPress={() => setActiveTab("home")}
          >
            <Ionicons
              name="home"
              size={20}
              color={activeTab === "home" ? "#3884ff" : "#666"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "home" && styles.activeTabText,
              ]}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "emergency" && styles.activeTab]}
            onPress={() => setActiveTab("emergency")}
          >
            <Ionicons
              name="medical"
              size={20}
              color={activeTab === "emergency" ? "#3884ff" : "#666"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "emergency" && styles.activeTabText,
              ]}
            >
              Emergency
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "family" && styles.activeTab]}
            onPress={() => setActiveTab("family")}
          >
            <Ionicons
              name="people"
              size={20}
              color={activeTab === "family" ? "#3884ff" : "#666"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "family" && styles.activeTabText,
              ]}
            >
              Family Plan
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    (activeTab === "home"
                      ? homeProgress
                      : activeTab === "emergency"
                      ? emergencyProgress
                      : familyProgress) * 100
                  }%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(
              (activeTab === "home"
                ? homeProgress
                : activeTab === "emergency"
                ? emergencyProgress
                : familyProgress) * 100
            )}
            % Complete
          </Text>
        </View>

        {/* Simplify the conditional rendering with a helper function */}
        <FlatList
          style={styles.checklistContainer}
          data={getActiveItems()}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChecklistItem item={item} toggleItem={toggleActiveItem} />
          )}
        />

        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add New Item</Text>
        </TouchableOpacity>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#e6f0ff",
  },
  tabText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#666",
  },
  activeTabText: {
    color: "#3884ff",
    fontWeight: "bold",
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: 8,
    backgroundColor: "#4CAF50",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
  },
  checklistContainer: {
    flex: 1,
    marginBottom: 16,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#3884ff",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#3884ff",
  },
  checklistText: {
    fontSize: 16,
    color: "#333",
  },
  checklistTextChecked: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  addButton: {
    backgroundColor: "#3884ff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default ChecklistScreen;
