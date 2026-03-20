import { StyleSheet } from "react-native";

export const colors = {
  bg: "#0d0500",
  card: "#1a0a00",
  surface: "#2a1508",
  border: "#7A2E00",
  accent: "#F4A261",
  textMuted: "#7A2E00",
};

export const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0500", padding: 16 },
  subtitle: {
    color: "#7A2E00",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },

  // Cards
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a0a00",
    borderRadius: 14,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#7A2E00",
    gap: 14,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2a1508",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: { color: "#F4A261", fontSize: 16, fontWeight: "600" },
  cardSub: { color: "#7A2E00", fontSize: 12, marginTop: 2 },

  // Detail
  currentBlock: { alignItems: "center", paddingVertical: 28 },
  currentLabel: {
    color: "#7A2E00",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  currentWeight: {
    color: "#F4A261",
    fontSize: 56,
    fontWeight: "800",
    marginTop: 4,
  },
  currentUnit: { fontSize: 20, color: "#F4A261" },

  inputRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    backgroundColor: "#2a1508",
    borderRadius: 12,
    padding: 14,
    color: "#F4A261",
    fontSize: 16,
    borderWidth: 0.5,
    borderColor: "#7A2E00",
  },
  saveBtn: {
    width: 50,
    backgroundColor: "#F4A261",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  sectionLabel: {
    color: "#7A2E00",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  emptyHist: { color: "#7A2E00", textAlign: "center", marginTop: 20, fontSize: 14 },
  histRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2a1508",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 0.5,
    borderColor: "#7A2E00",
  },
  histDate: { color: "#7A2E00", fontSize: 13 },
  histWeight: { color: "#F4A261", fontSize: 15, fontWeight: "600" },
});