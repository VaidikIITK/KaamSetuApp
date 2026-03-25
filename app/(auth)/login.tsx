import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function HomeScreen() {
  // ✅ states
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ✅ login function
  const handleLogin = async () => {
    // ✅ validations
    if (!phone && !password) {
      setError("Please enter phone number and password");
      return;
    }

    if (!phone) {
      setError("Please enter phone number");
      return;
    }

    if (phone.length !== 10) {
      setError("Phone number must be exactly 10 digits");
      return;
    }

    if (!password) {
      setError("Please enter password");
      return;
    }

    if (password.length < 4) {
      setError("Password must be at least 4 characters long");
      return;
    }

    try {
      setError("");

      const res = await fetch("http://172.27.16.252:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          password,
        }),
      });

      const data = await res.json(); // ✅ pehle data lo

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      console.log("LOGIN SUCCESS:", data);

      // ✅ STEP 2A: token save
      await AsyncStorage.setItem("token", data.token);

      // ✅ STEP 2B: user save
      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      // ✅ STEP 2C: redirect
      router.replace("/(tabs)");
    } catch (err) {
      console.log(err);
      setError("Server error");
    }
  };

  return (
    <LinearGradient colors={["#6c4ef6", "#4a6cf7"]} style={styles.container}>
      <Text style={styles.logo}>KaamSetu</Text>
      <Text style={styles.subtitle}>Connecting Workers with Opportunities</Text>

      <View style={styles.card}>
        <Text style={styles.title}>Login to KaamSetu</Text>

        {/* 📞 Phone Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={20} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Enter phone number"
            keyboardType="numeric"
            style={{ flex: 1 }}
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {/* 🔒 Password Input */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            style={{ marginRight: 8 }}
          />

          <TextInput
            placeholder="Enter password"
            secureTextEntry={!showPassword}
            style={{ flex: 1 }}
            value={password}
            onChangeText={setPassword}
          />

          <Ionicons
            name={showPassword ? "eye-outline" : "eye-off-outline"}
            size={20}
            onPress={() => setShowPassword(!showPassword)}
          />
        </View>

        {/* ❌ Error */}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* 🔘 Login Button */}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        {/* Links */}
        <Text style={styles.link} onPress={() => router.push("/forgot")}>
          Forgot Password?
        </Text>

        <Text style={styles.link}>
          New here?{" "}
          <Text
            style={{ fontWeight: "bold" }}
            onPress={() => router.push("/register")}
          >
            Register now
          </Text>
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },

  logo: {
    fontSize: 34,
    fontWeight: "bold",
    textAlign: "center",
    color: "#fff",
  },

  subtitle: {
    textAlign: "center",
    marginBottom: 20,
    color: "#eee",
  },

  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    elevation: 5,
    marginTop: 20,
  },

  title: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  button: {
    backgroundColor: "#6c4ef6",
    padding: 14,
    borderRadius: 10,
    marginTop: 15,
    elevation: 3,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },

  link: {
    textAlign: "center",
    marginTop: 10,
    color: "#555",
  },

  error: {
    color: "red",
    marginTop: 5,
    textAlign: "center",
  },
});
