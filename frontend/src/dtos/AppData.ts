import { HistoryEntry } from "./HistoryEntry";
import { Machine } from "./Machine";

export type AppData = {
    machines: Record<string, Machine>;
    days: Record<number, string[]>;
    history: Record<string, HistoryEntry[]>;
};
