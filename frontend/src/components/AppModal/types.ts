import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";

export type AppModalProps = {
    visible: boolean;
    onClose: () => void;
    children: ReactNode;
    contentStyle?: StyleProp<ViewStyle>;
    overlayPadding?: number;
};
