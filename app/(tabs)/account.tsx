import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { KColors as Colors, Spacing, Radius, Shadow } from '../../constants/kaamsetuTheme';
import {
  currentUser,
  myRequests,
  completedJobHistory,
  applicantsForJob,
  workerProfiles,
} from '../../constants/mockData';

// ─── Reusable Components ────────────────────────────────────────────────────

function Avatar({ name, size = 72 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
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
      <Text style={[styles.avatarText, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={{ color: i <= Math.round(rating) ? Colors.starGold : '#DDD', fontSize: 14 }}>
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
    pending:     { label: 'Pending',       bg: Colors.warningLight,  color: Colors.warning },
    in_progress: { label: 'Work in Progress', bg: Colors.successLight, color: Colors.success },
    completed:   { label: 'Completed',     bg: '#E3F2FD',            color: '#1565C0' },
    cancelled:   { label: 'Cancelled',     bg: Colors.errorLight,    color: Colors.error },
  };
  const s = map[status] ?? map['pending'];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AccountScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Card ── */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <Avatar name={currentUser.name} size={72} />
            <View style={styles.profileInfo}>
              <View style={styles.profileNameRow}>
                <Text style={styles.profileName}>{currentUser.name}</Text>
                <TouchableOpacity
                  onPress={() => router.push('/update-profile')}
                  style={styles.editIcon}
                >
                  <Text style={styles.editIconText}>✏️</Text>
                </TouchableOpacity>
              </View>
              <StarRating rating={currentUser.rating} />
              {currentUser.workerTags.length > 0 && (
                <View style={styles.tagsRow}>
                  {currentUser.workerTags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.contactGrid}>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>{currentUser.email}</Text>
            </View>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={styles.contactValue}>{currentUser.phone}</Text>
            </View>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Address</Text>
              <Text style={styles.contactValue}>{currentUser.address}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.updateBtn}
            onPress={() => router.push('/update-profile')}
          >
            <Text style={styles.updateBtnText}>Update Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ── My Requests ── */}
        <SectionHeader title="My Requests (Current)" />
        {myRequests.map((job) => {
          const isInProgress = job.status === 'in_progress';
          return (
            <View key={job.jobID} style={styles.card}>
              <View style={styles.cardTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{job.jobType}</Text>
                  <Text style={styles.cardSubtitle}>{job.location}</Text>
                </View>
                <StatusBadge status={job.status} />
              </View>
              <Text style={styles.cardMeta}>
                ₹{job.budget.min} – ₹{job.budget.max} · {job.schedule.date}, {job.schedule.timeRange}
              </Text>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() =>
                  router.push(
                    isInProgress
                      ? `/view-status/${job.jobID}`
                      : `/applicants/${job.jobID}`
                  )
                }
              >
                <Text style={styles.secondaryBtnText}>
                  {isInProgress ? 'View Status' : 'View Applicants'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* ── My Applications / Referrals ── */}
        <SectionHeader title="My Applications" />
        <View style={styles.appLinksRow}>
          <TouchableOpacity
            style={styles.appLinkCard}
            onPress={() => router.push('/referrals')}
          >
            <Text style={styles.appLinkIcon}>🔗</Text>
            <Text style={styles.appLinkLabel}>Referrals</Text>
            <Text style={styles.appLinkArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.appLinkCard}
            onPress={() => router.push('/applications')}
          >
            <Text style={styles.appLinkIcon}>📋</Text>
            <Text style={styles.appLinkLabel}>Applications</Text>
            <Text style={styles.appLinkArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Completed Job History ── */}
        <SectionHeader title="Completed Job History" />
        {completedJobHistory.map((job) => (
          <View key={job.jobID} style={styles.historyCard}>
            <View style={styles.historyLeft}>
              <Text style={styles.historyTitle}>{job.jobType}</Text>
              <Text style={styles.historyMeta}>Date: {job.date}</Text>
              <Text style={styles.historyMeta}>Worker: {job.workerName}</Text>
            </View>
            <View style={styles.historyRight}>
              <Text style={styles.historyPay}>₹{job.agreedPay}</Text>
              <View style={[styles.badge, { backgroundColor: '#E3F2FD' }]}>
                <Text style={[styles.badgeText, { color: '#1565C0' }]}>{job.status}</Text>
              </View>
            </View>
          </View>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.md,
    gap: 12,
  },

  // Profile Card
  profileCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.md,
    marginBottom: 4,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  avatar: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontWeight: '700',
  },
  profileInfo: { flex: 1 },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  editIcon: {
    padding: 2,
  },
  editIconText: { fontSize: 16 },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.md,
  },
  contactGrid: { gap: 8, marginBottom: Spacing.md },
  contactItem: { flexDirection: 'row', gap: 8 },
  contactLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    width: 58,
  },
  contactValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    flex: 1,
  },
  updateBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 12,
    alignItems: 'center',
  },
  updateBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionAccent: {
    width: 4,
    height: 20,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Job Cards
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.sm,
    gap: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  cardMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // Badge
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Secondary Button
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 2,
  },
  secondaryBtnText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },

  // App Links
  appLinksRow: {
    flexDirection: 'row',
    gap: 12,
  },
  appLinkCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Shadow.sm,
  },
  appLinkIcon: { fontSize: 18 },
  appLinkLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  appLinkArrow: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '700',
  },

  // History Cards
  historyCard: {
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  historyLeft: { flex: 1 },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  historyMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  historyRight: { alignItems: 'flex-end', gap: 6 },
  historyPay: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
});
