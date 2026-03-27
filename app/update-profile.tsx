// update-profile.tsx — with worker tags from register
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

const BASE_URL = "http://172.27.16.252:8030";

const SUGGESTIONS = [
  "Electrician",
  "Plumber",
  "Driver",
  "Carpenter",
  "Painter",
  "Cook",
  "Cleaner",
  "Mason",
];

// ─── Avatar ──────────────────────────────────────────────────────────────────
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

// ─── Simple text input row ────────────────────────────────────────────────────
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

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function UpdateProfileScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isWorker, setIsWorker] = useState(false);

  // Tag state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // ── Load user from AsyncStorage ──────────────────────────────────────────
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setName(parsed.name || "");
        setAddress(parsed.address || "");
        setProfileImage(parsed.profileImage || null);
        setIsWorker(parsed.role === "worker");

        // skills stored as comma-separated string OR array
        if (parsed.skills) {
          if (Array.isArray(parsed.skills)) {
            setSelectedTags(parsed.skills);
          } else if (typeof parsed.skills === "string" && parsed.skills.trim()) {
            setSelectedTags(
              parsed.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
            );
          }
        }
      }
    };
    loadUser();
  }, []);

  // ── Tag helpers ──────────────────────────────────────────────────────────
  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  // ── Photo picker ─────────────────────────────────────────────────────────
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      const parsedUser = JSON.parse(storedUser!);

      const formData = new FormData();
      formData.append("id", parsedUser._id);
      formData.append("name", name);
      formData.append("address", address);
      // Send as comma-separated string (matches register behaviour)
      formData.append("skills", selectedTags.join(","));

      if (image) {
        const filename = image.split("/").pop() || "photo.jpg";
        formData.append("profileImage", {
          uri: image,
          name: filename,
          type: "image/jpeg",
        } as any);
      }

      const res = await fetch(`${BASE_URL}/api/auth/update-profile`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.message);
        return;
      }

      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      Alert.alert("Success", "Profile updated!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Server error");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
              <Avatar name={name || "?"} size={90} />
            )}

            <TouchableOpacity style={styles.changePhotoBtn} onPress={pickImage}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Basic fields */}
          <View style={styles.formCard}>
            <InputField label="Full Name" value={name} onChangeText={setName} />
            <InputField
              label="Address"
              value={address}
              onChangeText={setAddress}
              placeholder="Your city / locality"
            />
          </View>

          {/* Worker Tags — only shown for workers */}
          {isWorker && (
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Worker Tags</Text>

              {/* Suggestion chips */}
              <View style={styles.tagContainer}>
                {SUGGESTIONS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.suggestionChip,
                      selectedTags.includes(item) && styles.chipSelected,
                    ]}
                    onPress={() =>
                      selectedTags.includes(item) ? removeTag(item) : addTag(item)
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedTags.includes(item) && styles.chipTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Selected tags (custom + suggestions) */}
              {selectedTags.length > 0 && (
                <>
                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>
                    Selected
                  </Text>
                  <View style={styles.tagContainer}>
                    {selectedTags.map((tag) => (
                      <View key={tag} style={styles.selectedTag}>
                        <Text style={styles.selectedTagText}>{tag}</Text>
                        <TouchableOpacity onPress={() => removeTag(tag)}>
                          <Ionicons
                            name="close-circle"
                            size={16}
                            color="#fff"
                            style={{ marginLeft: 4 }}
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Custom skill input */}
              <Text style={[styles.inputLabel, { marginTop: 12 }]}>
                Add Custom Skill
              </Text>
              <View style={styles.customTagRow}>
                <Ionicons
                  name="pricetag-outline"
                  size={18}
                  color={Colors.textMuted}
                />
                <TextInput
                  placeholder="Type a skill and press +"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.customTagInput}
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={() => addTag(tagInput)}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.addTagBtn}
                  onPress={() => addTag(tagInput)}
                  disabled={!tagInput.trim()}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color={tagInput.trim() ? Colors.primary : Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Save */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  header: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },

  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  backText: { color: "#fff", fontSize: 24 },

  scrollContent: { padding: 20, gap: 16 },

  avatarSection: { alignItems: "center", marginBottom: 4 },

  avatar: {
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: { color: "#fff", fontWeight: "bold" },

  changePhotoBtn: {
    backgroundColor: Colors.primaryPale,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: Radius.full,
    marginTop: 10,
  },
  changePhotoText: { color: Colors.primary, fontWeight: "600" },

  formCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },

  inputGroup: { gap: 4 },
  inputLabel: { fontWeight: "600", fontSize: 13, color: "#444" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    fontSize: 14,
  },

  // ── Tag styles ────────────────────────────────────────────────────────────
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },

  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: "#fff",
  },
  chipSelected: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "500",
  },
  chipTextSelected: {
    color: "#fff",
  },

  selectedTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  selectedTagText: { color: "#fff", fontSize: 13, fontWeight: "500" },

  customTagRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  customTagInput: { flex: 1, fontSize: 14 },
  addTagBtn: { padding: 2 },

  // ── Save button ───────────────────────────────────────────────────────────
  saveBtn: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  saveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});