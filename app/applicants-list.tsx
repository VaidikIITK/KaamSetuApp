import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { KColors as  Colors, Spacing, Radius, Shadow } from '../constants/kaamsetuTheme';
import { applicantsForJob, myRequests, Applicant } from '../constants/mockData';

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.33 }}>{initials}</Text>
    </View>
  );
}

type SortMode = 'rating' | 'location' | 'pay';

export default function ApplicantsScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const [sort, setSort] = useState<SortMode>('rating');

  const job = myRequests.find((j) => j.jobID === jobId);
  const rawApplicants = applicantsForJob[jobId ?? ''] ?? [];

  const applicants = [...rawApplicants].sort((a, b) => {
    if (sort === 'rating') return b.rating - a.rating;
    if (sort === 'pay') return a.expectedPay - b.expectedPay;
    return a.location.localeCompare(b.location);
  });

  const renderItem = ({ item }: { item: Applicant }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/worker-profile?workerId=${item.workerID}&jobId=${jobId}`)}
      activeOpacity={0.85}
    >
      <Avatar name={item.name} />
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.workerName}>{item.name}</Text>
          <View style={styles.ratingPill}>
            <Text style={styles.ratingPillStar}>★</Text>
            <Text style={styles.ratingPillText}>{item.rating}</Text>
          </View>
        </View>
        <Text style={styles.workerTag}>{item.workTag}</Text>
        <Text style={styles.workerMeta}>📍 {item.location}</Text>
        <Text style={styles.workerMeta}>💰 Expected: ₹{item.expectedPay}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Applicants for "{job?.jobType}"
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.filterBar}>
        {(['rating', 'location', 'pay'] as SortMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.filterChip, sort === mode && styles.filterChipActive]}
            onPress={() => setSort(mode)}
          >
            <Text style={[styles.filterChipText, sort === mode && styles.filterChipTextActive]}>
              {mode === 'rating' ? '⭐ Rating' : mode === 'location' ? '📍 Nearest' : '💰 Pay'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.countText}>{applicants.length} applicants</Text>

      <FlatList
        data={applicants}
        keyExtractor={(item) => item.workerID}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No applicants yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
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
  headerTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 4,
  },
  filterBar: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderColor: Colors.divider,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    alignItems: 'center',
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  filterChipTextActive: { color: Colors.white },
  countText: {
    fontSize: 13,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
    paddingBottom: 4,
  },
  list: { padding: Spacing.md, paddingTop: 8 },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.sm,
  },
  avatar: {
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { flex: 1, gap: 3 },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workerName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 2,
  },
  ratingPillStar: { color: Colors.starGold, fontSize: 12 },
  ratingPillText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  workerTag: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  workerMeta: { fontSize: 12, color: Colors.textSecondary },
  arrow: { fontSize: 24, color: Colors.primaryLight, fontWeight: '300' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
});
