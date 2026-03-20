import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { KColors as Colors, Spacing, Radius, Shadow } from '../constants/kaamsetuTheme';
import { referrals, Referral } from '../constants/mockData';

function ReferralCard({ item }: { item: Referral }) {
  const initials = item.workerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
          <Text style={styles.tagText}>{item.workerTag}</Text>
        </View>
        <Text style={styles.phoneLine}>📞 {item.phone}</Text>
        <Text style={styles.referredFor}>
          <Text style={styles.referredLabel}>Referred for: </Text>
          {item.referredFor}
        </Text>
      </View>
    </View>
  );
}

export default function ReferralsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Referrals</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerText}>
          🔗 Workers you've referred (not registered on KaamSetu)
        </Text>
      </View>

      <FlatList
        data={referrals}
        keyExtractor={(item) => item.referralID}
        renderItem={({ item }) => <ReferralCard item={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔗</Text>
            <Text style={styles.emptyText}>No referrals yet.</Text>
            <Text style={styles.emptySubtext}>
              Refer a worker from the Live Jobs page to build your trusted network.
            </Text>
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
  headerTitle: { color: Colors.white, fontSize: 18, fontWeight: '700' },

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
    fontWeight: '500',
    textAlign: 'center',
  },

  list: { padding: Spacing.md },

  card: {
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.sm,
  },
  cardLeft: { justifyContent: 'flex-start', paddingTop: 4 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  cardBody: { flex: 1, gap: 5 },
  workerName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  tagPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  tagText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
  phoneLine: { fontSize: 13, color: Colors.textSecondary },
  referredFor: { fontSize: 12, color: Colors.textSecondary },
  referredLabel: { fontWeight: '700', color: Colors.textPrimary },

  empty: { padding: 60, alignItems: 'center', gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
