import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
} from "../../constants/kaamsetuTheme";
import { referrals } from "../../constants/mockData";

const API_URL = "http://172.24.202.171:8000";

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
  const s = map[status] ?? map["pending"];
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
  profileImage?: string; // 🔥 ADD THIS
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

export default function AccountScreen() {
  const router = useRouter();

  const [user, setUser] = useState<UserType | null>(null);
  const [myRequests, setMyRequests] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [myApplications, setMyApplications] = useState<any[]>([]);

  const loadAccountData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userString = await AsyncStorage.getItem("user");

      if (!token || !userString) {
        setLoading(false);
        return;
      }

      const parsedUser: UserType = JSON.parse(userString);
      setUser(parsedUser);

      const requestsRes = await fetch(
        `${API_URL}/api/jobs/my-requests/${parsedUser._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const appsRes = await fetch(`${API_URL}/api/applications/my-applications`, {
  headers: { Authorization: `Bearer ${token}` },
});
const appsData = await appsRes.json();
if (appsRes.ok) {
  setMyApplications(appsData.applications || []);
}

      const requestsData = await requestsRes.json();

      if (requestsRes.ok && Array.isArray(requestsData)) {
        setMyRequests(requestsData);
      } else {
        setMyRequests([]);
      }
    } catch (error) {
      console.log("Account load error:", error);
      setMyRequests([]);
    } finally {
      setLoading(false);
    }
  };
  // ✅ REPLACE WITH THIS
  useFocusEffect(
    useCallback(() => {
      const loadUser = async () => {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      };
      loadUser();
    }, []),
  );
  // if (!user) return null;

  useEffect(() => {
    loadAccountData();
  }, []);

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

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <Avatar
              name={user?.name || "User"}
              profileImage={user?.profileImage}
              size={72}
            />

            <View style={styles.profileInfo}>
              <View style={styles.profileNameRow}>
                <Text style={styles.profileName}>
                  {user?.name || "Loading..."}
                </Text>

                <TouchableOpacity
                  onPress={() => router.push("/update-profile")}
                  style={styles.editIcon}
                >
                  <Text style={styles.editIconText}>✏️</Text>
                </TouchableOpacity>
              </View>

              <StarRating rating={user?.rating || 0} />

              {/* Skills */}
              {user?.skills && user.skills.length > 0 && (
                <View style={styles.tagsRow}>
                  {user.skills.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Extra details (from other branch) */}
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

          <TouchableOpacity
            onPress={() =>
              router.push("/job-chat?chatId=69c39b7dcf8d1328e3f5ffd1")
            }
            style={styles.testChatBtn}
          >
            <Text style={styles.testChatBtnText}>Open Test Chat</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>My Requests (Current)</Text>

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
              <Text style={styles.requestTitle}>{job.category}</Text>
              <Text style={styles.requestSub}>{job.description}</Text>
              <Text style={styles.requestSub}>Address: {job.address}</Text>
              <Text style={styles.requestSub}>Status: {job.status}</Text>

              {job.noBudget ? (
                <Text style={styles.requestSub}>Budget: Not specified</Text>
              ) : (
                <Text style={styles.requestSub}>
                  Budget: ₹{job.minBudget || 0} - ₹{job.maxBudget || 0}
                </Text>
              )}

              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => router.push(`/applications?jobId=${job._id}`)}
              >
                <Text style={styles.outlineBtnText}>View Applicants</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>My Applications</Text>

        <Text style={styles.sectionTitle}>My Applications</Text>

{myApplications.length === 0 ? (
  <View style={styles.emptyCard}>
    <Text style={styles.emptyText}>No applications found.</Text>
  </View>
) : (
  myApplications.map((app) => (
    <View key={app._id} style={styles.requestCard}>
      <Text style={styles.requestTitle}>{app.jobId?.category}</Text>
      <Text style={styles.requestSub}>Status: {app.status}</Text>
      <Text style={styles.requestSub}>Expected Pay: ₹{app.expectedPay}</Text>
      <Text style={styles.requestSub}>
        Applied: {new Date(app.createdAt).toLocaleDateString()}
      </Text>
    </View>
  ))
)}

        <Text style={styles.sectionTitle}>Referrals</Text>

        {referrals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No referrals found.</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.quickCard}
            onPress={handleOpenReferrals}
          >
            <Text style={styles.quickCardTitle}>Referrals</Text>
            <Text style={styles.quickCardSub}>
              {referrals.length} referral item(s) available
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
  profileName: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  profileText: {
    fontSize: 14,
    color: Colors.textSecondary,
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
  testChatBtn: {
    backgroundColor: "green",
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  testChatBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginTop: 6,
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
  outlineBtn: {
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 10,
    alignItems: "center",
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
  avatar: {
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#fff",
    fontWeight: "bold",
  },

  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  ratingText: {
    marginLeft: 5,
    fontSize: 12,
    color: Colors.textSecondary,
  },

  profileTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  profileInfo: {
    marginLeft: 12,
    flex: 1,
  },

  profileNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  editIcon: {
    marginLeft: 8,
  },

  editIconText: {
    fontSize: 16,
  },

  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },

  tag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 5,
    marginTop: 5,
  },

  tagText: {
    color: "#fff",
    fontSize: 12,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  sectionAccent: {
    width: 4,
    height: 16,
    backgroundColor: Colors.primary,
    marginRight: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 6,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
