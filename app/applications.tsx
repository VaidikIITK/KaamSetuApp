import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  KColors as Colors,
  Radius,
  Shadow,
  Spacing,
} from "../constants/kaamsetuTheme";

type TabType = "accepted" | "requested";

function StarRatingInput({
  rating,
  onRate,
}: {
  rating: number;
  onRate: (r: number) => void;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity key={i} onPress={() => onRate(i)}>
          <Text style={{ fontSize: 28, color: i <= rating ? Colors.starGold : "#DDD" }}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "pending") return <Text style={{ fontSize: 18 }}>🕐</Text>;
  if (status === "rejected") return <Text style={{ fontSize: 18 }}>✖</Text>;
  return null;
}

export default function ApplicationsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>("accepted");
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [applications, setApplications] = useState<any[]>([]);
  const [ratingModal, setRatingModal] = useState<{ visible: boolean; appId: string }>({
    visible: false,
    appId: "",
  });
  const BASE_URL = "http://172.27.16.252:8030/api";
  const { jobId } = useLocalSearchParams<{ jobId: string }>();

  const fetchApplications = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      // If jobId is passed, fetch applicants for that specific job
      const url = jobId
        ? `${BASE_URL}/applications/job/${jobId}`
        : `${BASE_URL}/applications/received`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setApplications(data.applications || []);
    } catch (err) {
      console.log("FETCH ERROR:", err);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  const acceptedApps = (applications || []).filter((a) => a.status === "accepted");
  const requestedApps = (applications || []).filter((a) => a.status === "pending");

  const handleEndWork = (applicationId: string) => {
    setRatingModal({ visible: true, appId: applicationId });
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Please select a rating.");
      return;
    }
    const appId = ratingModal.appId;
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/applications/complete/${appId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating, review }),
      });
      const data = await res.json();
      if (res.ok) {
        setRatingModal({ visible: false, appId: "" });
        setApplications((prev: any[]) => prev.filter((a: any) => a._id !== appId));
        setRating(0);
        setReview("");
        Alert.alert("Thank you!", "Your rating has been submitted.");
      } else {
        Alert.alert("Error", data.message || "Failed to submit rating");
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong");
    }
  };

  const handleSkipRating = async () => {
    const appId = ratingModal.appId;
    try {
      const token = await AsyncStorage.getItem("token");
      await fetch(`${BASE_URL}/applications/complete/${appId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating: null, review: null }),
      });
    } catch (err) {
      console.log(err);
    }
    setRatingModal({ visible: false, appId: "" });
    setApplications((prev: any[]) => prev.filter((a: any) => a._id !== appId));
    setRating(0);
    setReview("");
  };

  const handleAccept = async (applicationId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/applications/accept/${applicationId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", "Worker accepted!");
        fetchApplications();
      } else {
        Alert.alert("Error", data.message || "Failed to accept");
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong");
    }
  };

  const handleReject = async (applicationId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/applications/reject/${applicationId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", "Worker rejected!");
        fetchApplications();
      } else {
        Alert.alert("Error", data.message || "Failed to reject");
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Applications</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(["accepted", "requested"] as TabType[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
            <View style={[styles.tabBadge, tab === t && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, tab === t && { color: Colors.white }]}>
                {t === "accepted" ? acceptedApps.length : requestedApps.length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {tab === "accepted" ? (
          acceptedApps.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No accepted applications.</Text>
            </View>
          ) : (
            acceptedApps.map((app) => (
              <View key={app._id} style={styles.acceptedCard}>
                <View style={styles.inProgressBanner}>
                  <Text style={styles.inProgressIcon}>✅</Text>
                  <Text style={styles.inProgressText}>WORK IN PROGRESS</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.detailsHeading}>Worker Details</Text>
                  {[
                    ["Name", app.workerId?.name || "-"],
                    ["Phone", app.workerId?.phone || "-"],
                    ["Address", app.workerId?.address || "-"],
                    ["Skills", app.workerId?.skills?.join(", ") || "-"],
                  ].map(([k, v]) => (
                    <View key={k} style={styles.detailRow}>
                      <Text style={styles.detailKey}>{k}:</Text>
                      <Text style={styles.detailVal}>{v}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.detailsBox}>
                  <Text style={styles.detailsHeading}>Job Details</Text>
                  {[
                    ["Category", app.jobId?.category || "-"],
                    ["Description", app.jobId?.description || "-"],
                    ["Location", app.jobId?.address || "-"],
                    ["Expected Pay", `₹${app.expectedPay || "-"}`],
                    ["Applied", new Date(app.createdAt).toLocaleDateString()],
                  ].map(([k, v]) => (
                    <View key={k} style={styles.detailRow}>
                      <Text style={styles.detailKey}>{k}:</Text>
                      <Text style={styles.detailVal}>{v}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.endWorkBtn}
                  onPress={() => handleEndWork(app._id)}
                >
                  <Text style={styles.endWorkText}>End Work</Text>
                </TouchableOpacity>
              </View>
            ))
          )
        ) : requestedApps.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No pending/rejected applications.</Text>
          </View>
        ) : (
          requestedApps.map((app) => (
            <View
              key={app?._id || Math.random()}
              style={[
                styles.requestedCard,
                app.status === "rejected" && styles.requestedCardRejected,
              ]}
            >
              <View style={styles.requestedTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle}>
                    {app.workerId?.name || app.jobId?.category || "Applicant"}
                  </Text>
                  <Text
                    style={[
                      styles.statusText,
                      { color: app.status === "rejected" ? Colors.error : Colors.warning },
                    ]}
                  >
                    Status: {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </Text>
                </View>
                <StatusIcon status={app.status} />
              </View>

              <Text style={styles.jobMeta}>
                Applied: {new Date(app.createdAt).toLocaleDateString()}
              </Text>
              <Text style={styles.jobMeta}>Expected Pay: ₹{app.expectedPay}</Text>

              {app.status === "pending" && (
                <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(app._id)}>
                    <Text style={styles.acceptBtnText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(app._id)}>
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Rating Modal */}
      <Modal transparent animationType="fade" visible={ratingModal.visible}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rate the Worker</Text>
            <Text style={styles.modalSubtitle}>How was your experience?</Text>

            <StarRatingInput rating={rating} onRate={setRating} />

            <TextInput
              style={styles.reviewInput}
              placeholder="Write a review (optional)..."
              placeholderTextColor="#aaa"
              value={review}
              onChangeText={setReview}
              multiline
              numberOfLines={3}
            />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <TouchableOpacity style={styles.skipBtn} onPress={handleSkipRating}>
                <Text style={styles.skipBtnText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitRatingBtn} onPress={handleRatingSubmit}>
                <Text style={styles.submitRatingText}>Submit & End</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  backBtn: { width: 36, justifyContent: "center" },
  backText: { color: Colors.white, fontSize: 28, fontWeight: "300", lineHeight: 32 },
  headerTitle: { color: Colors.white, fontSize: 18, fontWeight: "700" },

  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderColor: Colors.divider,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 15, fontWeight: "600", color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },
  tabBadge: {
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  tabBadgeActive: { backgroundColor: Colors.primary },
  tabBadgeText: { fontSize: 11, fontWeight: "700", color: Colors.primary },

  scrollContent: { padding: Spacing.md, gap: 14 },
  empty: { padding: 60, alignItems: "center" },
  emptyText: { color: Colors.textMuted, fontSize: 14 },

  acceptedCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.md,
    gap: 0,
  },
  inProgressBanner: {
    backgroundColor: Colors.success,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 10,
  },
  inProgressIcon: { fontSize: 20 },
  inProgressText: {
    color: Colors.white,
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 1,
  },
  section: { padding: Spacing.md, gap: 4 },
  jobTitle: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary },
  jobMeta: { fontSize: 12, color: Colors.textSecondary },
  statusText: { fontSize: 12, fontWeight: "600" },

  detailsBox: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  detailsHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  detailRow: { flexDirection: "row", gap: 8 },
  detailKey: { width: 80, fontSize: 12, fontWeight: "700", color: Colors.textSecondary },
  detailVal: { flex: 1, fontSize: 12, color: Colors.textPrimary },

  endWorkBtn: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.full,
    paddingVertical: 12,
    alignItems: "center",
  },
  endWorkText: { color: Colors.white, fontWeight: "700", fontSize: 15 },

  rateBox: { margin: Spacing.md, gap: 12, alignItems: "center" },
  rateTitle: { fontSize: 17, fontWeight: "700", color: Colors.textPrimary },

  reviewInput: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 80,
    backgroundColor: Colors.offWhite,
  },
  submitRatingBtn: {
    flex: 1,
    backgroundColor: Colors.accentDark,
    borderRadius: Radius.full,
    paddingVertical: 11,
    alignItems: "center",
  },
  submitRatingText: { color: Colors.white, fontWeight: "700", fontSize: 14 },

  requestedCard: {
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.sm,
    gap: 5,
  },
  requestedCardRejected: {
    backgroundColor: Colors.errorLight,
    borderColor: "#FFCDD2",
  },
  requestedTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: "#2E7D32",
    borderRadius: Radius.full,
    paddingVertical: 12,
    alignItems: "center",
  },
  acceptBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  rejectBtn: {
    flex: 1,
    backgroundColor: "#C62828",
    borderRadius: Radius.full,
    paddingVertical: 12,
    alignItems: "center",
  },
  rejectBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 24,
    width: "100%",
    alignItems: "center",
    gap: 14,
    ...Shadow.md,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary },
  modalSubtitle: { fontSize: 13, color: Colors.textMuted },
  skipBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.full,
    paddingVertical: 11,
    alignItems: "center",
  },
  skipBtnText: { color: Colors.textSecondary, fontWeight: "600", fontSize: 14 },
});