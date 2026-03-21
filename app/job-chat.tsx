import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
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
import {
    ChatMessage,
    chatMessages,
    workerProfiles,
} from "../constants/mockData";

export default function JobChatScreen() {
  // Using query params instead of dynamic segment to avoid filename clash
  const { workerId, jobId } = useLocalSearchParams<{
    workerId: string;
    jobId: string;
  }>();
  const router = useRouter();
  const worker = workerProfiles[workerId ?? ""];
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(chatMessages);
  const [input, setInput] = useState("");

  const workerName = worker?.name ?? "Worker";
  const initials = workerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg: ChatMessage = {
      messageID: `m${Date.now()}`,
      senderID: "u001",
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isMe: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.msgWrapper,
        item.isMe ? styles.msgWrapperRight : styles.msgWrapperLeft,
      ]}
    >
      {!item.isMe && (
        <View style={styles.msgAvatar}>
          <Text style={styles.msgAvatarText}>{initials}</Text>
        </View>
      )}
      <View
        style={[styles.bubble, item.isMe ? styles.bubbleMe : styles.bubbleThem]}
      >
        <Text style={[styles.bubbleText, item.isMe && styles.bubbleTextMe]}>
          {item.content}
        </Text>
        <Text
          style={[
            styles.bubbleTime,
            item.isMe && { color: "rgba(255,255,255,0.7)" },
          ]}
        >
          {item.timestamp}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{workerName}</Text>
            <Text style={styles.headerSub}>{worker?.workTag ?? ""}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => router.push(`/worker-profile?workerId=${workerId}`)}
        >
          <Text style={styles.profileBtnText}>Profile</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.chatNotice}>
          <Text style={styles.chatNoticeText}>
            💬 Temporary chat — messages cleared once job is accepted.
          </Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.messageID}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textMuted}
            multiline
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim()}
          >
            <Text style={styles.sendBtnText}>›</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: 10,
  },
  backBtn: { width: 30, justifyContent: "center" },
  backText: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 32,
  },
  headerInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerAvatarText: { color: Colors.white, fontWeight: "700", fontSize: 14 },
  headerName: { color: Colors.white, fontWeight: "700", fontSize: 16 },
  headerSub: { color: "rgba(255,255,255,0.75)", fontSize: 12 },
  profileBtn: {
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  profileBtnText: { color: Colors.white, fontSize: 12, fontWeight: "600" },
  chatNotice: {
    backgroundColor: Colors.primaryPale,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: Colors.divider,
  },
  chatNoticeText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "center",
    fontStyle: "italic",
  },
  messagesList: { padding: Spacing.md, paddingBottom: 16 },
  msgWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 8,
  },
  msgWrapperRight: { justifyContent: "flex-end" },
  msgWrapperLeft: { justifyContent: "flex-start" },
  msgAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  msgAvatarText: { color: Colors.white, fontWeight: "700", fontSize: 11 },
  bubble: {
    maxWidth: "72%",
    borderRadius: Radius.md,
    padding: 10,
    paddingHorizontal: 14,
    gap: 4,
  },
  bubbleMe: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.sm,
  },
  bubbleText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  bubbleTextMe: { color: Colors.white },
  bubbleTime: { fontSize: 10, color: Colors.textMuted, alignSelf: "flex-end" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: Spacing.md,
    gap: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderColor: Colors.divider,
  },
  textInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    maxHeight: 100,
    backgroundColor: Colors.offWhite,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: Colors.textMuted },
  sendBtnText: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 28,
  },
});
