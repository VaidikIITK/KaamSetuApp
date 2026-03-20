import { StyleSheet, Text, View } from "react-native";

export default function Home() {
  return (
    <View style={styles.container}>
      {/* 🔥 Test message */}
      <Text style={styles.title}>🚀 Ye main screen hai apne app ka</Text>

      <Text style={styles.subtitle}>
        (Agar ye dikh raha hai → login successful hai ✅)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#6c4ef6",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "gray",
  },
});
