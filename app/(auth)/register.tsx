import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Base_Url , API_BASE} from "../../constants/Config";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Popup from "../../components/Popup";

export default function Register() {
  const [sendingOtp, setSendingOtp] = useState(false);
  const [isWorker, setIsWorker] = useState(false);
  const [role, setRole] = useState("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const parts = email.split("@");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [timer, setTimer] = useState(0);
  const [popup, setPopup] = useState("");

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

  useEffect(() => {
    let interval: any;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timer]);

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
  const handleSendOTP = async () => {
    try {
      if (parts.length !== 2 || !parts[1].includes(".")) {
        setError("Enter valid email with domain");
        return;
      }
      setSendingOtp(true); // 🔥 START LOADING
      const res = await fetch("${API_BASE}/auth/send-otp", {
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

      setPopup("OTP sent to email 📩");

      setTimer(30);
    } catch (err) {
      console.log(err);
      setError("Error sending OTP");
    } finally {
      setSendingOtp(false); // 🔥 STOP LOADING
    }
  };

  const handleRegister = async () => {
    try {
      if (!name || !email || !password || !confirm || !phone) {
        setError("Fill all required fields");
        return;
      }

      if (password !== confirm) {
        setError("Passwords do not match");
        return;
      }

      if (phone.length !== 10) {
        setError("Phone number must be exactly 10 digits");
        return;
      }

      const finalOtp = otp.join("");

      if (!/^\d{4}$/.test(finalOtp)) {
        setError("Enter valid OTP");
        return;
      }

      const res = await fetch("${API_BASE}/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          address,
          skills: isWorker ? selectedTags : [],
          role: isWorker ? "worker" : "user",
          otp: finalOtp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        return;
      }

      alert("Registered Successfully ✅");

      router.replace("/(auth)/login");
    } catch (err) {
      console.log(err);
      setError("Server error");
    }
  };

  return (
    <LinearGradient colors={["#2196F3", "#4a6cf7"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.logo}>KaamSetu</Text>
          <Text style={styles.subtitle}>
            Connecting Workers with Opportunities
          </Text>

          <View style={styles.card}>
            <Text style={styles.title}>Create Your Account</Text>

            {/* Name */}
            <Input
              icon="person-outline"
              placeholder="Full Name"
              value={name}
              onChange={setName}
            />

            {/* Worker Checkbox */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 10,
              }}
            >
              <TouchableOpacity
                onPress={() => setIsWorker(!isWorker)}
                style={{ marginRight: 10 }}
              >
                <Ionicons
                  name={isWorker ? "checkbox" : "square-outline"}
                  size={22}
                  color="#2196F3"
                />
              </TouchableOpacity>
              <Text>Register as a Worker</Text>
            </View>

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

              <TouchableOpacity
                style={[
                  styles.otpBtn,
                  (timer > 0 || sendingOtp) && { opacity: 0.6 },
                ]}
                onPress={handleSendOTP}
                disabled={timer > 0 || sendingOtp}
              >
                <Text style={{ fontSize: 12, color: "#fff", fontWeight: "600" }}>
                  {sendingOtp
                    ? "Sending..."
                    : timer > 0
                    ? "Send OTP"
                    : "Send OTP"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Resend OTP */}
            {timer > 0 ? (
              <Text style={{ textAlign: "center", marginTop: 5, color: "#2196F3" }}>
                Resend OTP in {timer}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleSendOTP}>
                <Text
                  style={{
                    textAlign: "center",
                    color: "#2196F3",
                    marginTop: 5,
                  }}
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

            {/* Worker Tags (only if worker) */}
            {isWorker && (
              <>
                <Text style={styles.label}>Worker Tags</Text>

                <View style={styles.tagContainer}>
                  {suggestions.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.tag,
                        selectedTags.includes(item) && {
                          backgroundColor: "#2196F3",
                        },
                      ]}
                      onPress={() => addTag(item)}
                    >
                      <Text style={{ color: "#fff" }}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.tagContainer}>
                  {selectedTags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={{ color: "#fff" }}>{tag}</Text>
                      <Text
                        style={styles.remove}
                        onPress={() => removeTag(tag)}
                      >
                        ✕
                      </Text>
                    </View>
                  ))}
                </View>


                <View style={styles.inputContainer}>
                  <Ionicons name="pricetag-outline" size={20} color="#777" />

                  <TextInput
                    placeholder="Add your own skill"
                    placeholderTextColor="#888"
                    style={[styles.input, { flex: 1 }]}
                    value={tagInput}
                    onChangeText={setTagInput}
                  />

                  <TouchableOpacity
                    onPress={() => addTag(tagInput)}
                    style={{ paddingHorizontal: 6 }}
                  >
                    <Ionicons name="add" size={24} color="#777" />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Phone */}
            <Input
              icon="call-outline"
              placeholder="Phone Number"
              value={phone}
              onChange={setPhone}
              numeric
            />

            {/* Error */}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Register */}
            <TouchableOpacity onPress={handleRegister}>
              <LinearGradient
                colors={["#2196F3", "#2196F3"]}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Register</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.footer}>
              By registering, you agree to Terms & Privacy Policy
            </Text>
          </View>
        </ScrollView>
        <Popup
          message={popup}
          onClose={() => setPopup("")}
        />
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

/* 🔥 Reusable */

const Input = ({ icon, placeholder, value, onChange, numeric }: any) => (
  <View style={styles.inputContainer}>
    <Ionicons name={icon} size={20} />
    <TextInput
      placeholder={placeholder}
      style={styles.input}
      value={value}
      keyboardType={numeric ? "numeric" : "default"}
      maxLength={numeric ? 10 : undefined}
      onChangeText={(text) => {
        if (numeric) {
          const filtered = text.replace(/[^0-9]/g, "");
          onChange(filtered);
        } else {
          onChange(text);
        }
      }}
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
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
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
    backgroundColor: "#ff9800",
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
    backgroundColor: "#2196F3",
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
  roleBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: "#ddd",
    marginRight: 5,
    borderRadius: 8,
    alignItems: "center",
  },

  activeRole: {
    backgroundColor: "#2196F3",
  },

  // popup: {
  //   position: "absolute",
  //   top: "40%",
  //   left: 20,
  //   right: 20,
  //   backgroundColor: "#2196F3",
  //   padding: 20,
  //   borderRadius: 15,
  //   alignItems: "center",
  //   elevation: 5,
  // },

  // popup: {
  //   position: "absolute",
  //   top: 0,
  //   left: 0,
  //   right: 0,
  //   bottom: 0,
  //   justifyContent: "center",
  //   alignItems: "center",
  //   backgroundColor: "rgba(0,0,0,0.3)", // dark overlay
  // },

  // popupBox: {
  //   backgroundColor: "#2196F3",
  //   padding: 20,
  //   borderRadius: 15,
  //   width: "80%",
  //   alignItems: "center",
  //   elevation: 5,
  // },

  // popupText: {
  //   fontSize: 16,
  //   fontWeight: "600",
  //   color: "#fff",
  //   textAlign: "center",
  // },
});
