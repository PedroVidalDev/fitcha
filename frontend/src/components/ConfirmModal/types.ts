export type ConfirmModalProps = {
    visible: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    hideCancel?: boolean;
    confirmVariant?: "danger" | "accent";
    onClose: () => void;
    onConfirm: () => void;
};
