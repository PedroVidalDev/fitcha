import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Modal, Platform, View, useWindowDimensions } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { AppModalProps } from "./types";

export function AppModal(props: AppModalProps) {
    const { visible, onClose, children, contentStyle, overlayPadding = 20 } = props;

    const scale = useRef(new Animated.Value(0.9)).current;
    const fade = useRef(new Animated.Value(0)).current;
    const { t } = useTheme();
    const { height: viewportHeight } = useWindowDimensions();
    const modalMinHeight = Math.min(viewportHeight * 0.5, viewportHeight - overlayPadding * 2);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scale, {
                    toValue: 1,
                    tension: 65,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
        } else {
            scale.setValue(0.9);
            fade.setValue(0);
        }
    }, [fade, scale, visible]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <Animated.View
                style={{
                    flex: 1,
                    backgroundColor: t.overlay,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: overlayPadding,
                    opacity: fade,
                }}
            >
                <Animated.View style={{ transform: [{ scale }], width: "100%" }}>
                    <View
                        style={{
                            borderRadius: 20,
                            ...Platform.select({
                                ios: {
                                    shadowColor: t.shadow,
                                    shadowOffset: { width: 0, height: 8 },
                                    shadowOpacity: 0.12,
                                    shadowRadius: 24,
                                },
                                android: { elevation: 12 },
                            }),
                        }}
                    >
                        <LinearGradient
                            colors={t.gradientModal}
                            style={[
                                {
                                    width: "100%",
                                    minHeight: modalMinHeight,
                                    maxHeight: "80%",
                                    borderRadius: 20,
                                    padding: 26,
                                    borderWidth: 0.5,
                                    borderColor: t.border,
                                    overflow: "hidden",
                                },
                                contentStyle,
                            ]}
                        >
                            {children}
                        </LinearGradient>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}
