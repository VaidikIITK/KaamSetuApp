# Query: 
# ContextLines: 1

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const BASE_URL = "http://172.27.16.252:8030/api"; // Your server IP
const PRIMARY = "#2196F3";
const BG_COLOR = "#f5f3ff";
const CARD_BG = "#ffffff";
const TEXT_DARK = "#1a1a1a";
const TEXT_MUTED = "#666666";
const STAR_GOLD = "#FFC107";

// Define the expected structure from your friend's backend
type ReviewType = {
  _id: string;
  employerName: string;
  rating: number;
  comment: string;
  date: string;
};

type WorkerProfileType = {
  _id: string;
  name: string;
  role?: string;
  phone: string;
  address?: string;
  createdAt?: string;
  rating?: number;
  jobsCompleted?: number;
  skills?: string[];
  reviews?: ReviewType[];
};

export default function WorkerProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Automatically grabs the ID from the URL/Route

  const [worker, setWorker] = useState<WorkerProfileType | null>(null);
  const [loading, setLoading] = useState(true);

  // ─────────────────────────────────────────────────────────────────────────────
  // FETCH DATA FROM BACKEND
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchWorkerProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        
        // ⚠️ Tell your friend this screen makes a GET request to /api/users/:id
        // If they named the route differently (e.g., /api/worker/:id), update the URL below!
        const response = await fetch(`${BASE_URL}/users/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (response.ok) {
          setWorker(data);
        } else {
          Alert.alert("Error", data.message || "Failed to load worker profile.");
          router.back();
        }
      } catch (error) {
        console.log("Profile Fetch Error:", error);
        Alert.alert("Network Error", "Could not connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchWorkerProfile();
    }
  }, [id]);

  // ─────────────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </SafeAreaView>
    );
  }

  if (!worker) return null; // Failsafe

  // Helper to get initials for the Avatar
  const getInitials = (name: string) => {
    return name ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "W";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* ── Custom Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Applicant Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ── Top Profile Card ── */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{getInitials(worker.name)}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={18} color={PRIMARY} />
            </View>
          </View>

          <Text style={styles.nameText}>{worker.name}</Text>
          <Text style={styles.roleText}>{worker.role || "Kaam Setu Worker"}</Text>
          <Text style={styles.locationText}>
            <Ionicons name="location-outline" size={14} color={TEXT_MUTED} />{" "}
            {worker.address || "Location not provided"}
          </Text>

          {/* Quick Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={styles.statIconRow}>
                <Ionicons name="star" size={16} color={STAR_GOLD} />
                <Text style={styles.statValue}>{worker.rating?.toFixed(1) || "New"}</Text>
              </View>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statBox}>
              <View style={styles.statIconRow}>
                <Ionicons name="briefcase" size={16} color={PRIMARY} />
                <Text style={styles.statValue}>{worker.jobsCompleted || 0}</Text>
              </View>
              <Text style={styles.statLabel}>Jobs Done</Text>
            </View>
          </View>
        </View>

        {/* ── Skills Section ── */}
        {worker.skills && worker.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills & Expertise</Text>
            <View style={styles.tagsRow}>
              {worker.skills.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillTagText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Contact & Info Section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Details</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="call" size={18} color={PRIMARY} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{worker.phone || "Hidden"}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="calendar" size={18} color={PRIMARY} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>
                {worker.createdAt ? new Date(worker.createdAt).toLocaleDateString() : "Recent"}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Work History & Reviews ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work History & Reviews</Text>
          
          {!worker.reviews || worker.reviews.length === 0 ? (
            <Text style={styles.emptyText}>No reviews yet. Be the first to hire them!</Text>
          ) : (
            worker.reviews.map((review) => (
              <View key={review._id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.employerName}</Text>
                  <Text style={styles.reviewDate}>
                    {new Date(review.date).toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={review.rating >= star ? "star" : "star-outline"}
                      size={14}
                      color={STAR_GOLD}
                    />
                  ))}
                </View>
                
                <Text style={styles.reviewText}>"{review.comment}"</Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Sticky Bottom Action Bar ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.rejectBtn} 
          activeOpacity={0.8}
          onPress={() => {
            Alert.alert("Decline", "Are you sure you want to decline this applicant?");
          }}
        >
          <Text style={styles.rejectBtnText}>Decline</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.hireBtn} 
          activeOpacity={0.8}
          onPress={() => {
            Alert.alert("Confirm Hire", `Are you sure you want to hire ${worker.name}?`);
          }}
        >
          <Text style={styles.hireBtnText}>Accept & Hire</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG_COLOR },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: BG_COLOR },
  loadingText: { color: PRIMARY, marginTop: 12, fontSize: 16, fontWeight: "600" },
  
  header: {
    backgroundColor: PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    elevation: 4,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  
  scrollContent: { padding: 16, gap: 16 },

  profileCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginTop: 10, 
  },
  avatarContainer: { position: "relative", marginBottom: 12 },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#e3f2fd",
  },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  verifiedBadge: { position: "absolute", bottom: 0, right: -4, backgroundColor: "#fff", borderRadius: 12, padding: 2 },
  nameText: { fontSize: 22, fontWeight: "800", color: TEXT_DARK },
  roleText: { fontSize: 15, color: PRIMARY, fontWeight: "600", marginTop: 4 },
  locationText: { fontSize: 14, color: TEXT_MUTED, marginTop: 6 },
  
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  statBox: { alignItems: "center", flex: 1 },
  statIconRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: "700", color: TEXT_DARK },
  statLabel: { fontSize: 12, color: TEXT_MUTED },
  statDivider: { width: 1, height: 30, backgroundColor: "#e0e0e0" },

  section: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: TEXT_DARK, marginBottom: 16 },
  
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillTag: { backgroundColor: "#e3f2fd", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: PRIMARY + "40" },
  skillTagText: { color: PRIMARY, fontSize: 13, fontWeight: "600" },

  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12 },
  infoIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#f5f3ff", alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 12, color: TEXT_MUTED, marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: "600", color: TEXT_DARK },

  emptyText: { fontSize: 14, color: TEXT_MUTED, fontStyle: "italic", textAlign: "center", paddingVertical: 10 },

  reviewCard: { backgroundColor: "#fafafa", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#f0f0f0" },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  reviewerName: { fontSize: 14, fontWeight: "700", color: TEXT_DARK },
  reviewDate: { fontSize: 12, color: TEXT_MUTED },
  reviewStars: { flexDirection: "row", marginBottom: 8 },
  reviewText: { fontSize: 14, color: TEXT_MUTED, fontStyle: "italic", lineHeight: 20 },

  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff",
    flexDirection: "row", padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: "#e0e0e0", elevation: 10,
  },
  rejectBtn: { flex: 1, borderWidth: 1.5, borderColor: "#D9534F", borderRadius: 12, alignItems: "center", justifyContent: "center", paddingVertical: 14 },
  rejectBtnText: { color: "#D9534F", fontSize: 15, fontWeight: "700" },
  hireBtn: { flex: 2, backgroundColor: PRIMARY, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingVertical: 14, elevation: 2 },
  hireBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});