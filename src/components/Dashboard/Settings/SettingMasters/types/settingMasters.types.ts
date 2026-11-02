export interface FieldGroup {
  id: string;
  no: number;
  field: string;
  label: string;
  totalCount: number;
  activeCount: number;
}

export interface SettingOptionItem {
  id: string;
  no: number;
  field: string;
  value: string;
  label: string;
  isActive: boolean;
  isDefault?: boolean;
  createdAt?: string | null;
}

export interface CreateOptionPayload {
  field: string;
  value: string;
  label?: string;
}

export interface UpdateOptionPayload {
  field?: string;
  value?: string;
  label?: string;
  isActive?: boolean;
  oldValue?: string;
}
