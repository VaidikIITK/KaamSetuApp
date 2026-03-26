import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  KColors as Colors,
  Radius,
  Shadow,
  Spacing,
} from "../constants/kaamsetuTheme";
import { workerProfiles } from "../constants/mockData";

function Avatar({ name, size = 80 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={{ color: "#fff", fontWeight: "700", fontSize: size * 0.32 }}>
        {initials}
      </Text>
    </View>
  );
}

export default function WorkerProfileScreen() {
  const { workerId, jobId, applicationId } = useLocalSearchParams<{
    workerId: string;
    jobId: string;
    applicationId: string;
  }>();

  const router = useRouter();
  const worker = workerProfiles[workerId ?? ""];

  if (!worker) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={{ color: Colors.textMuted }}>Worker not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleAccept = () => {
    Alert.alert(
      "Confirm Selection",
      `Accept ${worker.name} for this job? All other applicants will be notified.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: () => {
            Alert.alert(
              "Success",
              "Applicant accepted! The job is now in progress.",
              [{ text: "OK", onPress: () => router.replace("/(tabs)") }],
            );
          },
        },
      ],
    );
  };

  const handleChat = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "Please login again.");
        return;
      }

      if (!jobId || !workerId || !applicationId) {
        Alert.alert("Error", "Missing jobId, workerId, or applicationId");
        return;
      }

      const res = await fetch("http://172.23.17.67:8030/api/chat/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobId,
          workerId,
          applicationId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.message || "Failed to create chat");
        return;
      }

      const chatId = data.chat?._id;

      if (!chatId) {
        Alert.alert("Error", "Chat created but chatId missing");
        return;
      }

      router.push(`/job-chat?chatId=${chatId}`);
    } catch (error) {
      console.log("Chat create error:", error);
      Alert.alert("Error", "Failed to open chat");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Worker Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Avatar name={worker.name} size={90} />
          <Text style={styles.heroName}>{worker.name}</Text>
          <Text style={styles.heroTag}>{worker.workTag}</Text>

          <View style={styles.heroRatingRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Text
                key={i}
                style={{
                  color:
                    i <= Math.round(worker.rating) ? Colors.starGold : "#DDD",
                  fontSize: 18,
                }}
              >
                ★
              </Text>
            ))}
            <Text style={styles.heroRatingText}>
              {" "}
              {worker.rating} ({worker.ratingCount}+ Ratings)
            </Text>
          </View>

          <View style={styles.heroPills}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>📍 {worker.location}</Text>
            </View>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>
                🏆 {worker.experience}+ yrs
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
              <Text style={styles.chatBtnText}>💬 Chat</Text>
            </TouchableOpacity>

            {jobId ? (
              <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
                <Text style={styles.acceptBtnText}>✓ Accept</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionTitle}>Previous Work History</Text>
        </View>

        {worker.previousWork.map((work, idx) => (
          <View key={idx} style={styles.workCard}>
            <View style={styles.workTopRow}>
              <Text style={styles.workTitle}>{work.title}</Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
              >
                <Text style={{ color: Colors.starGold, fontSize: 13 }}>★</Text>
                <Text style={styles.workRatingText}>{work.rating}</Text>
              </View>
            </View>
            <Text style={styles.workTime}>{work.timeAgo}</Text>
            <Text style={styles.workReview}>"{work.review}"</Text>
          </View>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  backBtn: { width: 36, justifyContent: "center" },
  backText: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 32,
  },
  headerTitle: { color: Colors.white, fontSize: 18, fontWeight: "700" },
  scrollContent: { padding: Spacing.md, gap: 12 },
  heroCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.md,
    gap: 10,
  },
  avatar: {
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  heroName: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginTop: 4,
  },
  heroTag: { fontSize: 14, color: Colors.primary, fontWeight: "600" },
  heroRatingRow: { flexDirection: "row", alignItems: "center" },
  heroRatingText: { fontSize: 13, color: Colors.textSecondary },
  heroPills: { flexDirection: "row", gap: 12, marginTop: 4 },
  heroPill: {
    backgroundColor: Colors.primaryPale,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  heroPillText: { fontSize: 12, fontWeight: "600", color: Colors.primary },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 8, width: "100%" },
  chatBtn: {
    flex: 1,
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.full,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  chatBtnText: { color: Colors.primary, fontWeight: "700", fontSize: 15 },
  acceptBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 12,
    alignItems: "center",
  },
  acceptBtnText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  sectionAccent: {
    width: 4,
    height: 20,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  workCard: {
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 4,
  },
  workTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
  },
  workRatingText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  workTime: { fontSize: 11, color: Colors.textMuted },
  workReview: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
});
