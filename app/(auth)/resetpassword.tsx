import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Popup from "../../components/Popup";

export default function ResetPassword() {
  const { phone } = useLocalSearchParams();

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");

  const inputs = useRef<(TextInput | null)[]>([]);
  const [popup, setPopup] = useState("");

  // OTP change
  const handleChange = (value: string, index: number) => {
    let newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && index > 0 && !otp[index]) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = () => {
    const finalOtp = otp.join("");

    if (finalOtp.length !== 4) {
      setError("Enter valid OTP");
      return;
    }

    if (password.length < 4) {
      setError("Password too short");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setPopup("Password reset successful!");
    router.push("/login");
  };

  return (
    <LinearGradient colors={["#2196F3", "#4a6cf7"]} style={styles.container}>
      <Text style={styles.logo}>KaamSetu</Text>

      <Text style={styles.subtitle}>
        OTP sent to <Text style={{ fontWeight: "bold" }}>{phone}</Text>
      </Text>

      <View style={styles.card}>
        <Text style={styles.title}>Reset Password</Text>

        {/* 🔢 OTP BOXES */}
        <Text style={styles.label}>Enter OTP</Text>
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputs.current[index] = ref;
              }}
              style={styles.otpBox}
              keyboardType="numeric"
              maxLength={1}
              value={digit}
              onChangeText={(value) => handleChange(value, index)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, index)
              }
            />
          ))}
        </View>

        {/* 🔒 PASSWORD */}
        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} />
          <TextInput
            placeholder="Enter password"
            secureTextEntry={!showPassword}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
          <Ionicons
            name={showPassword ? "eye-outline" : "eye-off-outline"}
            size={20}
            onPress={() => setShowPassword(!showPassword)}
          />
        </View>

        {/* 🔒 CONFIRM */}
        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} />
          <TextInput
            placeholder="Confirm password"
            secureTextEntry={!showConfirm}
            style={styles.input}
            value={confirm}
            onChangeText={setConfirm}
          />
          <Ionicons
            name={showConfirm ? "eye-outline" : "eye-off-outline"}
            size={20}
            onPress={() => setShowConfirm(!showConfirm)}
          />
        </View>

        {/* ❌ ERROR */}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* 🔘 BUTTON */}
        <TouchableOpacity onPress={handleSubmit}>
          <LinearGradient colors={["#2196F3", "#4a6cf7"]} style={styles.button}>
            <Text style={styles.buttonText}>Submit</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.link} onPress={() => router.back()}>
          Back
        </Text>
      </View>
      <Popup
        message={popup}
        onClose={() => setPopup("")}
      />
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
    padding: 25,
    borderRadius: 20,
  },

  title: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 15,
    fontWeight: "bold",
  },

  label: {
    marginTop: 10,
    fontWeight: "bold",
  },

  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  otpBox: {
    width: 55,
    height: 55,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    textAlign: "center",
    fontSize: 18,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    padding: 10,
    borderRadius: 10,
    marginTop: 5,
  },

  input: {
    flex: 1,
    marginHorizontal: 10,
  },

  button: {
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
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
    marginTop: 10,
    textAlign: "center",
  },
});
