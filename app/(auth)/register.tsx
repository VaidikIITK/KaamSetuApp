import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [timer, setTimer] = useState(0);

  // 🔥 TAG SYSTEM
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showList, setShowList] = useState(false);

  const inputs = useRef<Array<TextInput | null>>([]);
  const suggestions = [
    "Electrician",
    "Plumber",
    "Driver",
    "Carpenter",
    "Painter",
  ];

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagInput("");
    setShowList(false);
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

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

  // OTP
  const handleSendOTP = () => {
    if (!email.includes("@")) {
      setError("Enter valid email");
      return;
    }

    setError("");
    alert("OTP sent 📩");

    setTimer(30); // start timer

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRegister = () => {
    if (!name || !email || !password || !confirm || !phone) {
      setError("Fill all required fields");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    const finalOtp = otp.join("");
    if (!/^\d{4}$/.test(finalOtp)) {
      setError("Enter valid 4-digit OTP");
      return;
    }

    setError("");
    alert("Registered Successfully ✅");
    router.replace("/login");
  };

  return (
    <LinearGradient colors={["#6c4ef6", "#4a6cf7"]} style={styles.container}>
      <Text style={styles.logo}>KaamSetu</Text>
      <Text style={styles.subtitle}>Connecting Workers with Opportunities</Text>

      <View style={styles.card}>
        <Text style={styles.title}>Create Your Account</Text>

        {/* Name */}
        <Input
          icon="person-outline"
          placeholder="Full Name"
          value={name}
          onChange={setName}
        />

        {/* Email + OTP */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Input
              icon="mail-outline"
              placeholder="Email"
              value={email}
              onChange={setEmail}
            />
          </View>

          <TouchableOpacity style={styles.otpBtn} onPress={handleSendOTP}>
            <Text style={{ fontSize: 12 }}>Verify OTP</Text>
          </TouchableOpacity>
        </View>

        {/* resend OTP */}
        {timer > 0 ? (
          <Text style={{ textAlign: "center", marginTop: 5 }}>
            Resend OTP in {timer}s
          </Text>
        ) : (
          <TouchableOpacity onPress={handleSendOTP}>
            <Text
              style={{ textAlign: "center", color: "#4a6cf7", marginTop: 5 }}
            >
              Resend OTP
            </Text>
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
        <PasswordInput
          value={password}
          onChange={setPassword}
          show={showPassword}
          toggle={() => setShowPassword(!showPassword)}
          placeholder="Set Password"
        />

        {/* Confirm */}
        <PasswordInput
          value={confirm}
          onChange={setConfirm}
          show={showConfirm}
          toggle={() => setShowConfirm(!showConfirm)}
          placeholder="Confirm Password"
        />

        {/* Address */}
        <Input
          icon="location-outline"
          placeholder="Address (Optional)"
          value={address}
          onChange={setAddress}
        />

        {/* 🔥 MULTI TAG INPUT */}
        <Text style={styles.label}>Worker Tags</Text>

        {/* Default suggestions always visible */}
        <View style={styles.tagContainer}>
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.tag,
                selectedTags.includes(item) && { backgroundColor: "#4a6cf7" },
              ]}
              onPress={() => addTag(item)}
            >
              <Text style={{ color: "#fff" }}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Selected tags */}
        <View style={styles.tagContainer}>
          {selectedTags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={{ color: "#fff" }}>{tag}</Text>
              <Text style={styles.remove} onPress={() => removeTag(tag)}>
                {" "}
                ✕{" "}
              </Text>
            </View>
          ))}
        </View>

        {/* Custom input */}
        <View style={styles.inputContainer}>
          <Ionicons name="pricetag-outline" size={20} />
          <TextInput
            placeholder="Add your own skill"
            style={styles.input}
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={() => addTag(tagInput)}
          />
        </View>

        {/* Phone */}
        <Input
          icon="call-outline"
          placeholder="Phone Number"
          value={phone}
          onChange={setPhone}
        />

        {/* Error */}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Register */}
        <TouchableOpacity onPress={handleRegister}>
          <LinearGradient colors={["#6c4ef6", "#4a6cf7"]} style={styles.button}>
            <Text style={styles.buttonText}>Register</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footer}>
          By registering, you agree to Terms & Privacy Policy
        </Text>
      </View>
    </LinearGradient>
  );
}

/* 🔥 Reusable */

const Input = ({ icon, placeholder, value, onChange }: any) => (
  <View style={styles.inputContainer}>
    <Ionicons name={icon} size={20} />
    <TextInput
      placeholder={placeholder}
      style={styles.input}
      value={value}
      onChangeText={onChange}
    />
  </View>
);

const PasswordInput = ({ value, onChange, show, toggle, placeholder }: any) => (
  <View style={styles.inputContainer}>
    <Ionicons name="lock-closed-outline" size={20} />
    <TextInput
      placeholder={placeholder}
      secureTextEntry={!show}
      style={styles.input}
      value={value}
      onChangeText={onChange}
    />
    <Ionicons
      name={show ? "eye-outline" : "eye-off-outline"}
      size={20}
      onPress={toggle}
    />
  </View>
);

/* 🎨 Styles */

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
    marginBottom: 10,
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

  otpBtn: {
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

  footer: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 12,
  },

  label: {
    marginTop: 10,
    fontWeight: "bold",
  },

  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },

  tag: {
    flexDirection: "row",
    backgroundColor: "#6c4ef6",
    padding: 6,
    borderRadius: 10,
    marginRight: 5,
    marginTop: 5,
  },

  remove: {
    marginLeft: 5,
    color: "#fff",
  },

  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginTop: 5,
    maxHeight: 120,
  },

  dropdownItem: {
    padding: 10,
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
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
});
