import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { InputProps } from "./types";

export const Input = (props: InputProps) => {
  const {
    label, value, onChangeText, placeholder,
    keyboardType = "default", icon,
    secure = false, autoCapitalize = "none",
  } = props;

  const { t } = useTheme();
  const [hidden, setHidden] = useState(true);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 8, marginLeft: 4 }}>
        {label}
      </Text>
      <View style={{
        flexDirection: "row", alignItems: "center",
        backgroundColor: t.inputBg, borderRadius: 14,
        borderWidth: 0.5, borderColor: t.border, paddingHorizontal: 14,
      }}>
        <Ionicons name={icon as any} size={18} color={t.textDim} />
        <TextInput
          style={{ flex: 1, padding: 16, color: t.textPrimary, fontSize: 16, fontWeight: "600", marginLeft: 10 }}
          placeholder={placeholder}
          placeholderTextColor={t.textDim}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          secureTextEntry={secure && hidden}
          value={value}
          onChangeText={onChangeText}
        />
        {secure && (
          <TouchableOpacity onPress={() => setHidden(!hidden)} style={{ padding: 4 }}>
            <Ionicons name={hidden ? "eye-outline" : "eye-off-outline"} size={20} color={t.textDim} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};