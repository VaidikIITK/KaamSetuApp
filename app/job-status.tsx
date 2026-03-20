import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { KColors as  Colors, Spacing, Radius, Shadow } from '../constants/kaamsetuTheme';
import { myRequests, workerProfiles } from '../constants/mockData';

function Avatar({ name, size = 70 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.32 }}>{initials}</Text>
    </View>
  );
}

function TabBar({ active, onSelect }: { active: 'status' | 'details'; onSelect: (t: 'status' | 'details') => void }) {
  return (
    <View style={styles.tabBar}>
      {(['status', 'details'] as const).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, active === tab && styles.tabActive]}
          onPress={() => onSelect(tab)}
        >
          <Text style={[styles.tabText, active === tab && styles.tabTextActive]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function StarRatingInput({ rating, onRate }: { rating: number; onRate: (r: number) => void }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity key={i} onPress={() => onRate(i)}>
          <Text style={[styles.star, i <= rating && styles.starActive]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function JobStatusScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'status' | 'details'>('status');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const job = myRequests.find((j) => j.jobID === jobId);
  const worker = job?.selectedWorkerID ? workerProfiles[job.selectedWorkerID] : null;

  if (!job) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}><Text>Job not found.</Text></View>
      </SafeAreaView>
    );
  }

  const handleSubmitRating = () => {
    if (rating === 0) { Alert.alert('Please select a rating first.'); return; }
    Alert.alert('Rating Submitted', `You rated ${worker?.name ?? 'worker'} ${rating} stars. Thank you!`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Status</Text>
        <View style={{ width: 36 }} />
      </View>

      <TabBar active={activeTab} onSelect={setActiveTab} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'status' ? (
          <>
            <View style={styles.statusBanner}>
              <Text style={styles.statusIcon}>🔄</Text>
              <Text style={styles.statusLabel}>WORK IN PROGRESS</Text>
            </View>

            {worker && (
              <View style={styles.workerCard}>
                <Avatar name={worker.name} size={80} />
                <Text style={styles.workerName}>{worker.name}</Text>
                <Text style={styles.workerTag}>{worker.workTag}</Text>
                <View style={styles.workerMeta}>
                  <Text style={styles.workerMetaText}>📍 {worker.location}</Text>
                  <Text style={styles.workerMetaText}>🏆 {worker.experience}+ yrs</Text>
                </View>
                <TouchableOpacity
                  style={styles.chatBtn}
                  onPress={() => router.push(`/job-chat?workerId=${worker.workerID}&jobId=${jobId}`)}
                >
                  <Text style={styles.chatBtnText}>💬 Chat</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.rateCard}>
              <TouchableOpacity style={styles.rateNowBtn} onPress={handleSubmitRating}>
                <Text style={styles.rateNowText}>RATE NOW</Text>
              </TouchableOpacity>
              <StarRatingInput rating={rating} onRate={setRating} />
              <TextInput
                style={styles.reviewInput}
                value={review}
                onChangeText={setReview}
                placeholder="Write a review..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>Job Details</Text>
              <View style={styles.detailsTable}>
                {[
                  ['Job Type', job.jobType],
                  ['Description', job.description],
                  ['Location', job.location],
                  ['Date Posted', job.datePosted],
                  ['Schedule', `${job.schedule.date}, ${job.schedule.timeRange}`],
                  ['Budget', `₹${job.budget.min} – ₹${job.budget.max}`],
                ].map(([label, value]) => (
                  <View key={label} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{label}</Text>
                    <Text style={styles.detailValue}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>

            {worker && (
              <View style={styles.selectedWorkerCard}>
                <Text style={styles.selectedWorkerTitle}>Selected Worker</Text>
                <View style={styles.selectedWorkerInner}>
                  <Avatar name={worker.name} size={60} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.workerName}>{worker.name}</Text>
                    <Text style={styles.workerTag}>{worker.workTag}</Text>
                    <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
                      ⭐ {worker.rating} · 📍 {worker.location}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.viewProfileBtn}
                  onPress={() => router.push(`/worker-profile?workerId=${worker.workerID}`)}
                >
                  <Text style={styles.viewProfileBtnText}>View Profile</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  backBtn: { width: 36, justifyContent: 'center' },
  backText: { color: Colors.white, fontSize: 28, fontWeight: '300', lineHeight: 32 },
  headerTitle: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderColor: Colors.divider,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },
  scrollContent: { padding: Spacing.md, gap: 16 },
  statusBanner: {
    backgroundColor: Colors.successLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  statusIcon: { fontSize: 22 },
  statusLabel: { fontSize: 18, fontWeight: '800', color: Colors.success, letterSpacing: 1 },
  workerCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.md,
  },
  avatar: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  workerName: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  workerTag: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  workerMeta: { flexDirection: 'row', gap: 16 },
  workerMetaText: { fontSize: 13, color: Colors.textSecondary },
  chatBtn: {
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.full,
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginTop: 4,
  },
  chatBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
  rateCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.sm,
  },
  rateNowBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  rateNowText: { color: Colors.white, fontWeight: '800', fontSize: 18, letterSpacing: 2 },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  star: { fontSize: 40, color: '#DDD' },
  starActive: { color: Colors.starGold },
  reviewInput: {
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 100,
    backgroundColor: Colors.offWhite,
  },
  detailsCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.sm,
  },
  detailsTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, marginBottom: 14 },
  detailsTable: { gap: 12 },
  detailRow: { flexDirection: 'row', gap: 12 },
  detailLabel: { width: 90, fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  detailValue: { flex: 1, fontSize: 13, color: Colors.textPrimary },
  selectedWorkerCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.sm,
    gap: 14,
  },
  selectedWorkerTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  selectedWorkerInner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  viewProfileBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewProfileBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});
