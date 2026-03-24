import { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Animated,
  KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { t } = useTheme();
  const navigation = useNavigation();

  const logoFade = useRef(new Animated.Value(0)).current;
  const logoSlide = useRef(new Animated.Value(-30)).current;
  const formFade = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(logoSlide, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(formFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(formSlide, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }
    try {
      await login(email.trim(), password);
    } catch {
      Alert.alert("Erro", "Não foi possível entrar.");
    }
  };

  const btnColor = t.mode === "dark" ? "#0d0500" : "#FFF";

  return (
    <LinearGradient
      colors={t.mode === "dark"
        ? ["#1a0a00", "#0d0500", "#060200"]
        : ["#FAF6F2", "#F5F0EB", "#EDE4DB"]
      }
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, justifyContent: "center", paddingHorizontal: 28 }}
      >
        {/* Logo */}
        <Animated.View style={{
          alignItems: "center", marginBottom: 48,
          opacity: logoFade, transform: [{ translateY: logoSlide }],
        }}>
          <View style={{
            width: 80, height: 80, borderRadius: 24,
            backgroundColor: t.accent, justifyContent: "center", alignItems: "center",
            marginBottom: 16,
          }}>
            <Ionicons name="barbell" size={40} color={btnColor} />
          </View>
          <Text style={{ fontSize: 32, fontWeight: "900", color: t.textPrimary, letterSpacing: -1 }}>
            Fitcha
          </Text>
          <Text style={{ fontSize: 14, color: t.textMuted, marginTop: 4, fontWeight: "500" }}>
            Sua ficha de treino digital
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View style={{ opacity: formFade, transform: [{ translateY: formSlide }] }}>
          {/* Email */}
          <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 8, marginLeft: 4 }}>
            E-mail
          </Text>
          <View style={{
            flexDirection: "row", alignItems: "center",
            backgroundColor: t.inputBg, borderRadius: 14,
            borderWidth: 0.5, borderColor: t.border, marginBottom: 16, paddingHorizontal: 14,
          }}>
            <Ionicons name="mail-outline" size={18} color={t.textDim} />
            <TextInput
              style={{ flex: 1, padding: 16, color: t.textPrimary, fontSize: 16, fontWeight: "600", marginLeft: 10 }}
              placeholder="seu@email.com"
              placeholderTextColor={t.textDim}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Senha */}
          <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 8, marginLeft: 4 }}>
            Senha
          </Text>
          <View style={{
            flexDirection: "row", alignItems: "center",
            backgroundColor: t.inputBg, borderRadius: 14,
            borderWidth: 0.5, borderColor: t.border, marginBottom: 28, paddingHorizontal: 14,
          }}>
            <Ionicons name="lock-closed-outline" size={18} color={t.textDim} />
            <TextInput
              style={{ flex: 1, padding: 16, color: t.textPrimary, fontSize: 16, fontWeight: "600", marginLeft: 10 }}
              placeholder="••••••••"
              placeholderTextColor={t.textDim}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={t.textDim} />
            </TouchableOpacity>
          </View>

          {/* Botão Login */}
          <TouchableOpacity activeOpacity={0.8} onPress={handleLogin}>
            <LinearGradient
              colors={t.gradientAccent}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 16, borderRadius: 14, alignItems: "center" }}
            >
              <Text style={{ color: btnColor, fontSize: 17, fontWeight: "900" }}>Entrar</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Divisor */}
          <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 28 }}>
            <View style={{ flex: 1, height: 0.5, backgroundColor: t.border }} />
            <Text style={{ color: t.textDim, fontSize: 12, marginHorizontal: 14, fontWeight: "600" }}>ou</Text>
            <View style={{ flex: 1, height: 0.5, backgroundColor: t.border }} />
          </View>

          {/* Link registro */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Register")}
            activeOpacity={0.7}
            style={{
              paddingVertical: 16, borderRadius: 14, alignItems: "center",
              borderWidth: 1, borderColor: t.accent,
            }}
          >
            <Text style={{ color: t.accent, fontSize: 16, fontWeight: "800" }}>Criar conta</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}