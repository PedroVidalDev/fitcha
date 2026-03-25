import { KeyboardTypeOptions } from "react-native";

export type InputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  icon: string;
  secure?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  error?: string;
};