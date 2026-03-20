import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="forgot" options={{ headerShown: false }} />
      <Stack.Screen name="otp" options={{ headerShown: false }} />
      <Stack.Screen name="resetpassword" options={{ headerShown: false }} />
      <Stack.Screen name="setpassword" options={{ headerShown: false }} />
      <Stack.Screen name="update-profile" options={{ headerShown: false }} />
      <Stack.Screen name="applicants-list" options={{ headerShown: false }} />
      <Stack.Screen name="worker-profile" options={{ headerShown: false }} />
      <Stack.Screen name="job-chat" options={{ headerShown: false }} />
      <Stack.Screen name="job-status" options={{ headerShown: false }} />
      <Stack.Screen name="referrals" options={{ headerShown: false }} />
      <Stack.Screen name="applications" options={{ headerShown: false }} />
    </Stack>
  );
}
