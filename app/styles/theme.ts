import { StyleSheet, Platform } from "react-native";

export const colors = {
  bg: "#0d0500",
  card: "#1a0a00",
  surface: "#2a1508",
  border: "rgba(244, 162, 97, 0.12)",
  borderSolid: "#7A2E00",
  accent: "#F4A261",
  accentDark: "#E07A2F",
  textMuted: "#8B4513",
  textDim: "#5a2a0a",
};

export const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  headerBtn: { padding: 4 },

  subtitle: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 18,
    marginLeft: 2,
  },

  // Cards
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "rgba(244, 162, 97, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: { color: colors.accent, fontSize: 16, fontWeight: "700" },
  cardSub: { color: colors.textMuted, fontSize: 12, marginTop: 3, fontWeight: "500" },

  // Detail — Hero
  heroBlock: {
    alignItems: "center",
    paddingVertical: 32,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: "#F4A261",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  heroLabel: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  heroPlaceholder: {
    color: colors.textMuted,
    fontSize: 48,
    fontWeight: "900",
    marginTop: 8,
  },
  heroMax: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 12,
  },
  heroMaxValue: {
    color: colors.accent,
    fontWeight: "800",
    fontSize: 15,
  },

  // Set chips (hero)
  setsRow: {
    flexDirection: "row" as const,
    gap: 12,
    marginTop: 16,
  },
  setChip: {
    alignItems: "center" as const,
    backgroundColor: "rgba(244, 162, 97, 0.06)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 0.5,
    borderColor: "rgba(244, 162, 97, 0.12)",
  },
  setChipLabel: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  setChipValue: {
    color: colors.accent,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 2,
  },
  setChipUnit: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },

  // Set inputs
  setsInputRow: {
    flexDirection: "row" as const,
    gap: 10,
    marginBottom: 14,
  },
  setInputWrap: {
    flex: 1,
  },
  setInputLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
    marginLeft: 4,
  },
  setInput: {
    backgroundColor: "rgba(42, 21, 8, 0.6)",
    borderRadius: 12,
    padding: 14,
    color: colors.accent,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center" as const,
    borderWidth: 0.5,
    borderColor: colors.border,
  },

  // Save button full width
  saveBtnFull: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 4,
  },
  saveBtnText: {
    color: "#0d0500",
    fontSize: 16,
    fontWeight: "800",
  },

  // Delta
  deltaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  deltaText: { fontSize: 13, fontWeight: "700" },

  // Input
  inputRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  input: {
    flex: 1,
    backgroundColor: "rgba(42, 21, 8, 0.6)",
    borderRadius: 14,
    padding: 16,
    color: colors.accent,
    fontSize: 16,
    fontWeight: "600",
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  saveBtn: { width: 54, borderRadius: 14, overflow: "hidden" },
  saveBtnGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  },

  // History
  sectionLabel: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 12,
    marginLeft: 2,
  },
  emptyHist: {
    color: colors.textDim,
    textAlign: "center",
    marginTop: 24,
    fontSize: 14,
    fontWeight: "500",
  },
  histRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(35, 16, 5, 0.7)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  histDate: { color: colors.textMuted, fontSize: 13, fontWeight: "500" },
  histSets: {
    flexDirection: "row",
    gap: 14,
  },
  histSetValue: { color: colors.accent, fontSize: 14, fontWeight: "700" },
  histSetUnit: { color: colors.textMuted, fontSize: 11, fontWeight: "500" },
});