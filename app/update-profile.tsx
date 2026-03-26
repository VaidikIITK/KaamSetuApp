import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { KColors as Colors, Radius } from "../constants/kaamsetuTheme";

import AsyncStorage from "@react-native-async-storage/async-storage";

import * as ImagePicker from "expo-image-picker";

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
    </View>
  );
}

// Input Component
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

  // 🔥 Load user from AsyncStorage
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

  // 🔥 Save changes
  const handleSave = async () => {
    try {
      console.log("CLICKED"); // debug
      console.log("IMAGE:", image);

      const storedUser = await AsyncStorage.getItem("user");
      const parsedUser = JSON.parse(storedUser!);

      // 🔥 CREATE FORMDATA
      const formData = new FormData();

      formData.append("id", parsedUser._id);
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("address", address);
      formData.append("skills", workerTags);

      // 🔥 ADD IMAGE
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

      // 🔥 CALL BACKEND
      const res = await fetch(
        "http://172.23.17.67:8030/api/auth/update-profile",
        {
          method: "PUT",
          body: formData, // ❗ no headers
        },
      );

      const data = await res.json();

      console.log("RESPONSE:", data);

      if (!res.ok) {
        Alert.alert("Error", data.message);
        return;
      }

      // ✅ update local storage
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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            {image ? (
              // newly picked image
              <Image
                source={{ uri: image }}
                style={{ width: 90, height: 90, borderRadius: 45 }}
              />
            ) : profileImage ? (
              // existing image from database
              <Image
                source={{ uri: profileImage }}
                style={{ width: 90, height: 90, borderRadius: 45 }}
              />
            ) : (
              // no image at all - show initials
              <Avatar name={name} size={90} />
            )}

            {/* 👇 ADD THIS BELOW IMAGE */}
            <TouchableOpacity style={styles.changePhotoBtn} onPress={pickImage}>
              <Text>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <InputField label="Full Name" value={name} onChangeText={setName} />
            <InputField label="Email" value={email} onChangeText={setEmail} />
            <InputField label="Phone" value={phone} onChangeText={setPhone} />
            <InputField
              label="Address"
              value={address}
              onChangeText={setAddress}
            />

            <InputField
              label="Worker Tags"
              value={workerTags}
              onChangeText={setWorkerTags}
              placeholder="Plumber, Cook..."
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// STYLES
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  header: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  backText: {
    color: "#fff",
    fontSize: 24,
  },

  scrollContent: {
    padding: 20,
  },

  avatarSection: {
    alignItems: "center",
    marginBottom: 20,
  },

  avatar: {
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#fff",
    fontWeight: "bold",
  },

  formCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    gap: 10,
  },

  inputGroup: { gap: 5 },

  inputLabel: { fontWeight: "600" },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
  },

  saveBtn: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },

  saveBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  changePhotoBtn: {
    backgroundColor: Colors.primaryPale,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
});
