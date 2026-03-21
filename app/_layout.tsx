import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// This is the ROOT layout. It wraps every screen in the app.
//
// HOW AUTH REDIRECT WORKS:
//   1. We check if user is "logged in" (currently mocked as true).
//   2. If NOT logged in → redirect to /login
//   3. If logged in → redirect to /(tabs) (the main tab bar)
//
// When you connect a real backend, replace `isLoggedIn` with a check
// against your auth state (e.g. AsyncStorage token, Zustand store, etc.)
// ─────────────────────────────────────────────────────────────────────────────

// MOCK (later replace with real auth)
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";

function AuthGuard() {
  const segments = useSegments();
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem("token");

      setIsLoggedIn(Boolean(token));
    };

    checkLogin();
  }, [segments]);

  useEffect(() => {
    if (isLoggedIn === null) return; // ⛔ wait

    const inAuthGroup = segments[0] === "(auth)";

    if (!isLoggedIn && !inAuthGroup) {
      router.replace("/(auth)/login");
    }

    if (isLoggedIn && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isLoggedIn, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <>
      <AuthGuard />

      <Stack screenOptions={{ headerShown: false }}>
        {/* Auth screens */}
        <Stack.Screen name="(auth)" />

        {/* Main app */}
        <Stack.Screen name="(tabs)" />

        {/* Other screens */}
        <Stack.Screen name="update-profile" />
        <Stack.Screen name="applicants/[jobId]" />
        <Stack.Screen name="worker-profile/[workerId]" />
        <Stack.Screen name="chat/[workerId]" />
        <Stack.Screen name="view-status/[jobId]" />
        <Stack.Screen name="referrals" />
        <Stack.Screen name="applications" />
      </Stack>
    </>
  );
}
