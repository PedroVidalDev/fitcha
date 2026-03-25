import { getData, saveData, uid } from "@/src/hooks/useStorage";
import { cancelCategoryNotifications, scheduleWeeklyNotifications } from "@/src/services/notifications";
import { useCallback, useEffect, useState } from "react";
import { Category } from "../types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getData().then((data) => {
      const cats = data.categories.map((c) => ({
        ...c, machineCount: (data.machines[c.id] ?? []).length,
      }));
      setCategories(cats);
    });
  }, []);

  const updateCategoryDays = useCallback(async (categoryId: string, days: number[]) => {
    const data = await getData();
    const cat = data.categories.find((c) => c.id === categoryId);
    if (cat) {
      cat.days = days;
      await saveData(data);
      setCategories(data.categories.map((c) => ({
        ...c, machineCount: (data.machines[c.id] ?? []).length,
      })));
      
      await scheduleWeeklyNotifications(categoryId, cat.name, days);
    }
  }, []);

  const addCategory = useCallback(async (name: string, days: number[]) => {
    const data = await getData();
    const cat: Category = { id: uid(), name, machineCount: 0, days };
    data.categories.push(cat);
    data.machines[cat.id] = [];
    await saveData(data);
    setCategories(data.categories.map((c) => ({
      ...c, machineCount: (data.machines[c.id] ?? []).length,
    })));

    await scheduleWeeklyNotifications(cat.id, name, days);
  }, []);

  const deleteCategory = useCallback(async (categoryId: string) => {
    const data = await getData();
    const machines = data.machines[categoryId] ?? [];
    for (const m of machines) {
      delete data.history[m.id];
    }
    delete data.machines[categoryId];
    data.categories = data.categories.filter((c) => c.id !== categoryId);
    await saveData(data);
    setCategories(data.categories.map((c) => ({
      ...c, machineCount: (data.machines[c.id] ?? []).length,
    })));

    await cancelCategoryNotifications(categoryId);
  }, []);

  return { categories, addCategory, deleteCategory, updateCategoryDays };
}