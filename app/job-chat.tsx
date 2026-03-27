import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

const API_URL = "http://172.27.16.252:8030";

type RawSender =
  | string
  | {
      _id?: string;
      id?: string;
    }
  | null
  | undefined;

type RawChatMessage = {
  _id?: string;
  id?: string;
  senderId?: RawSender;
  content?: string;
  readStatus?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type ChatMessage = {
  _id: string;
  senderId: string;
  content: string;
  readStatus: boolean;
  createdAt: string;
  updatedAt?: string;
};

const getIdValue = (value: RawSender) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return value._id || value.id || "";
  return "";
};

const normalizeMessage = (msg: RawChatMessage, index: number): ChatMessage => {
  return {
    _id:
      msg._id ||
      msg.id ||
      `${getIdValue(msg.senderId)}-${msg.createdAt || "no-date"}-${index}`,
    senderId: getIdValue(msg.senderId),
    content: msg.content || "",
    readStatus: Boolean(msg.readStatus),
    createdAt: msg.createdAt || new Date().toISOString(),
    updatedAt: msg.updatedAt,
  };
};

export default function JobChatScreen() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [myUserId, setMyUserId] = useState("");

  const loadMyUserId = async () => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return "";

      const parsedUser = JSON.parse(userString);
      const userId = parsedUser?._id || parsedUser?.id || "";
      setMyUserId(userId);
      return userId;
    } catch (error) {
      console.log("User parse error:", error);
      return "";
    }
  };

  const fetchMessages = async (showError = true) => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!myUserId) {
        await loadMyUserId();
      }

      if (!token || !chatId) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/chat/${chatId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        if (showError) {
          Alert.alert("Error", data.message || "Failed to fetch messages");
        }
        setLoading(false);
        return;
      }

      const rawMessages = Array.isArray(data?.chat?.messages)
        ? data.chat.messages
        : [];

      const normalizedMessages = rawMessages
        .map((msg: RawChatMessage, index: number) => normalizeMessage(msg, index))
        .sort(
          (a: ChatMessage, b: ChatMessage) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

      setMessages(normalizedMessages);
    } catch (error) {
      console.log("Fetch messages error:", error);
      if (showError) {
        Alert.alert("Error", "Failed to load messages");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyUserId();
  }, []);

  useEffect(() => {
    if (!chatId) {
      setLoading(false);
      return;
    }

    fetchMessages(false);

    const interval = setInterval(() => {
      fetchMessages(false);
    }, 2500);

    return () => clearInterval(interval);
  }, [chatId, myUserId]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    try {
      setSending(true);

      const token = await AsyncStorage.getItem("token");

      if (!token || !chatId) {
        Alert.alert("Error", "Missing token or chatId");
        return;
      }

      const res = await fetch(`${API_URL}/api/chat/${chatId}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: trimmed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.message || "Failed to send message");
        return;
      }

      setInput("");
      await fetchMessages(false);
    } catch (error) {
      console.log("Send message error:", error);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setSending(false);
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

          <Text style={isMine ? styles.myTimeText : styles.otherTimeText}>
            {new Date(item.createdAt).toLocaleTimeString("en-IN", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  const emptyState = useMemo(() => {
    if (loading) return null;
    if (messages.length > 0) return null;
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>No messages yet.</Text>
      </View>
    );
  }, [loading, messages.length]);

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
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
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
            ListEmptyComponent={emptyState}
          />
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textMuted}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={sending}
          >
            <Text style={styles.sendBtnText}>
              {sending ? "Sending..." : "Send"}
            </Text>
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

  backBtn: {
    width: 36,
    justifyContent: "center",
  },

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

  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  listContent: {
    padding: Spacing.md,
    gap: 10,
    flexGrow: 1,
  },

  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },

  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
  },

  messageRow: {
    width: "100%",
  },

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

  myTimeText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    marginTop: 6,
    alignSelf: "flex-end",
  },

  otherTimeText: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 6,
    alignSelf: "flex-end",
  },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
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
    maxHeight: 110,
  },

  sendBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },

  sendBtnDisabled: {
    opacity: 0.7,
  },

  sendBtnText: {
    color: Colors.white,
    fontWeight: "700",
  },
});