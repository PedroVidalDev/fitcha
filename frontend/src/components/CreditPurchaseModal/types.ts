import { UserPayment } from "../../@types/credit";

export type CreditPurchaseModalProps = {
    visible: boolean;
    step: 1 | 2 | 3;
    payment: UserPayment | null;
    creditQuantity: string;
    documentNumber: string;
    isLoading: boolean;
    isCreatingCheckout: boolean;
    isRefreshingStatus: boolean;
    errorMessage: string | null;
    onClose: () => void;
    onCreditQuantityChange: (value: string) => void;
    onDocumentNumberChange: (value: string) => void;
    onContinue: () => void;
    onBack: () => void;
    onGenerateCheckout: () => void;
    onRefreshStatus: () => void;
};
