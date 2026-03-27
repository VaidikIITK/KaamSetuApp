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
      style={{ width: size, height: size, borderRadius: size / 2 }}
    />
  ) : (
    <View
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
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
          style={{ color: i <= Math.round(rating) ? Colors.starGold : "#DDD", fontSize: 14 }}
        >
          ★
        </Text>
      ))}
      <Text style={styles.ratingText}>
        ({rating > 0 ? rating.toFixed(1) : "0"})
      </Text>
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
    pending:     { label: "Pending",          bg: Colors.warningLight, color: Colors.warning },
    in_progress: { label: "Work in Progress", bg: Colors.successLight, color: Colors.success },
    "in-progress":{ label: "Work in Progress",bg: Colors.successLight, color: Colors.success },
    completed:   { label: "Completed",        bg: "#E3F2FD",           color: "#1565C0" },
    cancelled:   { label: "Cancelled",        bg: Colors.errorLight,   color: Colors.error },
    accepted:    { label: "Accepted",         bg: Colors.successLight, color: Colors.success },
    rejected:    { label: "Rejected",         bg: Colors.errorLight,   color: Colors.error },
  };

  const s = map[status] ?? map.pending;

  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

// ─── Types ──────────────────────────────────────────────────────────────────

type UserType = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  skills?: string[];
  rating?: number;
  averageRating?: number;  // 👈 add this
  totalRatings?: number;   // 👈 add this
  profileImage?: string; // 🔥 ADD THIS
  role?: string;
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
  completedAt?: string;
};

type ApplicationType = {
  _id: string;
  status: string;
  expectedPay: number;
  createdAt: string;
  completedAt?: string;
  jobId?: {
    _id: string;
    category: string;
    description?: string;
    address?: string;
  };
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

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function AccountScreen() {
  const router = useRouter();

  const [refreshing, setRefreshing]               = useState(false);
  const [loading, setLoading]                     = useState(true);
  const [user, setUser]                           = useState<UserType | null>(null);

  // USER (employer) state
  const [myRequests, setMyRequests]               = useState<JobType[]>([]);
  const [myPastRequests, setMyPastRequests]       = useState<JobType[]>([]);

  // WORKER state
  const [myApplications, setMyApplications]       = useState<ApplicationType[]>([]);
  const [myPastApplications, setMyPastApplications] = useState<ApplicationType[]>([]);
  const [myReferrals, setMyReferrals]             = useState<ReferralType[]>([]);

  // ─── Load Data ──────────────────────────────────────────────────────────

  const loadAccountData = async () => {
    setLoading(true);
    try {
      const token      = await AsyncStorage.getItem("token");
      const userString = await AsyncStorage.getItem("user");

      if (!token || !userString) {
        setUser(null);
        return;
      }

      const parsedUser: UserType = JSON.parse(userString);

// Fetch fresh user data from API to get updated rating
const userRes = await fetch(`${API_URL}/api/auth/me`, {
  headers: { Authorization: `Bearer ${token}` },
});
if (userRes.ok) {
  const userData = await userRes.json();
  setUser(userData.user || parsedUser);
  await AsyncStorage.setItem("user", JSON.stringify(userData.user || parsedUser));
} else {
  setUser(parsedUser);
}

      const headers = { Authorization: `Bearer ${token}` };

      if (parsedUser.role === "worker") {
        // ── WORKER: fetch current apps + past apps + referrals ──
        const [appsRes, pastAppsRes, referralsRes] = await Promise.all([
          fetch(`${API_URL}/api/applications/my-applications`,      { headers }),
          fetch(`${API_URL}/api/applications/my-past-applications`, { headers }),
          fetch(`${API_URL}/api/referral`,                          { headers }),
        ]);

        const appsData     = await appsRes.json();
        const pastAppsData = await pastAppsRes.json();
        const referralsData= await referralsRes.json();

        setMyApplications(
          appsRes.ok ? appsData.applications || [] : []
        );
        setMyPastApplications(
          pastAppsRes.ok ? pastAppsData.applications || [] : []
        );
        setMyReferrals(
          referralsRes.ok && Array.isArray(referralsData.referrals)
            ? referralsData.referrals
            : []
        );
      } else {
        // ── USER (employer): fetch current jobs + past jobs ──
        const [requestsRes, pastRequestsRes] = await Promise.all([
          fetch(`${API_URL}/api/jobs/my-requests/${parsedUser._id}`,      { headers }),
          fetch(`${API_URL}/api/jobs/my-past-requests/${parsedUser._id}`, { headers }),
        ]);

        const requestsData     = await requestsRes.json();
        const pastRequestsData = await pastRequestsRes.json();

        setMyRequests(
          requestsRes.ok && Array.isArray(requestsData) ? requestsData : []
        );
        setMyPastRequests(
          pastRequestsRes.ok && Array.isArray(pastRequestsData) ? pastRequestsData : []
        );
      }
    } catch (error) {
      console.log("Account load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAccountData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, []),
  );

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    router.replace("/(auth)/login");
  };

  const handleUpdateProfile  = () => router.push("/update-profile");
  const handleOpenReferrals  = () => router.push("/referrals");

  // Delete a pending job request (employer)
  const handleDeleteJob = (jobId: string) => {
    Alert.alert(
      "Delete Request",
      "Are you sure you want to delete this job request? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token    = await AsyncStorage.getItem("token");
              const response = await fetch(`${API_URL}/api/jobs/${jobId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              const data = await response.json();

              if (response.ok) {
                setMyRequests((prev) => prev.filter((j) => j._id !== jobId));
                Alert.alert("Success", "Job deleted successfully.");
              } else {
                Alert.alert("Error", data.error || "Failed to delete the job.");
              }
            } catch {
              Alert.alert("Error", "A network error occurred while trying to delete.");
            }
          },
        },
      ],
    );
  };

  // Mark an in-progress job as completed (employer)
  const handleCompleteJob = (jobId: string) => {
    Alert.alert(
      "Mark as Completed",
      "Confirm that the work has been done and mark this job as completed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: async () => {
            try {
              const token    = await AsyncStorage.getItem("token");
              const response = await fetch(`${API_URL}/api/jobs/${jobId}/complete`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
              });
              const data = await response.json();

              if (response.ok) {
                // Move it from current → past
                setMyRequests((prev) => prev.filter((j) => j._id !== jobId));
                setMyPastRequests((prev) => [data.job, ...prev]);
                Alert.alert("Success", "Job marked as completed!");
              } else {
                Alert.alert("Error", data.error || "Failed to complete the job.");
              }
            } catch {
              Alert.alert("Error", "A network error occurred.");
            }
          },
        },
      ],
    );
  };

  // Withdraw a pending application (worker)
  const handleWithdrawApplication = (applicationId: string) => {
    Alert.alert(
      "Withdraw Application",
      "Are you sure you want to withdraw this application?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Withdraw",
          style: "destructive",
          onPress: async () => {
            try {
              const token    = await AsyncStorage.getItem("token");
              const response = await fetch(
                `${API_URL}/api/applications/withdraw/${applicationId}`,
                { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
              );
              const data = await response.json();

              if (response.ok) {
                setMyApplications((prev) => prev.filter((a) => a._id !== applicationId));
                Alert.alert("Success", "Application withdrawn.");
              } else {
                Alert.alert("Error", data.message || "Failed to withdraw.");
              }
            } catch {
              Alert.alert("Error", "A network error occurred.");
            }
          },
        },
      ],
    );
  };

  // Delete a past (completed/rejected) application from history (worker)
  const handleDeletePastApplication = (applicationId: string) => {
    Alert.alert(
      "Remove from History",
      "Remove this application record from your history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const token    = await AsyncStorage.getItem("token");
              const response = await fetch(
                `${API_URL}/api/applications/delete/${applicationId}`,
                { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
              );
              const data = await response.json();

              if (response.ok) {
                setMyPastApplications((prev) => prev.filter((a) => a._id !== applicationId));
              } else {
                Alert.alert("Error", data.message || "Failed to remove record.");
              }
            } catch {
              Alert.alert("Error", "A network error occurred.");
            }
          },
        },
      ],
    );
  };

  // ─── Render Helpers ─────────────────────────────────────────────────────

  const renderEmpty = (message: string) => (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  const renderLoadingSpinner = () => (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );

  // ─── USER (employer) sections ────────────────────────────────────────────

  const renderUserSections = () => (
    <>
      {/* ── My Current Requests ── */}
      <SectionHeader title="My Requests" />
      {loading ? renderLoadingSpinner() : myRequests.length === 0 ? (
        renderEmpty("No active requests found.")
      ) : (
        myRequests.map((job) => (
          <View key={job._id} style={styles.requestCard}>
            {/* Delete icon — only for pending jobs */}
            {(job.status || "").toLowerCase() === "pending" && (
              <TouchableOpacity
                style={styles.topRightDeleteBtn}
                onPress={() => handleDeleteJob(job._id)}
              >
                <Text style={styles.topRightDeleteIcon}>🗑️</Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.requestTitle, { paddingRight: 36 }]}>
              {job.category}
            </Text>
            <Text style={styles.requestSub}>{job.description}</Text>
            <Text style={styles.requestSub}>📍 {job.address}</Text>
            <StatusBadge status={job.status} />

            {job.noBudget ? (
              <Text style={styles.requestSub}>Budget: Not specified</Text>
            ) : (
              <Text style={styles.requestSub}>
                💰 Budget: ₹{job.minBudget || 0} – ₹{job.maxBudget || 0}
              </Text>
            )}

            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => router.push(`/applications?jobId=${job._id}`)}
            >
              <Text style={styles.outlineBtnText}>View Applicants</Text>
            </TouchableOpacity>

            {/* Complete button — only for in-progress jobs */}
            {["in_progress", "in-progress"].includes(
              (job.status || "").toLowerCase()
            ) && (
              <TouchableOpacity
                style={styles.completeBtn}
                onPress={() => handleCompleteJob(job._id)}
              >
                <Text style={styles.completeBtnText}>✅ Mark as Completed</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      {/* ── Past Requests ── */}
      <SectionHeader title="Past Requests" />
      {loading ? renderLoadingSpinner() : myPastRequests.length === 0 ? (
        renderEmpty("No past requests found.")
      ) : (
        myPastRequests.map((job) => (
          <View key={job._id} style={[styles.requestCard, styles.pastCard]}>
            <Text style={styles.requestTitle}>{job.category}</Text>
            <Text style={styles.requestSub}>{job.description}</Text>
            <Text style={styles.requestSub}>📍 {job.address}</Text>
            <StatusBadge status={job.status} />

            {job.noBudget ? (
              <Text style={styles.requestSub}>Budget: Not specified</Text>
            ) : (
              <Text style={styles.requestSub}>
                💰 Budget: ₹{job.minBudget || 0} – ₹{job.maxBudget || 0}
              </Text>
            )}

            {job.completedAt && (
              <Text style={styles.requestSub}>
                🗓 Completed: {new Date(job.completedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        ))
      )}
    </>
  );

  // ─── WORKER sections ─────────────────────────────────────────────────────

  const renderWorkerSections = () => (
    <>
      {/* ── My Current Applications ── */}
      <SectionHeader title="My Applications" />
      {loading ? renderLoadingSpinner() : myApplications.length === 0 ? (
        renderEmpty("No active applications found.")
      ) : (
        myApplications.map((app) => (
          <View key={app._id} style={styles.requestCard}>
            <Text style={styles.requestTitle}>
              {app.jobId?.category || "Job"}
            </Text>
            <Text style={styles.requestSub}>{app.jobId?.description}</Text>
            {app.jobId?.address && (
              <Text style={styles.requestSub}>📍 {app.jobId.address}</Text>
            )}
            <StatusBadge status={app.status} />
            <Text style={styles.requestSub}>💰 Expected Pay: ₹{app.expectedPay}</Text>
            <Text style={styles.requestSub}>
              📅 Applied: {new Date(app.createdAt).toLocaleDateString()}
            </Text>

            {/* Withdraw — only for pending applications */}
            {app.status === "pending" && (
              <TouchableOpacity
                style={styles.dangerOutlineBtn}
                onPress={() => handleWithdrawApplication(app._id)}
              >
                <Text style={styles.dangerOutlineBtnText}>Withdraw Application</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      {/* ── Past Applications ── */}
      <SectionHeader title="Past Applications" />
      {loading ? renderLoadingSpinner() : myPastApplications.length === 0 ? (
        renderEmpty("No past applications found.")
      ) : (
        myPastApplications.map((app) => (
          <View key={app._id} style={[styles.requestCard, styles.pastCard]}>
            {/* Delete history icon */}
            <TouchableOpacity
              style={styles.topRightDeleteBtn}
              onPress={() => handleDeletePastApplication(app._id)}
            >
              <Text style={styles.topRightDeleteIcon}>🗑️</Text>
            </TouchableOpacity>

            <Text style={[styles.requestTitle, { paddingRight: 36 }]}>
              {app.jobId?.category || "Job"}
            </Text>
            <StatusBadge status={app.status} />
            <Text style={styles.requestSub}>💰 Expected Pay: ₹{app.expectedPay}</Text>
            <Text style={styles.requestSub}>
              📅 Applied: {new Date(app.createdAt).toLocaleDateString()}
            </Text>
            {app.completedAt && (
              <Text style={styles.requestSub}>
                🗓 Completed: {new Date(app.completedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        ))
      )}

      {/* ── Referred Workers ── */}
      <SectionHeader title="Referred Workers" />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : myReferrals.length === 0 ? (
        renderEmpty("No referred workers found.")
      ) : (
        <TouchableOpacity style={styles.quickCard} onPress={handleOpenReferrals}>
          <Text style={styles.quickCardTitle}>Referred Workers</Text>
          <Text style={styles.quickCardSub}>
            {myReferrals.length} referred worker(s) — tap to view
          </Text>
        </TouchableOpacity>
      )}
    </>
  );

  // ─── Render ──────────────────────────────────────────────────────────────

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
        {/* ── Profile Card ── */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <Avatar
              name={user?.name || "User"}
              profileImage={
                user?.profileImage ? `${API_URL}${user.profileImage}` : undefined
              }
              size={72}
            />

            <View style={styles.profileInfo}>
              <View style={styles.profileNameRow}>
                <Text style={styles.profileName}>
                  {user?.name || "Loading..."}
                </Text>
                <TouchableOpacity onPress={handleUpdateProfile} style={styles.editIcon}>
                  <Text style={styles.editIconText}>✏️</Text>
                </TouchableOpacity>
              </View>

             <StarRating rating={user?.averageRating || 0} />

              {/* Role badge */}
              {user?.role && (
                <View style={[styles.roleBadge,
                  { backgroundColor: user.role === "worker"
                    ? Colors.primary + "20"
                    : Colors.warningLight }
                ]}>
                  <Text style={[styles.roleBadgeText,
                    { color: user.role === "worker" ? Colors.primary : Colors.warning }
                  ]}>
                    {user.role === "worker" ? "👷 Worker" : "🧑‍💼 Employer"}
                  </Text>
                </View>
              )}

              {/* Skills — only for workers */}
              {user?.role === "worker" && user.skills && user.skills.length > 0 && (
                <View style={styles.tagsRow}>
                  {user.skills.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.profileText}>Email: {user?.email || "-"}</Text>
              <Text style={styles.profileText}>Phone: {user?.phone || "-"}</Text>
              <Text style={styles.profileText}>
                Address: {user?.address?.trim() ? user.address : "-"}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdateProfile}>
            <Text style={styles.primaryBtnText}>Update Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ── Role-based Sections ── */}
        {user?.role === "worker"
          ? renderWorkerSections()
          : renderUserSections()}

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  header: {
    backgroundColor: Colors.primary,
    alignItems: "center",
    paddingVertical: 16,
  },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: "700" },

  scrollContent: { padding: Spacing.md, gap: 14 },

  centered: { paddingVertical: 28, alignItems: "center", justifyContent: "center" },

  // ── Profile Card
  profileCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.md,
    gap: 12,
  },
  profileTop: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  profileInfo: { flex: 1, gap: 4 },
  profileNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileName: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary },
  profileText: { fontSize: 14, color: Colors.textSecondary },
  editIcon: { padding: 4 },
  editIconText: { fontSize: 16 },

  // ── Avatar
  avatar: { backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: Colors.white, fontWeight: "700" },

  // ── Stars
  starsRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  ratingText: { fontSize: 13, color: Colors.textSecondary },

  // ── Role Badge
  roleBadge: {
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  roleBadgeText: { fontSize: 12, fontWeight: "700" },

  // ── Skills Tags
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  tag: {
    backgroundColor: Colors.primary + "20",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },

  // ── Section Header
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  sectionAccent: { width: 4, height: 18, borderRadius: 2, backgroundColor: Colors.primary },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary, marginTop: 6 },

  // ── Status Badge
  badge: { alignSelf: "flex-start", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "600" },

  // ── Buttons
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: Colors.white, fontWeight: "700" },

  logoutBtn: {
    backgroundColor: "#D9534F",
    borderRadius: Radius.full,
    paddingVertical: 12,
    alignItems: "center",
  },
  logoutBtnText: { color: Colors.white, fontWeight: "700" },

  outlineBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 6,
  },
  outlineBtnText: { color: Colors.primary, fontWeight: "700" },

  completeBtn: {
    backgroundColor: Colors.success,
    borderRadius: Radius.full,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 6,
  },
  completeBtnText: { color: Colors.white, fontWeight: "700" },

  dangerOutlineBtn: {
    borderWidth: 1.5,
    borderColor: Colors.error,
    borderRadius: Radius.full,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 6,
  },
  dangerOutlineBtnText: { color: Colors.error, fontWeight: "700" },

  // ── Cards
  emptyCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  emptyText: { fontSize: 15, color: Colors.textMuted },

  requestCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.md,
    gap: 6,
    position: "relative",
  },
  pastCard: {
    opacity: 0.85,
  },
  requestTitle: { fontSize: 17, fontWeight: "700", color: Colors.textPrimary },
  requestSub: { fontSize: 14, color: Colors.textSecondary },

  topRightDeleteBtn: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 10,
    padding: 4,
  },
  topRightDeleteIcon: { fontSize: 20 },

  quickCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.sm,
  },
  quickCardTitle: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  quickCardSub: { marginTop: 6, fontSize: 12, color: Colors.textSecondary },
});