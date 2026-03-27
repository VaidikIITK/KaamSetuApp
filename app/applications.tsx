import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

type WorkerRef =
  | string
  | {
      _id: string;
      name?: string;
      phone?: string;
      skills?: string[];
    }
  | null;

type ApplicationItem = {
  _id: string;
  workerId?: WorkerRef;
  workerName?: string;
  workerPhone?: string;
  skills?: string[];
  status?: string;
  source?: "direct" | "referral";
  jobId?: string | { _id: string };
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

  const getWorkerIdValue = (workerId?: WorkerRef) => {
    if (!workerId) return null;
    return typeof workerId === "string" ? workerId : workerId._id;
  };

  const getWorkerDisplayName = (app: ApplicationItem) => {
    if (app.workerName) return app.workerName;

    if (app.workerId && typeof app.workerId !== "string" && app.workerId.name) {
      return app.workerId.name;
    }

    if (app.workerPhone) {
      return `Worker (${app.workerPhone})`;
    }

    if (app.workerId && typeof app.workerId === "string") {
      return `Worker ID: ${app.workerId}`;
    }

    return "Worker";
  };

  const getWorkerPhone = (app: ApplicationItem) => {
    if (app.workerPhone) return app.workerPhone;

    if (app.workerId && typeof app.workerId !== "string") {
      return app.workerId.phone || null;
    }

    return null;
  };

  const getWorkerSkills = (app: ApplicationItem) => {
    if (app.skills && app.skills.length > 0) return app.skills;

    if (app.workerId && typeof app.workerId !== "string") {
      return app.workerId.skills || [];
    }

    return [];
  };

  const getJobIdValue = (app: ApplicationItem) => {
    if (app.jobId && typeof app.jobId !== "string") return app.jobId._id;
    if (app.jobId && typeof app.jobId === "string") return app.jobId;
    return jobId || null;
  };

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
            : applicationsData.applications || [],
        );
      }

      if (!referralsRes.ok) {
        console.log("Referrals fetch error:", referralsData);
        setReferrals([]);
      } else {
        setReferrals(
          Array.isArray(referralsData?.referrals)
            ? referralsData.referrals
            : [],
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

  const handleAccept = async (applicationId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await fetch(
        `${API_URL}/api/applications/accept/${applicationId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", "Worker accepted!");
        fetchData();
      } else {
        Alert.alert("Error", data.message || "Failed to accept");
      }
    } catch (error) {
      console.log("Accept error:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const handleReject = async (applicationId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await fetch(
        `${API_URL}/api/applications/reject/${applicationId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", "Worker rejected!");
        fetchData();
      } else {
        Alert.alert("Error", data.message || "Failed to reject");
      }
    } catch (error) {
      console.log("Reject error:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const handleChat = async (app: ApplicationItem) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const workerIdValue = getWorkerIdValue(app.workerId);
      const jobIdValue = getJobIdValue(app);

      if (!token || !jobIdValue || !workerIdValue || !app._id) {
        Alert.alert("Error", "Missing chat details");
        return;
      }

      const res = await fetch(`${API_URL}/api/chat/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: jobIdValue,
          workerId: workerIdValue,
          applicationId: app._id,
        }),
      });

      const data = await res.json();

      if (res.ok && data.chat?._id) {
        router.push(`/job-chat?chatId=${data.chat._id}`);
      } else {
        Alert.alert("Error", data.message || "Could not open chat");
      }
    } catch (error) {
      console.log("Chat error:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };

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
      const workerIdValue = getWorkerIdValue(app.workerId);
      const canOpenProfile = !!workerIdValue;
      const status = app.status || "pending";
      const workerDisplayName = getWorkerDisplayName(app);
      const workerPhone = getWorkerPhone(app);
      const workerSkills = getWorkerSkills(app);

      return (
        <View style={styles.card}>
          <TouchableOpacity
            disabled={!canOpenProfile}
            onPress={() => {
              if (!workerIdValue) return;
              router.push(
                `/worker-profile?workerId=${workerIdValue}&jobId=${jobId}&applicationId=${app._id}`,
              );
            }}
          >
            <Text style={styles.cardTitle}>{workerDisplayName}</Text>

            {workerPhone ? (
              <Text style={styles.cardSubtitle}>Phone: {workerPhone}</Text>
            ) : null}

            {workerSkills.length > 0 ? (
              <Text style={styles.cardSubtitle}>
                Skills: {workerSkills.join(", ")}
              </Text>
            ) : null}

            <Text style={styles.cardSubtitle}>Status: {status}</Text>

            <Text style={styles.cardSubtitle}>
              Type: {app.source === "referral" ? "Referred" : "Applied"}
            </Text>

            {canOpenProfile ? (
              <Text style={styles.openText}>View Profile →</Text>
            ) : (
              <Text style={styles.metaText}>Profile not available</Text>
            )}
          </TouchableOpacity>

          <View style={styles.actionRow}>
            {status === "pending" && (
              <>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => handleAccept(app._id)}
                >
                  <Text style={styles.acceptBtnText}>Accept</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => handleReject(app._id)}
                >
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => handleChat(app)}
            >
              <Text style={styles.chatBtnText}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
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
            Referred on:{" "}
            {new Date(referral.createdAt).toLocaleDateString("en-IN")}
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
          <Text style={styles.emptyText}>
            No applicants or referred workers found.
          </Text>
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
                  <Text style={styles.emptyMiniText}>
                    No referred workers found.
                  </Text>
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

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    flexWrap: "wrap",
  },

  acceptBtn: {
    flex: 1,
    backgroundColor: "#2E7D32",
    borderRadius: Radius.full,
    paddingVertical: 12,
    alignItems: "center",
    minWidth: 90,
  },

  acceptBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  rejectBtn: {
    flex: 1,
    backgroundColor: "#C62828",
    borderRadius: Radius.full,
    paddingVertical: 12,
    alignItems: "center",
    minWidth: 90,
  },

  rejectBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  chatBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 12,
    alignItems: "center",
    minWidth: 90,
  },

  chatBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});