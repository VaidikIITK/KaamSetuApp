import { Tabs } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { KColors as Colors } from "../../constants/kaamsetuTheme";
// ─────────────────────────────────────────────────────────────────────────────
// TABS LAYOUT — place this file at:  app/(tabs)/_layout.tsx
//
// This defines the bottom tab bar with 3 tabs:
//   Account | Post New Job | Live Jobs
// ─────────────────────────────────────────────────────────────────────────────

function TabIcon({
  label,
  emoji,
  focused,
}: {
  label: string;
  emoji: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,

      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Live Jobs" emoji="📡" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="post-job"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Post Job" emoji="＋" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Account" emoji="👤" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    height: 70,
    paddingBottom: 8,
    paddingTop: 9,
  },
  tabIcon: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 70,
  },
  tabIconFocused: {
    backgroundColor: Colors.primaryPale,
  },
  tabEmoji: { fontSize: 20 },
  tabLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  tabLabelFocused: {
    color: Colors.primary,
    fontWeight: "700",
  },
});

