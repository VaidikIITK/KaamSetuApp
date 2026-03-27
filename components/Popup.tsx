import React from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type PopupProps = {
  message: string;
  onClose: () => void;
  type?: "normal" | "error";
};

export default function Popup({
  message,
  onClose,
  type = "normal",
}: PopupProps) {
  if (!message) return null;

    const bgColor = type === "error" ? "#f44336" : "#2196F3";

    return (
    <Modal transparent animationType="fade">
        <View style={styles.popup}>
        <View style={[styles.popupBox, { backgroundColor: bgColor }]}>
            <Text style={styles.popupText}>{message}</Text>

            <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>OK</Text>
            </TouchableOpacity>
        </View>
        </View>
    </Modal>
    );
}

const styles = StyleSheet.create({
  popup: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },

  popupBox: {
    padding: 20,
    borderRadius: 15,
    width: "80%",
    alignItems: "center",
  },

  popupText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  btn: {
    marginTop: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 8,
  },

  btnText: {
    color: "#2196F3",
    fontWeight: "600",
  },
});