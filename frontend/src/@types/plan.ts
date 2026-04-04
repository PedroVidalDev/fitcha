export type UserPlanStatus = "pending" | "approved" | "expired" | "failed";

export type UserPlan = {
    id: number;
    userId: number;
    provider: string;
    status: UserPlanStatus;
    externalReference: string;
    providerPaymentId: string;
    transactionAmountCents: number;
    currency: string;
    title: string;
    description: string;
    payerDocument: string;
    qrCode: string;
    qrCodeBase64: string;
    ticketUrl: string;
    paymentExpiresAt?: string | null;
    paidAt?: string | null;
    accessStartsAt?: string | null;
    accessExpiresAt?: string | null;
    createdAt: string;
    updatedAt: string;
};

export type PlanCheckoutResponse = {
    plan: UserPlan;
    isNew: boolean;
};

export type PlanStatusResponse = {
    plan: UserPlan | null;
    planActive: boolean;
};
