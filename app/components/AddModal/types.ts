export type AddModalProps = {
  visible: boolean; title: string; placeholder: string;
  onClose: () => void; onAdd: (name: string) => void;
};