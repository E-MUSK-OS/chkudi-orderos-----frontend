// ==================================================================================
// ========================= CONNECTION STATUS ======================================
// ==================================================================================

export type ConnectionStatus =
  | "NOT_CONNECTED"
  | "CONNECTED"
  | "EXPIRED"
  | "ERROR";

// ==================================================================================
// ======================== CONNECTION REQUEST ======================================
// ==================================================================================

export interface MarketplaceConnectionPayload {
  marketplaceAccountId: string;

  credentials: Record<string, string>;
}

// ==================================================================================
// ======================== CONNECTION RESPONSE =====================================
// ==================================================================================

export interface MarketplaceConnectionResponse {
  success: boolean;

  message: string;
}

// ==================================================================================
// ======================== FORM PROPS ==============================================
// ==================================================================================

export interface MarketplaceConnectionFormProps {
  marketplaceAccountId: string;

  loading: boolean;

  onSubmit: (
    credentials: Record<string, string>
  ) => Promise<boolean>;
}