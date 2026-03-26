import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
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

type ChatMessage = {
  _id: string;
  senderId: string;
  content: string;
  readStatus: boolean;
  createdAt: string;
  updatedAt?: string;
};

export default function JobChatScreen() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState("");

  const fetchMessages = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userString = await AsyncStorage.getItem("user");

      if (userString) {
        const parsedUser = JSON.parse(userString);
        setMyUserId(parsedUser._id);
      }

      if (!token || !chatId) {
        setLoading(false);
        return;
      }

      const res = await fetch(
        `http://172.23.17.67:8030/api/chat/${chatId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.message || "Failed to fetch messages");
        setLoading(false);
        return;
      }

      setMessages(data.chat?.messages || []);
    } catch (error) {
      console.log("Fetch messages error:", error);
      Alert.alert("Error", "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [chatId]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    try {
      const token = await AsyncStorage.getItem("token");

      if (!token || !chatId) {
        Alert.alert("Error", "Missing token or chatId");
        return;
      }

      const res = await fetch(
        `http://172.23.17.67:8030/api/chat/${chatId}/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: input.trim(),
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.message || "Failed to send message");
        return;
      }

      setMessages(data.messages || []);
      setInput("");
    } catch (error) {
      console.log("Send message error:", error);
      Alert.alert("Error", "Failed to send message");
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isMine = item.senderId === myUserId;

    return (
      <View
        style={[
          styles.messageRow,
          { justifyContent: isMine ? "flex-end" : "flex-start" },
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMine ? styles.myMessage : styles.otherMessage,
          ]}
        >
          <Text style={isMine ? styles.myMessageText : styles.otherMessageText}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Chat</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textMuted}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  backBtn: { width: 36, justifyContent: "center" },
  backText: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 32,
  },
  headerTitle: { color: Colors.white, fontSize: 18, fontWeight: "700" },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: Spacing.md, gap: 10 },
  messageRow: { width: "100%" },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.md,
    ...Shadow.sm,
  },
  myMessage: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: Colors.cardBg,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  myMessageText: {
    color: Colors.white,
    fontSize: 15,
  },
  otherMessageText: {
    color: Colors.textPrimary,
    fontSize: 15,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    backgroundColor: Colors.white,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  sendBtnText: {
    color: Colors.white,
    fontWeight: "700",
  },
});
