import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Base_Url , API_BASE} from "../constants/Config";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  KColors as Colors,
  Radius,
  Shadow,
  Spacing,
} from "../constants/kaamsetuTheme";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
const BASE_URL = Base_Url;

// Avatar Component
function Avatar({ name, size = 80 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.35 }]}>
        {initials}
      </Text>
      <View style={styles.avatarEditBadge}>
        <Text style={{ fontSize: 10 }}>✏️</Text>
      </View>
    </View>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: any;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && { height: 80, textAlignVertical: "top" },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

// MAIN SCREEN
export default function UpdateProfileScreen() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [workerTags, setWorkerTags] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Load user from AsyncStorage
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem("user");

      if (storedUser) {
        const parsed = JSON.parse(storedUser);

        setUser(parsed);
        setName(parsed.name || "");
        setEmail(parsed.email || "");
        setPhone(parsed.phone || "");
        setAddress(parsed.address || "");
        setWorkerTags(parsed.skills || "");
        setProfileImage(parsed.profileImage || null);
      }
    };

    loadUser();
  }, []);

  // Save changes
  const handleSave = async () => {
    try {
      console.log("CLICKED");
      console.log("IMAGE:", image);

      const storedUser = await AsyncStorage.getItem("user");
      const parsedUser = JSON.parse(storedUser!);

      const formData = new FormData();

      formData.append("id", parsedUser._id);
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("address", address);
      formData.append("skills", workerTags);

      if (image) {
        const filename = image.split("/").pop();
        const match = /\.(\w+)$/.exec(filename || "");
        const type = match ? `image/${match[1]}` : `image`;

        formData.append("profileImage", {
          uri: Platform.OS === "android" ? image : image.replace("file://", ""),
          name: filename,
          type: type,
        } as any);
      }

      const res = await fetch(
        `${API_BASE}/auth/update-profile`,
        {
          method: "PUT",
          body: formData,
        },
      );

      const data = await res.json();

      console.log("RESPONSE:", data);

      if (!res.ok) {
        Alert.alert("Error", data.message);
        return;
      }

      // Update local storage
      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      Alert.alert("Success", "Profile updated!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Server error");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar */}
          {/* Avatar */}
          <View style={styles.avatarSection}>
            {image ? (
              <Image
                source={{ uri: image }}
                style={{ width: 90, height: 90, borderRadius: 45 }}
              />
            ) : profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={{ width: 90, height: 90, borderRadius: 45 }}
              />
            ) : (
              <Avatar name={name} size={90} />
            )}

            <TouchableOpacity style={styles.changePhotoBtn} onPress={pickImage}>
              <Text>Change Photo</Text>
            </TouchableOpacity>
          </View>
          {/* Form Card */}
          <View style={styles.formCard}>
            <InputField
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
            />
            <InputField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
            />
            <InputField
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 XXXXXXXXXX"
              keyboardType="phone-pad"
            />
            <InputField
              label="Address"
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your address"
            />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Worker Tags (comma separated)
              </Text>
              <TextInput
                style={styles.input}
                value={workerTags}
                onChangeText={setWorkerTags}
                placeholder="Plumber, Cook, etc."
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.tagHint}>
                Adding worker tags makes you eligible to apply for jobs.
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  backText: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 32,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "700",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md },

  avatarSection: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: 12,
  },
  avatar: {
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: Colors.white, fontWeight: "700" },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.white,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  changePhotoBtn: {
    backgroundColor: Colors.primaryPale,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  changePhotoText: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },

  formCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.sm,
    gap: 16,
    marginBottom: 20,
  },
  inputGroup: { gap: 6 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.offWhite,
  },
  tagHint: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: "italic",
  },

  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 14,
    alignItems: "center",
    ...Shadow.md,
  },
  saveBtnText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
});
