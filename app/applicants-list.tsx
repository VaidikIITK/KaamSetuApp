import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
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

type ApplicationItem = {
  _id: string;
  workerId: string;
  status?: string;
};

export default function ApplicationListScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();

  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token || !jobId) {
        setLoading(false);
        return;
      }

      const res = await fetch(
        `http://172.23.17.67:8030/api/applications/job/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        console.log("Applications fetch error:", data);
        setLoading(false);
        return;
      }

      setApplications(Array.isArray(data) ? data : data.applications || []);
    } catch (error) {
      console.log("Applications fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  const renderItem = ({ item }: { item: ApplicationItem }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push(
            `/worker-profile?workerId=${item.workerId}&jobId=${jobId}&applicationId=${item._id}`,
          )
        }
      >
        <Text style={styles.cardTitle}>Worker ID: {item.workerId}</Text>
        <Text style={styles.cardSubtitle}>
          Status: {item.status || "pending"}
        </Text>
        <Text style={styles.openText}>View Profile →</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Applications</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : applications.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No applications found.</Text>
        </View>
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  listContent: { padding: Spacing.md, gap: 12 },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  openText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textMuted,
  },
});
