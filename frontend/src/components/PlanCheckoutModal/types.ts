import { UserPlan } from "../../@types/plan";

export type PlanCheckoutModalProps = {
    visible: boolean;
    plan: UserPlan | null;
    documentNumber: string;
    isCreatingCheckout: boolean;
    isRefreshingStatus: boolean;
    errorMessage: string | null;
    onClose: () => void;
    onDocumentNumberChange: (value: string) => void;
    onGenerateCheckout: () => void;
    onRefreshStatus: () => void;
};
