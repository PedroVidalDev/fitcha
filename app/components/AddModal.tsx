import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useRef, useEffect } from "react";

type Props = {
  visible: boolean;
  title: string;
  placeholder: string;
  onClose: () => void;
  onAdd: (name: string) => void;
};

export function AddModal({ visible, title, placeholder, onClose, onAdd }: Props) {
  const [value, setValue] = useState("");
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[ms.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }], width: "100%" }}>
          <LinearGradient
            colors={["#231005", "#140900"]}
            style={ms.box}
          >
            <Text style={ms.title}>{title}</Text>
            <TextInput
              style={ms.input}
              placeholder={placeholder}
              placeholderTextColor="#5a2a0a"
              value={value}
              onChangeText={setValue}
              autoFocus
              onSubmitEditing={handleAdd}
            />
            <View style={ms.actions}>
              <TouchableOpacity onPress={onClose} style={ms.cancelBtn}>
                <Text style={ms.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAdd} activeOpacity={0.75}>
                <LinearGradient
                  colors={["#F4A261", "#E07A2F"]}
                  style={ms.addBtn}
                >
                  <Text style={ms.addText}>Adicionar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const ms = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  box: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    borderWidth: 0.5,
    borderColor: "rgba(244, 162, 97, 0.15)",
    ...Platform.select({
      ios: {
        shadowColor: "#F4A261",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: { elevation: 12 },
    }),
  },
  title: { color: "#F4A261", fontSize: 20, fontWeight: "800", marginBottom: 18 },
  input: {
    backgroundColor: "rgba(42, 21, 8, 0.8)",
    borderRadius: 12,
    padding: 16,
    color: "#F4A261",
    fontSize: 16,
    borderWidth: 0.5,
    borderColor: "rgba(244, 162, 97, 0.15)",
  },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 22 },
  cancelBtn: { padding: 12, justifyContent: "center" },
  cancelText: { color: "#8B4513", fontSize: 15, fontWeight: "600" },
  addBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  addText: { color: "#0d0500", fontSize: 15, fontWeight: "800" },
});