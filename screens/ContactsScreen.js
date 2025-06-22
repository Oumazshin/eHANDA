import React, { useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Sample emergency hotlines - using proper declaration to avoid text string issues
const emergencyHotlines = [
  { id: "1", agency: "National Emergency Hotline", number: "911" },
  { id: "2", agency: "Philippine Red Cross", number: "143" },
  { id: "3", agency: "NDRRMC", number: "(02) 8911-5061" },
  { id: "4", agency: "PAGASA", number: "(02) 8926-4258" },
  { id: "5", agency: "Bureau of Fire", number: "(02) 8426-0219" },
];

// Fix the personal contacts array declaration to avoid text string issues
const personalContacts = [
  {
    id: "1",
    name: "John Doe",
    number: "(+63) 9123456789",
    relationship: "Family",
  },
  {
    id: "2",
    name: "Jane Smith",
    number: "(+63) 9987654321",
    relationship: "Friend",
  },
];

const ContactsScreen = function (props) {
  const navigation = props.navigation;

  // Hide the default navigation header to avoid duplication
  useLayoutEffect(() => {
    if (navigation && navigation.setOptions) {
      navigation.setOptions({
        headerShown: false,
      });
    }
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Custom header - fixed by ensuring all text is inside Text components */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation && navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Emergency Contacts</Text>
          <View style={{ width: 24 }} /> {/* Empty view for alignment */}
        </View>

        <ScrollView style={styles.content}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#888"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts..."
              placeholderTextColor="#888"
            />
          </View>

          {/* Emergency Hotlines Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Official Hotlines</Text>

            <View style={styles.hotlineList}>
              {emergencyHotlines.map((hotline) => (
                <View key={hotline.id} style={styles.hotlineItem}>
                  <View style={styles.agencyContainer}>
                    <Ionicons name="business" size={20} color="#3884ff" />
                    <Text style={styles.agencyName}>{hotline.agency}</Text>
                  </View>
                  <TouchableOpacity style={styles.callButton}>
                    <Ionicons name="call" size={20} color="#3884ff" />
                    <Text style={styles.callButtonText}>{hotline.number}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Personal Emergency Contacts Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Emergency Contacts</Text>
              <TouchableOpacity style={styles.addContactButton}>
                <Ionicons name="add-circle" size={24} color="#3884ff" />
              </TouchableOpacity>
            </View>

            <View style={styles.personalList}>
              {personalContacts.map((contact) => (
                <View key={contact.id} style={styles.contactItem}>
                  <View style={styles.contactAvatar}>
                    <Text style={styles.avatarText}>
                      {contact.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactRelationship}>
                      {contact.relationship}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.contactCallButton}>
                    <Ionicons name="call" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.importantNotice}>
            <Ionicons name="information-circle" size={24} color="#3884ff" />
            <Text style={styles.noticeText}>
              In life-threatening situations, always call 911 immediately. For
              flood and typhoon warnings, monitor PAGASA updates.
            </Text>
          </View>
        </ScrollView>
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  sectionContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
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
    marginBottom: 16,
  },
  hotlineList: {},
  hotlineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  agencyContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  agencyName: {
    fontSize: 16,
    color: "#333",
    marginLeft: 8,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f4ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  callButtonText: {
    color: "#3884ff",
    fontWeight: "600",
    marginLeft: 4,
  },
  addContactButton: {
    padding: 4,
  },
  personalList: {},
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3884ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  contactRelationship: {
    fontSize: 14,
    color: "#666",
  },
  contactCallButton: {
    backgroundColor: "#3884ff",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  importantNotice: {
    flexDirection: "row",
    backgroundColor: "#e6f0ff",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#3884ff",
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
    lineHeight: 20,
  },
});

export default ContactsScreen;
