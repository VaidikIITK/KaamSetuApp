import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

const API_URL = "http://172.27.16.252:8030";

type ApplicationItem = {
  _id: string;
  workerId: string;
  status?: string;
};

type ReferralItem = {
  _id: string;
  workerName: string;
  workerPhone: string;
  skills?: string[];
  createdAt?: string;
  jobId?: string | { _id: string; title?: string; company?: string };
};

type ListRow =
  | { type: "section"; id: string; title: string }
  | { type: "application"; id: string; data: ApplicationItem }
  | { type: "referral"; id: string; data: ReferralItem };

export default function ApplicationListScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();

  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token || !jobId) {
        setLoading(false);
        return;
      }

      const [applicationsRes, referralsRes] = await Promise.all([
        fetch(`${API_URL}/api/applications/job/${jobId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_URL}/api/referral`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const applicationsData = await applicationsRes.json();
      const referralsData = await referralsRes.json();

      if (!applicationsRes.ok) {
        console.log("Applications fetch error:", applicationsData);
        setApplications([]);
      } else {
        setApplications(
          Array.isArray(applicationsData)
            ? applicationsData
            : applicationsData.applications || []
        );
      }

      if (!referralsRes.ok) {
        console.log("Referrals fetch error:", referralsData);
        setReferrals([]);
      } else {
        setReferrals(
          Array.isArray(referralsData?.referrals) ? referralsData.referrals : []
        );
      }
    } catch (error) {
      console.log("Applications/referrals fetch error:", error);
      setApplications([]);
      setReferrals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [jobId]);

  const filteredReferrals = useMemo(() => {
    return referrals.filter((item) => {
      if (!item.jobId || !jobId) return false;

      if (typeof item.jobId === "string") {
        return item.jobId === jobId;
      }

      return item.jobId._id === jobId;
    });
  }, [referrals, jobId]);

  const listData: ListRow[] = useMemo(() => {
    const rows: ListRow[] = [];

    rows.push({
      type: "section",
      id: "applicants-section",
      title: "Applicants",
    });

    if (applications.length > 0) {
      applications.forEach((item) => {
        rows.push({
          type: "application",
          id: `application-${item._id}`,
          data: item,
        });
      });
    }

    rows.push({
      type: "section",
      id: "referrals-section",
      title: "Referred Workers",
    });

    if (filteredReferrals.length > 0) {
      filteredReferrals.forEach((item) => {
        rows.push({
          type: "referral",
          id: `referral-${item._id}`,
          data: item,
        });
      });
    }

    return rows;
  }, [applications, filteredReferrals]);

  const renderItem = ({ item }: { item: ListRow }) => {
    if (item.type === "section") {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{item.title}</Text>
        </View>
      );
    }

    if (item.type === "application") {
      const app = item.data;

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            router.push(
              `/worker-profile?workerId=${app.workerId}&jobId=${jobId}&applicationId=${app._id}`
            )
          }
        >
          <Text style={styles.cardTitle}>Worker ID: {app.workerId}</Text>
          <Text style={styles.cardSubtitle}>
            Status: {app.status || "pending"}
          </Text>
          <Text style={styles.openText}>View Profile →</Text>
        </TouchableOpacity>
      );
    }

    const referral = item.data;

    return (
      <View style={styles.referralCard}>
        <Text style={styles.cardTitle}>{referral.workerName}</Text>
        <Text style={styles.cardSubtitle}>Phone: {referral.workerPhone}</Text>

        {referral.skills && referral.skills.length > 0 ? (
          <Text style={styles.cardSubtitle}>
            Skills: {referral.skills.join(", ")}
          </Text>
        ) : null}

        {referral.createdAt ? (
          <Text style={styles.metaText}>
            Referred on: {new Date(referral.createdAt).toLocaleDateString("en-IN")}
          </Text>
        ) : null}

        <View style={styles.noChatBadge}>
          <Text style={styles.noChatText}>No Chat Available</Text>
        </View>
      </View>
    );
  };

  const keyExtractor = (item: ListRow) => item.id;

  const showApplicantsEmpty = applications.length === 0;
  const showReferralsEmpty = filteredReferrals.length === 0;
  const showCompletelyEmpty = showApplicantsEmpty && showReferralsEmpty;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Applicants</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : showCompletelyEmpty ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No applicants or referred workers found.</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            <>
              {showApplicantsEmpty && (
                <View style={styles.emptyBlock}>
                  <Text style={styles.emptyMiniText}>No applicants found.</Text>
                </View>
              )}
              {showReferralsEmpty && (
                <View style={styles.emptyBlock}>
                  <Text style={styles.emptyMiniText}>No referred workers found.</Text>
                </View>
              )}
            </>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
  },

  header: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },

  backBtn: {
    width: 36,
    justifyContent: "center",
  },

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

  listContent: {
    padding: Spacing.md,
    gap: 12,
  },

  sectionHeader: {
    marginTop: 4,
    marginBottom: 2,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
  },

  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.md,
  },

  referralCard: {
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

  metaText: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.textMuted,
  },

  noChatBadge: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: "#F1F3F5",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  noChatText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
  },

  emptyText: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: "center",
  },

  emptyBlock: {
    marginTop: 4,
    marginBottom: 4,
  },

  emptyMiniText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
