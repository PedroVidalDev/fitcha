import { MachineCategoryKey } from "../constants/categories";

export type Machine = {
    id: string;
    name: string;
    description?: string;
    photo?: string;
    categoryKey: MachineCategoryKey;
};
