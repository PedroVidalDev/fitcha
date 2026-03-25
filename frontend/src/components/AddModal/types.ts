export type AddModalProps = {
    visible: boolean;
    title: string;
    placeholder: string;
    showDayPicker?: boolean;
    onClose: () => void;
    onAdd: (name: string, days?: number[]) => void;
};
