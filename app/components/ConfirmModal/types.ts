export type ConfirmModalProps = {
  visible: boolean; title: string; message: string;
  confirmLabel?: string; onClose: () => void; onConfirm: () => void;
};