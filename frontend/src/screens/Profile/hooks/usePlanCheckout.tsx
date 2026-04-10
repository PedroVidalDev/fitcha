import { useCallback, useEffect, useState } from "react";
import { PlanStatusResponse, UserPlan } from "../../../@types/plan";
import { useI18n } from "../../../contexts/I18nContext";
import { createPlanCheckout, getMyPlanStatus } from "../../../services/plan";

type UsePlanCheckoutParams = {
    onPlanActiveChange: (active: boolean) => Promise<void>;
};

type LoadOptions = {
    silent?: boolean;
};

export function usePlanCheckout(props: UsePlanCheckoutParams) {
    const { onPlanActiveChange } = props;
    const { t } = useI18n();

    const [plan, setPlan] = useState<UserPlan | null>(null);
    const [documentNumber, setDocumentNumber] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
    const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const syncPlanStatus = useCallback(
        async (data: PlanStatusResponse) => {
            setPlan(data.plan);
            await onPlanActiveChange(data.planActive);

            if (data.plan?.payerDocument) {
                setDocumentNumber(data.plan.payerDocument);
            }
        },
        [onPlanActiveChange],
    );

    const loadPlanStatus = useCallback(
        async (options?: LoadOptions) => {
            const silent = options?.silent ?? false;

            if (!silent) {
                setIsLoading(true);
            } else {
                setIsRefreshingStatus(true);
            }

            try {
                setErrorMessage(null);
                const response = await getMyPlanStatus();
                await syncPlanStatus(response);
            } catch (error) {
                setErrorMessage(
                    error instanceof Error ? error.message : t("planCheckout.error.loadPlan"),
                );
            } finally {
                if (!silent) {
                    setIsLoading(false);
                } else {
                    setIsRefreshingStatus(false);
                }
            }
        },
        [syncPlanStatus, t],
    );

    useEffect(() => {
        void loadPlanStatus();
    }, [loadPlanStatus]);

    useEffect(() => {
        if (!isModalVisible || plan?.status !== "pending") return;

        const interval = setInterval(() => {
            void loadPlanStatus({ silent: true });
        }, 5000);

        return () => clearInterval(interval);
    }, [isModalVisible, loadPlanStatus, plan?.status]);

    const openModal = () => {
        setErrorMessage(null);
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setErrorMessage(null);
        setIsModalVisible(false);
    };

    const generateCheckout = async () => {
        const cleanDocument = documentNumber.replace(/\D/g, "");

        if (cleanDocument.length !== 11) {
            setErrorMessage(t("planCheckout.error.invalidCpf"));
            return;
        }

        setIsCreatingCheckout(true);

        try {
            setErrorMessage(null);
            const response = await createPlanCheckout(cleanDocument);
            setPlan(response.plan);
            setDocumentNumber(response.plan.payerDocument || cleanDocument);
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : t("planCheckout.error.generatePix"),
            );
        } finally {
            setIsCreatingCheckout(false);
        }
    };

    const refreshStatus = async () => {
        await loadPlanStatus({ silent: true });
    };

    return {
        plan,
        documentNumber,
        setDocumentNumber,
        isModalVisible,
        isLoading,
        isCreatingCheckout,
        isRefreshingStatus,
        errorMessage,
        openModal,
        closeModal,
        generateCheckout,
        refreshStatus,
        reloadPlan: loadPlanStatus,
    };
}
