import AsyncStorage from "@react-native-async-storage/async-storage";
import { Category } from "../screens/Categories/types";
import { Machine } from "../screens/Machines/types";
import { HistoryEntry } from "../screens/Detail/types";

const STORAGE_KEY = "app_data";

type AppData = {
  categories: Category[];
  machines: Record<string, Machine[]>;
  history: Record<string, HistoryEntry[]>;
};

export const uid = () => Math.random().toString(36).slice(2, 10);
let cache: AppData | null = null;

export async function getData(): Promise<AppData> {
  if (cache) return cache;
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  cache = raw ? JSON.parse(raw) : { categories: [], machines: {}, history: {} };
  return cache!;
}

export async function saveData(data: AppData) {
  cache = data;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
