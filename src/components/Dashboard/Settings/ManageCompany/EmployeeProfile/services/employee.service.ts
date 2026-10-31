import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  Employee,
  EmployeeFilterState,
  EmployeeFormData,
} from "../types/employee.types";

function extractErrorMessage(err: any, fallback: string): string {
  if (!err) return fallback;
  let msg = err.message || fallback;
  if (typeof msg === "string" && msg.trim().startsWith("[") && msg.trim().endsWith("]")) {
    try {
      const parsed = JSON.parse(msg);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: any) => p.message || p.code || "Validation error").join(", ");
      }
    } catch (_) {}
  }
  return msg;
}

export const employeeService = {
  async getEmployees(filters?: Partial<EmployeeFilterState>): Promise<{
    data: Employee[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.search) params.append("search", filters.search);
      if (filters.employeeName) params.append("employeeName", filters.employeeName);
      if (filters.machineCode) params.append("machineCode", filters.machineCode);
      if (filters.status && filters.status !== "all") {
        params.append("status", filters.status);
      }
      if (filters.department && filters.department !== "all") {
        params.append("department", filters.department);
      }
      if (filters.page) params.append("page", String(filters.page));
      if (filters.pageSize) params.append("limit", String(filters.pageSize));
    }

    const res = await fetchWithAuth(`${API_BASE_URL}/employees?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to load employees."));
    }
    return await res.json();
  },

  async getEmployeeById(id: string): Promise<{ data: Employee }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/employees/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to load employee details."));
    }
    return await res.json();
  },

  async uploadMedia(
    file: File,
    subfolder = "employees",
    prefix = "emp_doc"
  ): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("subfolder", subfolder);
    formData.append("prefix", prefix);

    let accessToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const res = await fetch(`${API_BASE_URL}/media/upload-company-media`, {
      method: "POST",
      headers: {
        "ngrok-skip-browser-warning": "true",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to upload file to storage.");
    }
    const json = await res.json();
    return { url: json.url || json.secure_url };
  },

  async createEmployee(payload: Partial<EmployeeFormData>): Promise<{ data: Employee; message: string }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/employees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to create employee."));
    }
    return await res.json();
  },

  async updateEmployee(
    id: string,
    payload: Partial<EmployeeFormData>
  ): Promise<{ data: Employee; message: string }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/employees/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to update employee."));
    }
    return await res.json();
  },

  async deleteEmployee(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetchWithAuth(`${API_BASE_URL}/employees/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, "Failed to delete employee."));
    }
    return await res.json();
  },
};
