export interface ClientConfigTreeNode {
  id: string;
  label: string;
  path?: string;
  checked: boolean;
  indeterminate?: boolean;
  icon?: string;
  isSection?: boolean;
  children?: ClientConfigTreeNode[];
}

export type DropdownManagementMode = "SETTING_MASTERS" | "FORM_OTHER";

export interface ClientConfigurationData {
  id?: string | null;
  workspaceSuperAdminId?: string;
  clientName: string;
  subscriptionPlan: string;
  hasSeparateInventoryDept: boolean;
  dropdownManagementMode?: DropdownManagementMode;
  enabledSections: string[];
  enabledRoutes: string[];
  configurationData?: any;
  updatedAt?: string;
  isDefault?: boolean;
}

export interface ClientConfigStats {
  planName: string;
  selectedSections: number;
  totalSections: number;
  grantedRoutes: number;
  totalRoutes: number;
}

