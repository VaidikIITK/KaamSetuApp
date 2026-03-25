import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputs = useRef<Array<TextInput | null>>([]);

  const [timer, setTimer] = useState(0);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  // ✅ TIMER LOGIC
  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // ✅ SEND OTP
  const handleSendOTP = async () => {
    try {
      if (!email.includes("@")) {
        setError("Enter valid email");
        return;
      }

      const res = await fetch("http://172.27.16.252:8000/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        return;
      }

      setError("");
      alert("OTP sent 📩");

      setTimer(30);
    } catch (err) {
      console.log(err);
      setError("Error sending OTP");
    }
  };

  // OTP input
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

  // ✅ RESET PASSWORD
  const handleReset = async () => {
    console.log("RESET BUTTON CLICKED");
    try {
      const finalOtp = otp.join("");
      console.log("OTP:", finalOtp);
      console.log("Password:", password);
      console.log("Confirm:", confirm);
      if (otp.some((digit) => digit === "")) {
        setError("Fill all OTP boxes");
        return;
      }

      if (password !== confirm) {
        setError("Passwords do not match");
        return;
      }

      if (password.length < 4) {
        setError("Password must be at least 4 characters");
        return;
      }
      console.log("API CALL START");
      const res = await fetch(
        "http://172.27.16.252:8000/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            otp: finalOtp,
            newPassword: password,
          }),
        },
      );

      const data = await res.json();
      console.log("RESPONSE:", data);
      if (!res.ok) {
        setError(data.message);
        return;
      }

      setError("");
      alert("Password reset successful ✅");

      router.replace("/(auth)/login");
    } catch (err) {
      console.log(err);
      setError("Server error");
    }
  };

  return (
    <LinearGradient colors={["#6c4ef6", "#4a6cf7"]} style={styles.container}>
      <Text style={styles.logo}>KaamSetu</Text>
      <Text style={styles.subtitle}>Reset your password securely</Text>

      <View style={styles.card}>
        <Text style={styles.title}>Forgot Password</Text>

        {/* Email */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} />
              <TextInput
                placeholder="Enter your email"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.verifyBtn}
            onPress={handleSendOTP}
            disabled={timer > 0}
          >
            <Text style={{ fontSize: 12 }}>
              {timer > 0 ? `Wait ${timer}s` : "Verify"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Timer */}
        {timer > 0 ? (
          <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
        ) : (
          <TouchableOpacity onPress={handleSendOTP}>
            <Text style={styles.resendText}>Resend OTP</Text>
          </TouchableOpacity>
        )}

        {/* OTP */}
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

        {/* Password */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} />
          <TextInput
            placeholder="Set new password"
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

        {/* Confirm */}
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

        {/* Error */}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Button */}
        <TouchableOpacity onPress={handleReset}>
          <LinearGradient colors={["#6c4ef6", "#4a6cf7"]} style={styles.button}>
            <Text style={styles.buttonText}>Reset Password</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text
          style={styles.link}
          onPress={() => router.replace("/(auth)/login")}
        >
          Back to Login
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },

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
    borderRadius: 20,
  },

  title: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },

  input: {
    flex: 1,
    marginLeft: 10,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  verifyBtn: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: "#ddd",
    borderRadius: 8,
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

  error: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
  },

  link: {
    textAlign: "center",
    marginTop: 10,
    color: "#555",
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

  timerText: {
    textAlign: "center",
    marginTop: 5,
    color: "#555",
  },

  resendText: {
    textAlign: "center",
    marginTop: 5,
    color: "#4a6cf7",
  },

  label: {
    marginTop: 10,
    fontWeight: "bold",
  },
});
