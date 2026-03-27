import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  KColors as Colors,
  Radius,
  Shadow,
  Spacing,
} from "../../constants/kaamsetuTheme";

const API_URL = "http://172.27.16.252:8030";

// ─── Reusable Components ────────────────────────────────────────────────────

function Avatar({
  name,
  profileImage,
  size = 72,
}: {
  name: string;
  profileImage?: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return profileImage ? (
    <Image
      source={{ uri: profileImage }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
      }}
    />
  ) : (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.35 }]}>
        {initials}
      </Text>
    </View>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text
          key={i}
          style={{
            color: i <= Math.round(rating) ? Colors.starGold : "#DDD",
            fontSize: 14,
          }}
        >
          ★
        </Text>
      ))}
      <Text style={styles.ratingText}> ({rating})</Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    pending: {
      label: "Pending",
      bg: Colors.warningLight,
      color: Colors.warning,
    },
    in_progress: {
      label: "Work in Progress",
      bg: Colors.successLight,
      color: Colors.success,
    },
    completed: { label: "Completed", bg: "#E3F2FD", color: "#1565C0" },
    cancelled: {
      label: "Cancelled",
      bg: Colors.errorLight,
      color: Colors.error,
    },
  };

  const s = map[status] ?? map.pending;

  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

type UserType = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  skills?: string[];
  rating?: number;
  profileImage?: string;
};

type JobType = {
  _id: string;
  category: string;
  description: string;
  address: string;
  status: string;
  minBudget?: number;
  maxBudget?: number;
  noBudget?: boolean;
};

type ReferralType = {
  _id: string;
  workerName: string;
  workerPhone: string;
  skills?: string[];
  createdAt?: string;
  jobId?: {
    _id: string;
    title?: string;
    company?: string;
  };
};

export default function AccountScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [myRequests, setMyRequests] = useState<JobType[]>([]);
  const [myReferrals, setMyReferrals] = useState<ReferralType[]>([]);
  const [loading, setLoading] = useState(true);
  const [myApplications, setMyApplications] = useState<any[]>([]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAccountData();
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  const loadAccountData = async () => {
    setLoading(true); // 🔥 ADD THIS
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      const userString = await AsyncStorage.getItem("user");

      if (!token || !userString) {
        setUser(null);
        setMyRequests([]);
        setMyReferrals([]);
        return;
      }

      const parsedUser: UserType = JSON.parse(userString);
      setUser(parsedUser);

      const [requestsRes, referralsRes] = await Promise.all([
        fetch(`${API_URL}/api/jobs/my-requests/${parsedUser._id}`, {
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

      const appsRes = await fetch(
        `${API_URL}/api/applications/my-applications`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const appsData = await appsRes.json();
      if (appsRes.ok) {
        setMyApplications(appsData.applications || []);
      }

      const requestsData = await requestsRes.json();
      const referralsData = await referralsRes.json();

      if (requestsRes.ok && Array.isArray(requestsData)) {
        setMyRequests(requestsData);
      } else {
        setMyRequests([]);
      }

      if (referralsRes.ok && Array.isArray(referralsData.referrals)) {
        setMyReferrals(referralsData.referrals);
      } else {
        setMyReferrals([]);
      }
    } catch (error) {
      console.log("Account load error:", error);
      setMyRequests([]);
      setMyReferrals([]);
    } finally {
      setLoading(false);
    }
  };
  // ✅ REPLACE WITH THIS
  useFocusEffect(
    useCallback(() => {
      onRefresh();

      return () => {
        // optional cleanup (safe)
      };
    }, []),
  );
  // if (!user) return null;

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    router.replace("/(auth)/login");
  };

  const handleUpdateProfile = () => {
    router.push("/update-profile");
  };

  const handleOpenApplications = () => {
    router.push("/applications");
  };

  const handleOpenReferrals = () => {
    router.push("/referrals");
  };

  // 🔥 CLEANED: Delete Job Handler (Production Ready)
  const handleDeleteJob = (jobId: string) => {
    Alert.alert(
      "Delete Request",
      "Are you sure you want to delete this job request? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");

              const response = await fetch(`${API_URL}/api/jobs/${jobId}`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              const data = await response.json();

              if (response.ok) {
                // Remove the deleted job from the local state
                setMyRequests((prevRequests) =>
                  prevRequests.filter((job) => job._id !== jobId),
                );
                Alert.alert("Success", "Job deleted successfully.");
              } else {
                Alert.alert("Error", data.error || "Failed to delete the job.");
              }
            } catch (error) {
              console.log("Delete error:", error);
              Alert.alert(
                "Error",
                "A network error occurred while trying to delete.",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <Avatar
              name={user?.name || "User"}
              profileImage={
                user?.profileImage
                  ? `${API_URL}${user.profileImage}`
                  : undefined
              }
              size={72}
            />

            <View style={styles.profileInfo}>
              <View style={styles.profileNameRow}>
                <Text style={styles.profileName}>
                  {user?.name || "Loading..."}
                </Text>

                <TouchableOpacity
                  onPress={handleUpdateProfile}
                  style={styles.editIcon}
                >
                  <Text style={styles.editIconText}>✏️</Text>
                </TouchableOpacity>
              </View>

              <StarRating rating={user?.rating || 0} />

              {user?.skills && user.skills.length > 0 && (
                <View style={styles.tagsRow}>
                  {user.skills.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.profileText}>
                Email: {user?.email || "-"}
              </Text>
              <Text style={styles.profileText}>
                Phone: {user?.phone || "-"}
              </Text>
              <Text style={styles.profileText}>
                Address: {user?.address?.trim() ? user.address : "-"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleUpdateProfile}
          >
            <Text style={styles.primaryBtnText}>Update Profile</Text>
          </TouchableOpacity>
        </View>

        <SectionHeader title="My Requests (Current)" />

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : myRequests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No requests found.</Text>
          </View>
        ) : (
          myRequests.map((job) => (
            <View key={job._id} style={styles.requestCard}>
              {/* 🔥 ADDED: Small Top-Right Delete Icon */}
              {job.status.toLowerCase() === "pending" && (
                <TouchableOpacity
                  style={styles.topRightDeleteBtn}
                  onPress={() => handleDeleteJob(job._id)}
                >
                  <Text style={styles.topRightDeleteIcon}>🗑️</Text>
                </TouchableOpacity>
              )}

              {/* Added paddingRight to title so long text doesn't overlap the icon */}
              <Text style={[styles.requestTitle, { paddingRight: 30 }]}>
                {job.category}
              </Text>

              <Text style={styles.requestSub}>{job.description}</Text>
              <Text style={styles.requestSub}>Address: {job.address}</Text>
              <StatusBadge status={job.status} />

              {job.noBudget ? (
                <Text style={styles.requestSub}>Budget: Not specified</Text>
              ) : (
                <Text style={styles.requestSub}>
                  Budget: ₹{job.minBudget || 0} - ₹{job.maxBudget || 0}
                </Text>
              )}

              {/* 🔥 REVERTED: Standard Full-Width Outline Button */}
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => router.push(`/applications?jobId=${job._id}`)}
              >
                <Text style={styles.outlineBtnText}>View Applicants</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <SectionHeader title="My Applications" />

        {/* <Text style={styles.sectionTitle}>My Applications</Text> */}

        {myApplications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No applications found.</Text>
          </View>
        ) : (
          myApplications.map((app) => (
            <View key={app._id} style={styles.requestCard}>
              <Text style={styles.requestTitle}>{app.jobId?.category}</Text>
              <Text style={styles.requestSub}>Status: {app.status}</Text>
              <Text style={styles.requestSub}>
                Expected Pay: ₹{app.expectedPay}
              </Text>
              <Text style={styles.requestSub}>
                Applied: {new Date(app.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}

        <SectionHeader title="Referred Workers" />

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : myReferrals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No referred workers found.</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.quickCard}
            onPress={handleOpenReferrals}
          >
            <Text style={styles.quickCardTitle}>Referred Workers</Text>
            <Text style={styles.quickCardSub}>
              {myReferrals.length} referred worker(s) available
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  header: {
    backgroundColor: Colors.primary,
    alignItems: "center",
    paddingVertical: 16,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: "700",
  },

  scrollContent: {
    padding: Spacing.md,
    gap: 14,
  },

  centered: {
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  profileCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.md,
    gap: 12,
  },
  profileTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  profileText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  editIcon: {
    padding: 4,
  },
  editIconText: {
    fontSize: 16,
  },

  avatar: {
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: Colors.white,
    fontWeight: "700",
  },

  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  ratingText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  tag: {
    backgroundColor: Colors.primary + "20",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  sectionAccent: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },

  badge: {
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    color: Colors.white,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginTop: 6,
  },

  logoutBtn: {
    backgroundColor: "#D9534F",
    borderRadius: Radius.full,
    paddingVertical: 12,
    alignItems: "center",
  },
  logoutBtnText: {
    color: Colors.white,
    fontWeight: "700",
  },

  emptyCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textMuted,
  },

  requestCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.md,
    gap: 6,
    position: "relative", // Ensure absolute children position relative to this card
  },

  requestTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  requestSub: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // 🔥 ADDED: Styles for the top-right delete icon
  topRightDeleteBtn: {
    position: "absolute",
    top: Spacing.md, // Aligns perfectly with the padding of the card
    right: Spacing.md,
    zIndex: 10,
    padding: 4, // Makes the touch target a bit larger so it's easy to tap
  },
  topRightDeleteIcon: {
    fontSize: 20,
  },

  outlineBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 10, // Added margin back since we removed the row container
  },
  outlineBtnText: {
    color: Colors.primary,
    fontWeight: "700",
  },

  quickCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.sm,
  },
  quickCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  quickCardSub: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
