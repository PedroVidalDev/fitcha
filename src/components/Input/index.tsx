import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { InputProps } from "./types";

const ERROR_COLOR = "#EF5350";

export const Input = (props: InputProps) => {
  const {
    label, value, onChangeText, placeholder,
    keyboardType = "default", icon,
    secure = false, autoCapitalize = "none",
    error,
  } = props;

  const { t } = useTheme();
  
  const [hidden, setHidden] = useState(true);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const errorFade = useRef(new Animated.Value(0)).current;

  const hasError = !!error;

  useEffect(() => {
    if (hasError) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      Animated.timing(errorFade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else {
      Animated.timing(errorFade, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    }
  }, [error]);

  return (
    <View style={{ marginBottom: hasError ? 8 : 16 }}>
      <Text style={{
        color: hasError ? ERROR_COLOR : t.textMuted,
        fontSize: 12, fontWeight: "700", marginBottom: 8, marginLeft: 4,
      }}>
        {label}
      </Text>

      <Animated.View style={{
        flexDirection: "row", alignItems: "center",
        backgroundColor: t.inputBg, borderRadius: 14,
        borderWidth: hasError ? 1 : 0.5,
        borderColor: hasError ? ERROR_COLOR : t.border,
        paddingHorizontal: 14,
        transform: [{ translateX: shakeAnim }],
      }}>
        <Ionicons name={icon as any} size={18} color={hasError ? ERROR_COLOR : t.textDim} />
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
      </Animated.View>

      {hasError && (
        <Animated.Text style={{
          color: ERROR_COLOR, fontSize: 12, fontWeight: "600",
          marginTop: 6, marginLeft: 4, opacity: errorFade,
        }}>
          {error}
        </Animated.Text>
      )}
    </View>
  );
};