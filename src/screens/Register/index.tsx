import { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated, KeyboardAvoidingView, Platform, Alert, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Input } from "../../components/Input";

export default function Register() {
  const { register } = useAuth();
  const { t } = useTheme();
  const navigation = useNavigation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(40)).current;

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Atenção", "As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Atenção", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    try {
      await register(name.trim(), email.trim(), password);
    } catch {
      Alert.alert("Erro", "Não foi possível criar a conta.");
    }
  };

  const btnColor = t.mode === "dark" ? "#0d0500" : "#FFF";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={t.mode === "dark" ? ["#1a0a00", "#0d0500", "#060200"] : ["#FAF6F2", "#F5F0EB", "#EDE4DB"]}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 28, paddingVertical: 40 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 32 }}
            >
              <Ionicons name="arrow-back" size={22} color={t.accent} />
              <Text style={{ color: t.accent, fontSize: 15, fontWeight: "700" }}>Voltar</Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 28, fontWeight: "900", color: t.textPrimary, marginBottom: 6 }}>
              Criar conta
            </Text>
            <Text style={{ fontSize: 14, color: t.textMuted, marginBottom: 32, fontWeight: "500" }}>
              Preencha seus dados para começar
            </Text>

            <Input label="Nome" icon="person-outline" value={name} onChangeText={setName} placeholder="Seu nome" autoCapitalize="words" />
            <Input label="E-mail" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="seu@email.com" keyboardType="email-address" />
            <Input label="Senha" icon="lock-closed-outline" value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" secure />
            <Input label="Confirmar senha" icon="shield-checkmark-outline" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repita a senha" secure />

            <TouchableOpacity activeOpacity={0.8} onPress={handleRegister} style={{ marginTop: 12 }}>
              <LinearGradient
                colors={t.gradientAccent}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, borderRadius: 14, alignItems: "center" }}
              >
                <Text style={{ color: btnColor, fontSize: 17, fontWeight: "900" }}>Criar conta</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20, alignItems: "center", padding: 8 }}>
              <Text style={{ color: t.textMuted, fontSize: 14, fontWeight: "500" }}>
                Já tem conta? <Text style={{ color: t.accent, fontWeight: "800" }}>Entrar</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}