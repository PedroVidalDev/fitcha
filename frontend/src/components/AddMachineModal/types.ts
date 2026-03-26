import { MachineCategoryKey } from "@/src/constants/categories";

export type AddMachineModalProps = {
    visible: boolean;
    onClose: () => void;
    onAdd: (name: string, categoryKey: MachineCategoryKey, description?: string) => void;
};