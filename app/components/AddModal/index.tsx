import {
  Modal, View, Text, TextInput, TouchableOpacity,
  Animated, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { AddModalProps } from "./types";

export const AddModal = (props: AddModalProps) => {
  const { visible, title, placeholder, onClose, onAdd } = props;

  const [value, setValue] = useState("");
  const scale = useRef(new Animated.Value(0.9)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const { t } = useTheme();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, tension: 65, friction: 8, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.9);
      fade.setValue(0);
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
      <Animated.View style={{
        flex: 1, backgroundColor: t.overlay, justifyContent: "center",
        alignItems: "center", padding: 24, opacity: fade,
      }}>
        <Animated.View style={{ transform: [{ scale }], width: "100%" }}>
          <LinearGradient colors={t.gradientModal} style={{
            width: "100%", borderRadius: 20, padding: 24,
            borderWidth: 0.5, borderColor: t.border,
            ...Platform.select({
              ios: { shadowColor: t.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24 },
              android: { elevation: 12 },
            }),
          }}>
            <Text style={{ color: t.accent, fontSize: 20, fontWeight: "800", marginBottom: 18 }}>
              {title}
            </Text>
            <TextInput
              style={{
                backgroundColor: t.inputBg, borderRadius: 12, padding: 16,
                color: t.textPrimary, fontSize: 16, borderWidth: 0.5, borderColor: t.border,
              }}
              placeholder={placeholder} placeholderTextColor={t.textDim}
              value={value} onChangeText={setValue} autoFocus onSubmitEditing={handleAdd}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 22 }}>
              <TouchableOpacity onPress={onClose} style={{ padding: 12, justifyContent: "center" }}>
                <Text style={{ color: t.textMuted, fontSize: 15, fontWeight: "600" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAdd} activeOpacity={0.75}>
                <LinearGradient colors={t.gradientAccent}
                  style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                >
                  <Text style={{ color: t.mode === "dark" ? "#0d0500" : "#FFF", fontSize: 15, fontWeight: "800" }}>
                    Adicionar
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}