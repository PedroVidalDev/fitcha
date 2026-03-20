import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";

type Props = {
  visible: boolean;
  title: string;
  placeholder: string;
  onClose: () => void;
  onAdd: (name: string) => void;
};

export function AddModal({ visible, title, placeholder, onClose, onAdd }: Props) {
  const [value, setValue] = useState("");

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={ms.overlay}>
        <View style={ms.box}>
          <Text style={ms.title}>{title}</Text>
          <TextInput
            style={ms.input}
            placeholder={placeholder}
            placeholderTextColor="#7A2E00"
            value={value}
            onChangeText={setValue}
            autoFocus
            onSubmitEditing={handleAdd}
          />
          <View style={ms.actions}>
            <TouchableOpacity onPress={onClose} style={ms.cancelBtn}>
              <Text style={ms.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAdd} style={ms.addBtn}>
              <Text style={ms.addText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const ms = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  box: {
    width: "100%",
    backgroundColor: "#1a0a00",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#7A2E00",
  },
  title: { color: "#F4A261", fontSize: 18, fontWeight: "700", marginBottom: 16 },
  input: {
    backgroundColor: "#2a1508",
    borderRadius: 10,
    padding: 14,
    color: "#F4A261",
    fontSize: 16,
    borderWidth: 0.5,
    borderColor: "#7A2E00",
  },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 20 },
  cancelBtn: { padding: 10 },
  cancelText: { color: "#7A2E00", fontSize: 15 },
  addBtn: { backgroundColor: "#F4A261", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  addText: { color: "#0d0500", fontSize: 15, fontWeight: "700" },
});