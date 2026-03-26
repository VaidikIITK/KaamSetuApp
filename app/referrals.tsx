import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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

const BASE_URL = "http://172.27.16.252:8030/api";

type ReferralItem = {
  _id: string;
  workerName: string;
  workerPhone: string;
  skills?: string[];
  createdAt?: string;
  jobId?: {
    _id: string;
    title?: string;
    category?: string;
    company?: string;
  };
};

function ReferralCard({ item }: { item: ReferralItem }) {
  const initials = item.workerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const skillText =
    item.skills && item.skills.length > 0
      ? item.skills.join(", ")
      : "No skills added";

  const referredFor =
    item.jobId?.title ||
    item.jobId?.category ||
    item.jobId?.company ||
    "Job not available";

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.workerName}>{item.workerName}</Text>

        <View style={styles.tagPill}>
          <Text style={styles.tagText}>{skillText}</Text>
        </View>

        <Text style={styles.phoneLine}>📞 {item.workerPhone}</Text>

        <Text style={styles.referredFor}>
          <Text style={styles.referredLabel}>Referred for: </Text>
          {referredFor}
        </Text>

        {item.createdAt ? (
          <Text style={styles.dateText}>
            Added on {new Date(item.createdAt).toLocaleDateString("en-IN")}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function ReferralsScreen() {
  const router = useRouter();
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReferrals = useCallback(async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        setReferrals([]);
        setLoading(false);
        return;
      }

      const res = await fetch(`${BASE_URL}/referral`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        console.log("Referral fetch error:", data);
        setReferrals([]);
        return;
      }

      setReferrals(Array.isArray(data.referrals) ? data.referrals : []);
    } catch (error) {
      console.log("Referral fetch error:", error);
      setReferrals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchReferrals();
    }, [fetchReferrals])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Referrals</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerText}>🔗 Workers you've referred</Text>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={referrals}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <ReferralCard item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔗</Text>
              <Text style={styles.emptyText}>No referrals yet.</Text>
              <Text style={styles.emptySubtext}>
                Refer a worker from the Live Jobs page to build your trusted
                network.
              </Text>
            </View>
          }
        />
      )}
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

  backText: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 32,
  },

  headerTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "700",
  },

  infoBanner: {
    backgroundColor: Colors.primaryPale,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: Colors.divider,
  },

  infoBannerText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "500",
    textAlign: "center",
  },

  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  list: {
    padding: Spacing.md,
    flexGrow: 1,
  },

  card: {
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: "row",
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.sm,
  },

  cardLeft: {
    justifyContent: "flex-start",
    paddingTop: 4,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 16,
  },

  cardBody: {
    flex: 1,
    gap: 5,
  },

  workerName: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
  },

  tagPill: {
    alignSelf: "flex-start",
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.primary,
  },

  tagText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },

  phoneLine: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  referredFor: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  referredLabel: {
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  dateText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },

  empty: {
    padding: 60,
    alignItems: "center",
    gap: 10,
  },

  emptyIcon: {
    fontSize: 40,
  },

  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  emptySubtext: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});