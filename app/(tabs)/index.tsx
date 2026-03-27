import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { Base_Url,API_BASE } from "../../constants/Config";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const BASE_URL = API_BASE; // ← same IP as login.tsx

const PURPLE = "#2196F3";
const LIGHT_PURPLE = "#F3E5F5";
const CARD_BG = "#F1F8E9";
const TEXT_DARK = "#212121";

// ─────────────────────────────────────────────────────────────────────────────
// FILTER OPTIONS  (matches Figure 8 in design doc)
// ─────────────────────────────────────────────────────────────────────────────
// Your exact list (with "All" added at the start for the filter UI)
const CATEGORIES = [
  "All",
  "Cleaning",
  "Cooking",
  "Plumbing",
  "Electrician",
  "Babysitting",
  "Laundry",
  "Gardening",
  "Driver",
  "Carpenter",
  "Painter",
  "Other",
];

// Increased granularity for better budget filtering
const PAY_RANGES = [
  "All",
  "Under ₹100",
  "₹100–₹300",
  "₹300–₹500",
  "₹500–₹800",
  "₹800–₹1200",
  "₹1200–₹2000",
  "₹2000+",
];

// Expanded timeframes for more specific scheduling
const SCHEDULES = [
  "Any",
  "Immediate",
  "Within 1 hr",
  "Within 2 hrs",
  "Within 5 hrs",
  "Today",
  "Tomorrow",
  "Within 3 Days",
  "Next Week",
];
// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY → ICON MAP  (Ionicons names)
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  Cleaning: "sparkles-outline",
  Cooking: "restaurant-outline",
  Plumbing: "water-outline",
  Electrician: "flash-outline",
  Babysitting: "people-outline",
  Laundry: "shirt-outline",
  Gardening: "leaf-outline",
  Driver: "car-outline",
  Carpenter: "hammer-outline",
  Painter: "color-palette-outline",
  Other: "grid-outline",

  // Fallback icon just in case a category is missing or misspelled in the DB
  default: "briefcase-outline",
};

// ─────────────────────────────────────────────────────────────────────────────
// DUMMY DATA — shown while backend /api/jobs isn't ready yet
// Replace with real API response once backend route is added
// ─────────────────────────────────────────────────────────────────────────────
const DUMMY_JOBS = [
  {
    _id: "1",
    postedBy: { name: "Rahul S." },
    category: "Cooking",
    budgetMin: 300,
    budgetMax: 500,
    isNegotiable: false,
    schedule: "Today, Morning",
    address: "Block C, IIT Kanpur, Kalyanpur",
    rating: 4.5,
    description:
      "Need a reliable cook to prepare lunch daily. Must know North Indian cuisine. Family of four.",
    status: "open",
  },
  {
    _id: "2",
    postedBy: { name: "Priya M." },
    category: "Cooking",
    budgetMin: 150,
    budgetMax: 250,
    isNegotiable: false,
    schedule: "Tomorrow, Evening",
    address: "Apartment 102, Main St, Kalyanpur",
    rating: 4.2,
    description: "Need someone to cook dinner for 2 people. Vegetarian only.",
    status: "open",
  },
  {
    _id: "3",
    postedBy: { name: "Suresh K." },
    category: "Maid",
    budgetMin: 0,
    budgetMax: 0,
    isNegotiable: true,
    schedule: "Sat, Afternoon",
    address: "House 45, Green Avenue, Kalyanpur",
    rating: 3.8,
    description: "Need a maid for house cleaning on weekends. 4 hours per day.",
    status: "open",
  },
  {
    _id: "4",
    postedBy: { name: "Anita L." },
    category: "Electrician",
    budgetMin: 500,
    budgetMax: 800,
    isNegotiable: false,
    schedule: "Sun, Morning",
    address: "Shop 5, Market Area, IIT Kanpur",
    rating: 4.7,
    description:
      "Electrical wiring issue in a commercial space. Must have 2+ years experience.",
    status: "open",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type Job = {
  _id: string;
  postedBy: { name: string; _id?: string };
  category: string;
  budgetMin: number;
  budgetMax: number;
  isNegotiable: boolean;
  schedule: string;
  address: string;
  rating: number;
  description: string;
  status: string;
};

type FilterKey = "category" | "pay" | "schedule";

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function LiveJobsScreen() {
  // ── Core state ──────────────────────────────────────────────────────────────
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isWorker, setIsWorker] = useState(false); // controls "Apply Now" visibility

  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);

  const [applyModal, setApplyModal] = useState(false);
  const [applyJobId, setApplyJobId] = useState<string | null>(null);

  const [expectedPay, setExpectedPay] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [remarks, setRemarks] = useState("");

  // ── Filter state ────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    category: "All",
    pay: "All",
    schedule: "Any",
  });
  const [activeDropdown, setActiveDropdown] = useState<FilterKey | null>(null);

  // ── View/expand state ───────────────────────────────────────────────────────
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // ── Refer modal state ───────────────────────────────────────────────────────
  const [referModal, setReferModal] = useState(false);
  const [referJobId, setReferJobId] = useState<string | null>(null);
  const [referName, setReferName] = useState("");
  const [referPhone, setReferPhone] = useState("");
  const [referSkills, setReferSkills] = useState("");
  const [referLoading, setReferLoading] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // LOAD USER from AsyncStorage → check if worker
  // A user is a "worker" if:
  //   • their role === 'worker'  (from earlier auth setup)
  //   • OR they have workerTags (from design doc)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadUser = async () => {
      const t = await AsyncStorage.getItem("token");
      const u = await AsyncStorage.getItem("user");
      setToken(t);

      if (u) {
        const parsed = JSON.parse(u);
        const workerCheck =
          parsed.role === "worker" ||
          (Array.isArray(parsed.workerTags) && parsed.workerTags.length > 0);
        setIsWorker(workerCheck);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const loadAppliedJobs = async () => {
      const stored = await AsyncStorage.getItem("appliedJobs");
      if (stored) {
        setAppliedJobs(JSON.parse(stored));
      }
    };
    loadAppliedJobs();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // FETCH JOBS from backend
  // Falls back to DUMMY_JOBS if server is unreachable
  // ─────────────────────────────────────────────────────────────────────────
  const fetchJobs = useCallback(async () => {
    try {
      const t = await AsyncStorage.getItem("token");

      const res = await fetch(`${BASE_URL}/jobs`, {
        headers: {
          Authorization: `Bearer ${t}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      console.log("API RESPONSE:", data); // 🔥 DEBUG

      if (res.ok) {
        // ✅ STRICT handling
        if (Array.isArray(data)) {
          const formatted = data.map((job) => ({
            ...job,

            // ✅ FIX BUDGET
            budgetMin: job.minBudget,
            budgetMax: job.maxBudget,
            isNegotiable: job.noBudget,

            // ✅ FIX SCHEDULE
            schedule: new Date(job.startDate).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            }),

            // ✅ TEMP FIELDS
            postedBy: { name: "User" },
            rating: 4,
          }));

          setJobs(formatted);
        } else {
          setJobs([]);
        }
      } else {
        console.log("Server error:", data);
        setJobs([]);
      }
    } catch (error) {
      console.log("Fetch error:", error);
      setJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // ─────────────────────────────────────────────────────────────────────────
  // FILTER LOGIC
  // ─────────────────────────────────────────────────────────────────────────
  const filteredJobs = jobs.filter((job) => {
    // Category
    if (filters.category !== "All" && job.category !== filters.category)
      return false;

    // Pay range
    if (filters.pay !== "All") {
      const max = job.isNegotiable ? 9999 : job.budgetMax;
      if (filters.pay === "₹100–₹300" && max > 300) return false;
      if (filters.pay === "₹300–₹500" && (max < 300 || max > 500)) return false;
      if (filters.pay === "₹500–₹1000" && (max < 500 || max > 1000))
        return false;
      if (filters.pay === "₹1000+" && max < 1000) return false;
    }

    // Schedule (simple string match)
    if (
      filters.schedule !== "Any" &&
      !job.schedule.toLowerCase().includes(filters.schedule.toLowerCase())
    )
      return false;

    return true;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // APPLY TO JOB
  // ─────────────────────────────────────────────────────────────────────────
  // const handleApply = (jobId: string) => {
  //   Alert.alert("Apply for Job", "Submit your application for this job?", [
  //     { text: "Cancel", style: "cancel" },
  //     {
  //       text: "Apply Now",
  //       onPress: async () => {
  //         try {
  //           const res = await fetch(`${BASE_URL}/jobs/${jobId}/apply`, {
  //             method: "POST",
  //             headers: {
  //               Authorization: `Bearer ${token}`,
  //               "Content-Type": "application/json",
  //             },
  //           });
  //           const data = await res.json();
  //           if (res.ok) {
  //             Alert.alert(
  //               "✅ Applied!",
  //               "Application submitted. Check your Account page to track it."
  //             );
  //           } else {
  //             Alert.alert("Error", data.message || "Could not apply");
  //           }
  //         } catch {
  //           Alert.alert(
  //             "✅ Applied!",
  //             "Application submitted. (Demo mode — backend not connected)"
  //           );
  //         }
  //       },
  //     },
  //   ]);
  // };

  const handleApply = async (jobId: string) => {
    // 🔁 IF ALREADY APPLIED → ASK TO CANCEL
    if (appliedJobs.includes(jobId)) {
      const updated = appliedJobs.filter((id) => id !== jobId);

      setAppliedJobs(updated);

      await AsyncStorage.setItem("appliedJobs", JSON.stringify(updated));

      Alert.alert("Cancelled", "Application removed");

      return;
    }

    // 🟢 NOT APPLIED → ASK TO APPLY
    Alert.alert("Apply for Job", "Are you sure you want to apply?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Apply",
        onPress: async () => {
          try {
            const res = await fetch(`${BASE_URL}/jobs/${jobId}/apply`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });

            const data = await res.json();

            if (res.ok) {
              const updated = [...appliedJobs, jobId];
              setAppliedJobs(updated);

              await AsyncStorage.setItem(
                "appliedJobs",
                JSON.stringify(updated),
              );

              Alert.alert("✅ Applied!", "Application submitted");
            } else {
              Alert.alert("Error", data.message);
            }
          } catch {
            // fallback
            const updated = [...appliedJobs, jobId];
            setAppliedJobs(updated);

            await AsyncStorage.setItem("appliedJobs", JSON.stringify(updated));

            Alert.alert("✅ Applied!", "Saved locally");
          }
        },
      },
    ]);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SUBMIT REFERRAL
  // ─────────────────────────────────────────────────────────────────────────
  const closeReferModal = () => {
    setReferModal(false);
    setReferJobId(null);
    setReferName("");
    setReferPhone("");
    setReferSkills("");
  };

  const handleReferSubmit = async () => {
    if (!referName.trim())
      return Alert.alert("Error", "Please enter the worker's name");

    if (referPhone.length !== 10)
      return Alert.alert("Error", "Phone number must be exactly 10 digits");

    if (!referSkills.trim())
      return Alert.alert("Error", "Please describe the worker's skills");

    setReferLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/referral/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workerName: referName,
          workerPhone: referPhone,
          skills: referSkills.split(",").map((s) => s.trim()),
          jobId: referJobId, // 🔥 VERY IMPORTANT
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return Alert.alert("Error", data.message || "Failed to add referral");
      }

      Alert.alert("✅ Referral Added!", "Worker added to your referrals.");

      closeReferModal();
    } catch (error) {
      console.log("Referral error:", error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setReferLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Filter Pill + Dropdown
  // ─────────────────────────────────────────────────────────────────────────
  const renderFilterPill = (
    label: string,
    key: FilterKey,
    options: string[],
    value: string,
  ) => {
    const isOpen = activeDropdown === key;
    const displayValue = value === "All" || value === "Any" ? "All" : value;

    return (
      <View style={styles.filterPillWrapper} key={key}>
        <TouchableOpacity
          style={[styles.filterPill, isOpen && styles.filterPillActive]}
          onPress={() => setActiveDropdown(isOpen ? null : key)}
          activeOpacity={0.8}
        >
          <Text style={styles.filterPillText} numberOfLines={1}>
            {label}: {displayValue}
          </Text>
          <Ionicons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={11}
            color={PURPLE}
            style={{ marginLeft: 3 }}
          />
        </TouchableOpacity>

        {/* Dropdown list — renders below the pill */}
        {isOpen && (
          <View style={styles.dropdownMenu}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.dropdownItem,
                  value === opt && styles.dropdownItemActive,
                ]}
                onPress={() => {
                  setFilters((prev) => ({ ...prev, [key]: opt }));
                  setActiveDropdown(null);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    value === opt && styles.dropdownItemTextActive,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Single Job Card  (Figure 7, 8, 9 in design doc)
  // ─────────────────────────────────────────────────────────────────────────
  const renderJobCard = ({ item: job }: { item: Job }) => {
    const isExpanded = expandedJobId === job._id;
    const iconName =
      (CATEGORY_ICONS[job.category] as any) || CATEGORY_ICONS.default;
    const budgetText = job.isNegotiable
      ? "Negotiable"
      : `₹${job.budgetMin} – ₹${job.budgetMax}`;

    return (
      <View style={styles.card}>
        {/* ── Purple header ─────────────────────────────────────────────── */}
        <View style={styles.cardHeader}>
          <Ionicons
            name={iconName}
            size={17}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.cardHeaderText} numberOfLines={2}>
            Posted by: {job.postedBy?.name}
            {"   "}|{"   "}
            Category: {job.category}
          </Text>
        </View>

        {/* ── Cream body ────────────────────────────────────────────────── */}
        <View style={styles.cardBody}>
          {/* EXPANDED STATE: rating + description (Figure 9) */}
          {isExpanded && (
            <View style={styles.expandedSection}>
              {/* Star rating */}
              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>User Rating: </Text>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={
                      job.rating >= star
                        ? "star"
                        : job.rating >= star - 0.5
                          ? "star-half"
                          : "star-outline"
                    }
                    size={15}
                    color="#FFC107"
                  />
                ))}
                <Text style={styles.ratingScore}> ({job.rating}/5)</Text>
              </View>

              {/* Description */}
              <Text style={styles.descText}>{job.description}</Text>

              <View style={styles.divider} />
            </View>
          )}

          {/* Budget */}
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>Budget: </Text>
            {budgetText}
            {"     "}
            <Text style={styles.infoLabel}>Time Schedule: </Text>
            {job.schedule}
          </Text>

          {/* Address */}
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>Address: </Text>
            {job.address}
          </Text>

          {/* ── Action buttons (role-based) ───────────────────────────── */}
          <View style={styles.buttonRow}>
            {/* Apply Now — workers only */}
            {isWorker && (
              // <TouchableOpacity
              //   style={styles.btnApply}
              //   onPress={() => handleApply(job._id)}
              //   activeOpacity={0.85}
              // >
              //   <Text style={styles.btnText}>Apply Now</Text>
              // </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.btnApply,
                  appliedJobs.includes(job._id) && styles.btnApplied,
                ]}
                onPress={async () => {
                  if (appliedJobs.includes(job._id)) {
                    const updated = appliedJobs.filter((id) => id !== job._id);

                    setAppliedJobs(updated);

                    await AsyncStorage.setItem(
                      "appliedJobs",
                      JSON.stringify(updated),
                    );

                    Alert.alert("Cancelled", "Application removed");
                    return;
                  }

                  setApplyJobId(job._id);
                  setApplyModal(true);
                }}
              >
                <Text style={styles.btnText}>
                  {appliedJobs.includes(job._id) ? "Applied" : "Apply Now"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Refer — everyone */}
            <TouchableOpacity
              style={styles.btnRefer}
              onPress={() => {
                setReferJobId(job._id);
                setReferModal(true);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>Refer</Text>
            </TouchableOpacity>

            {/* View / Close — everyone */}
            <TouchableOpacity
              style={[styles.btnView, isExpanded && styles.btnViewActive]}
              onPress={() => setExpandedJobId(isExpanded ? null : job._id)}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>
                {isExpanded ? "Close" : "View"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PURPLE} />
        <Text style={styles.loadingText}>Loading live jobs…</Text>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* ── Top header ────────────────────────────────────────────────── */}
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Jobs</Text>
        <TouchableOpacity
          onPress={() => {
            setLoading(true);
            fetchJobs();
          }}
        >
          <Ionicons name="refresh-outline" size={22} color={PURPLE} />
        </TouchableOpacity>
      </View> */}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Jobs</Text>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => {
            setLoading(true);
            fetchJobs();
          }}
        >
          <Ionicons name="refresh-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Filter bar (3 pills) ───────────────────────────────────────── */}
      <View style={styles.filterBar}>
        {renderFilterPill("Category", "category", CATEGORIES, filters.category)}
        {renderFilterPill("Pay", "pay", PAY_RANGES, filters.pay)}
        {renderFilterPill("Schedule", "schedule", SCHEDULES, filters.schedule)}
      </View>

      {/* ── Job list ──────────────────────────────────────────────────── */}
      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item._id}
        renderItem={renderJobCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        // Pull-to-refresh
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchJobs();
            }}
            colors={[PURPLE]}
            tintColor={PURPLE}
          />
        }
        // Empty state
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={52} color="#BDBDBD" />
            <Text style={styles.emptyText}>No jobs match your filters</Text>
            <TouchableOpacity
              onPress={() =>
                setFilters({ category: "All", pay: "All", schedule: "Any" })
              }
            >
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* ── Refer a Worker — bottom sheet modal (Figure 10) ───────────── */}
      <Modal
        visible={referModal}
        animationType="slide"
        transparent
        onRequestClose={closeReferModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>Refer a Worker</Text>
              <TouchableOpacity onPress={closeReferModal}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Modal body */}
            <ScrollView
              style={styles.modalBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.inputLabel}>Worker's Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter name"
                value={referName}
                onChangeText={setReferName}
                placeholderTextColor="#BDBDBD"
              />

              <Text style={styles.inputLabel}>Worker's Phone Number</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter 10-digit number"
                keyboardType="numeric"
                maxLength={10}
                value={referPhone}
                onChangeText={setReferPhone}
                placeholderTextColor="#BDBDBD"
              />

              <Text style={styles.inputLabel}>Description / Skills</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Describe worker's skills and experience"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={referSkills}
                onChangeText={setReferSkills}
                placeholderTextColor="#BDBDBD"
              />

              <TouchableOpacity
                style={[styles.submitBtn, referLoading && { opacity: 0.7 }]}
                onPress={handleReferSubmit}
                disabled={referLoading}
                activeOpacity={0.85}
              >
                {referLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Referral</Text>
                )}
              </TouchableOpacity>

              {/* Extra bottom padding so content isn't hidden by keyboard */}
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={applyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setApplyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>Apply for Job</Text>

              <TouchableOpacity onPress={() => setApplyModal(false)}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Expected Pay */}
              <Text style={styles.inputLabel}>Expected Pay</Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Enter expected pay"
                value={expectedPay}
                onChangeText={setExpectedPay}
                keyboardType="numeric"
              />

              {/* Preferred Time */}
              <Text style={styles.inputLabel}>Preferred Time</Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Enter your preferred schedule"
                value={preferredTime}
                maxLength={50}
                onChangeText={setPreferredTime}
              />

              {/* Remarks */}
              <Text style={styles.inputLabel}>Other Remarks (optional)</Text>

              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder=""
                value={remarks}
                maxLength={100}
                multiline
                onChangeText={setRemarks}
              />

              {/* Submit */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={async () => {
                  if (!applyJobId) return;

                  // ✅ validation
                  if (!expectedPay.trim()) {
                    Alert.alert("Error", "Expected pay is required");
                    return;
                  }

                  if (!preferredTime.trim()) {
                    Alert.alert("Error", "Preferred time is required");
                    return;
                  }

                  // ✅ already applied → cancel
                  if (appliedJobs.includes(applyJobId)) {
                    const updated = appliedJobs.filter(
                      (id) => id !== applyJobId,
                    );

                    setAppliedJobs(updated);

                    await AsyncStorage.setItem(
                      "appliedJobs",
                      JSON.stringify(updated),
                    );

                    setApplyModal(false);

                    Alert.alert("Cancelled", "Application removed");

                    return;
                  }

                  // ✅ apply
                  try {
                    const res = await fetch(`${BASE_URL}/applications/apply`, {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        jobId: applyJobId,
                        expectedPay: Number(expectedPay),
                        preferredTime,
                        remarks,
                      }),
                    });

                    const data = await res.json();

                    if (res.ok) {
                      const updated = [...appliedJobs, applyJobId!];
                      setAppliedJobs(updated);

                      await AsyncStorage.setItem(
                        "appliedJobs",
                        JSON.stringify(updated),
                      );

                      setApplyModal(false);

                      Alert.alert(
                        "✅ Applied",
                        "Application submitted successfully",
                      );
                    } else {
                      Alert.alert("Error", data.message || "Failed to apply");
                    }
                  } catch (err) {
                    console.log(err);
                    Alert.alert("Error", "Something went wrong");
                  }
                }}
              >
                <Text style={styles.submitBtnText}>Submit Application</Text>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Layout ─────────────────────────────────────────────────────────────────
  container: { flex: 1, backgroundColor: "#f5f3ff" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f3ff",
  },
  loadingText: { color: "#2196F3", marginTop: 12, fontSize: 15 },
  listContent: { padding: 12, paddingBottom: 30 },

  //── Header ─────────────────────────────────────────────────────────────────
  // header: {
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  //   alignItems: "center",
  //   paddingHorizontal: 16,
  //   paddingTop: 10,
  //   paddingBottom: 8,
  //   backgroundColor: "#f5f3ff",
  // },
  // headerTitle: {
  //   fontSize: 22,
  //   fontWeight: "bold",
  //   color: "#2196F3",
  // },

  header: {
    backgroundColor: "#2196F3",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  refreshBtn: {
    position: "absolute",
    right: 16,
    top: 14,
  },

  // ── Filter bar ─────────────────────────────────────────────────────────────
  // filterBar: {
  //   flexDirection: "row",
  //   paddingHorizontal: 12,
  //   paddingBottom: 10,
  //   backgroundColor: "#f5f3ff",
  //   gap: 8,
  //   zIndex: 100,
  // },

  filterBar: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: "#f5f3ff",
    gap: 8,
    zIndex: 100,

    marginTop: 6, // ✅ add this
  },
  filterPillWrapper: {
    flex: 1,
    zIndex: 100,
    position: "relative",
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#2196F3",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#ffffff",
  },
  filterPillActive: {
    backgroundColor: "#ede9ff",
  },
  filterPillText: {
    fontSize: 11,
    color: "#2196F3",
    fontWeight: "600",
    flexShrink: 1,
  },

  // ── Dropdown ───────────────────────────────────────────────────────────────
  dropdownMenu: {
    position: "absolute",
    top: 36,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E1BEE7",
    elevation: 10,
    zIndex: 999,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownItemActive: {
    backgroundColor: "#ede9ff",
  },
  dropdownItemText: {
    fontSize: 13,
    color: "#1a1a1a",
  },
  dropdownItemTextActive: {
    color: "#2196F3",
    fontWeight: "700",
  },

  // ── Job card ───────────────────────────────────────────────────────────────
  card: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.09,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    backgroundColor: "#2196F3",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  cardHeaderText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    lineHeight: 19,
  },
  cardBody: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoText: {
    fontSize: 13,
    color: "#1a1a1a",
    marginBottom: 5,
    lineHeight: 19,
  },
  infoLabel: {
    fontWeight: "700",
  },

  // ── Expanded view section ──────────────────────────────────────────────────
  expandedSection: {
    marginBottom: 10,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a1a1a",
    marginRight: 4,
  },
  ratingScore: {
    fontSize: 13,
    color: "#1a1a1a",
  },
  descText: {
    fontSize: 13,
    color: "#666666",
    lineHeight: 20,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#D0D0D0",
    marginBottom: 10,
  },

  // ── Action buttons ─────────────────────────────────────────────────────────
  buttonRow: {
    flexDirection: "row",
    marginTop: 10,
    flexWrap: "wrap",
    gap: 8,
  },
  btnApply: {
    backgroundColor: "#2196F3",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 2,
  },
  btnRefer: {
    backgroundColor: "#2196F3",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    opacity: 0.88,
  },
  btnView: {
    backgroundColor: "#2196F3",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    opacity: 0.88,
  },
  btnViewActive: {
    backgroundColor: "#2196F3",
    opacity: 1,
  },
  btnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },

  btnApplied: {
    backgroundColor: "#4CAF50",
  },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: "center",
    marginTop: 70,
    paddingHorizontal: 24,
  },
  emptyText: {
    color: "#9E9E9E",
    fontSize: 15,
    marginTop: 14,
    textAlign: "center",
  },
  clearFiltersText: {
    color: "#2196F3",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
    textDecorationLine: "underline",
  },

  // ── Refer modal ────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FAFAFA",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "82%",
    overflow: "hidden",
  },
  modalHeader: {
    backgroundColor: "#2196F3",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  modalHeaderText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 14,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: "#FFFDE7",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2196F3",
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#1a1a1a",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 22,
    elevation: 3,
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
});
