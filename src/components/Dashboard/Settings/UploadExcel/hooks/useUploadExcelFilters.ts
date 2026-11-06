"use client";

import { useEffect, useState, useMemo } from "react";
import { productService } from "@/components/Dashboard/Products/ManageProducts/services/product.service";
import { materialService } from "@/components/Dashboard/Materials/ManageMaterials/services/material.service";
import { companyService } from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/services/company.service";
import { employeeService } from "@/components/Dashboard/Settings/ManageCompany/EmployeeProfile/services/employee.service";
import { salariedEmployeeService } from "@/components/Dashboard/Settings/ManageCompany/SalariedEmployee/services/salariedEmployee.service";
import { settingMastersService } from "@/components/Dashboard/Settings/SettingMasters/services/settingMasters.service";
import { buildMergedOptions } from "@/utils/dropdownOptions.utils";
import type { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import type { ProfileKey } from "../constants/uploadExcel.constants";

export const INDIAN_STATES: string[] = [
  "Gujarat",
  "Maharashtra",
  "Delhi",
  "Rajasthan",
  "Madhya Pradesh",
  "Uttar Pradesh",
  "Karnataka",
  "Tamil Nadu",
  "West Bengal",
  "Haryana",
  "Punjab",
  "Telangana",
  "Andhra Pradesh",
  "Bihar",
  "Odisha",
  "Goa",
  "Kerala",
  "Assam",
  "Chandigarh",
  "Chhattisgarh",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Uttarakhand",
];

export const ACCOUNT_HEAD_OPTIONS: string[] = [
  "Employee",
  "Sundry Creditors",
  "Sundry Debtors",
  "Bank Accounts",
  "Direct Expenses",
  "Indirect Expenses",
  "Direct Incomes",
  "Indirect Incomes",
  "Capital Account",
  "Duties & Taxes",
  "Purchase Accounts",
  "Sales Accounts",
  "Loans & Advances",
];

export const STANDARD_DEPARTMENTS: string[] = [
  "Admin",
  "Cutting",
  "Stitching",
  "Finishing",
  "Store",
  "Inventory",
  "Computer Operator",
  "Quality Check",
  "Production",
  "Packaging",
  "Accounts",
  "Security",
  "Management",
];

export const FINANCIAL_YEAR_MONTHS: string[] = [
  "April 2026",
  "May 2026",
  "June 2026",
  "July 2026",
  "August 2026",
  "September 2026",
  "October 2026",
  "November 2026",
  "December 2026",
  "January 2027",
  "February 2027",
  "March 2027",
];

export function useUploadExcelFilters(profile: ProfileKey) {
  const [productOptions, setProductOptions] = useState<ThemeSelectOption[]>([]);
  const [materialOptions, setMaterialOptions] = useState<ThemeSelectOption[]>([]);
  const [productCategoryOptions, setProductCategoryOptions] = useState<ThemeSelectOption[]>([]);
  const [materialCategoryOptions, setMaterialCategoryOptions] = useState<ThemeSelectOption[]>([]);
  const [productMasterSkuOptions, setProductMasterSkuOptions] = useState<ThemeSelectOption[]>([]);
  const [materialMasterSkuOptions, setMaterialMasterSkuOptions] = useState<ThemeSelectOption[]>([]);
  const [companyOptions, setCompanyOptions] = useState<ThemeSelectOption[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<ThemeSelectOption[]>([]);
  const [dynamicDepartments, setDynamicDepartments] = useState<string[]>(STANDARD_DEPARTMENTS);
  const [accountHeadOptions, setAccountHeadOptions] = useState<string[]>(ACCOUNT_HEAD_OPTIONS);

  useEffect(() => {
    let isMounted = true;

    async function fetchOriginalOptions() {
      try {
        if (profile === "product") {
          // Fetch Product Dropdown Options from Setting Masters & Products
          const [dropdownRes, productsRes] = await Promise.allSettled([
            productService.getDropdownOptions(),
            productService.getAll(),
          ]);

          if (isMounted) {
            if (dropdownRes.status === "fulfilled" && dropdownRes.value?.data) {
              const dd = dropdownRes.value.data;
              const cats = buildMergedOptions(
                "category",
                ["Apparel", "Footwear", "Accessories", "Home Textile"],
                dd.savedOptions,
                dd.distinctFromProducts?.categories
              );
              setProductCategoryOptions(cats.map((c) => ({ label: c.label, value: c.value })));
            }

            if (productsRes.status === "fulfilled" && productsRes.value?.data) {
              const items = Array.isArray(productsRes.value.data) ? productsRes.value.data : [];
              setProductOptions(
                items.map((p) => {
                  const statusSuffix = p.isActive === false ? " (Inactive)" : "";
                  return {
                    label: `${p.productName || p.masterSku || p.sku || "Product"}${statusSuffix}`,
                    value: p.masterSku || p.sku || p.id,
                  };
                })
              );
              const distinctMaster = Array.from(
                new Set(items.map((p) => String(p.masterSku || "").trim()).filter(Boolean))
              );
              setProductMasterSkuOptions(distinctMaster.map((m) => ({ label: m, value: m })));
            }
          }
        } else if (profile === "material") {
          // Fetch Material Dropdown Options
          const [dropdownRes, materialsRes] = await Promise.allSettled([
            materialService.getDropdownOptions(),
            materialService.getAll(),
          ]);

          if (isMounted) {
            if (dropdownRes.status === "fulfilled" && dropdownRes.value?.data) {
              const dd = dropdownRes.value.data;
              const cats = buildMergedOptions(
                ["materialcategory", "category"],
                ["Fabric", "Yarn", "Thread", "Button", "Zipper", "Elastic"],
                dd.savedOptions,
                dd.distinctFromMaterials?.categories
              );
              setMaterialCategoryOptions(cats.map((c) => ({ label: c.label, value: c.value })));
            }

            if (materialsRes.status === "fulfilled" && materialsRes.value?.data) {
              const items = Array.isArray(materialsRes.value.data) ? materialsRes.value.data : [];
              setMaterialOptions(
                items.map((m) => {
                  const statusSuffix = m.isActive === false ? " (Inactive)" : "";
                  return {
                    label: `${m.materialName || m.masterSku || m.sku || "Material"}${statusSuffix}`,
                    value: m.masterSku || m.sku || m.id,
                  };
                })
              );
              const distinctMaster = Array.from(
                new Set(items.map((m) => String(m.masterSku || "").trim()).filter(Boolean))
              );
              setMaterialMasterSkuOptions(distinctMaster.map((m) => ({ label: m, value: m })));
            }
          }
        } else if (profile === "company") {
          const res = await companyService.getCompanies();
          if (isMounted && res?.data) {
            const items = Array.isArray(res.data) ? res.data : [];
            setCompanyOptions(
              items.map((c) => ({
                label: c.companyName || c.companyCode || "Company",
                value: c.companyCode || c.id,
              }))
            );
          }
        } else if (profile === "ledger") {
          try {
            const smRes = await settingMastersService.getFieldOptions("accounthead");
            if (isMounted && Array.isArray(smRes) && smRes.length > 0) {
              const smHeads = smRes.map((o) => o.label || o.value).filter(Boolean);
              setAccountHeadOptions(Array.from(new Set([...ACCOUNT_HEAD_OPTIONS, ...smHeads])));
            }
          } catch (_) {}
        } else if (profile === "employee" || profile === "salaried") {
          const [empRes, salRes, deptSmRes] = await Promise.allSettled([
            employeeService.getEmployees({ pageSize: 200 }),
            salariedEmployeeService.getSalariedEmployees({ pageSize: 200 }),
            settingMastersService.getFieldOptions("department"),
          ]);

          if (isMounted) {
            const empList = empRes.status === "fulfilled" && empRes.value?.data ? empRes.value.data : [];
            const salList = salRes.status === "fulfilled" && salRes.value?.data ? salRes.value.data : [];
            const combined = [...empList, ...salList];

            const seen = new Set<string>();
            const options: ThemeSelectOption[] = [];
            combined.forEach((e: any) => {
              const id = String(e.employeeId || "").trim();
              const name = String(e.fullName || e.employeeName || "").trim();
              if (id && !seen.has(id.toLowerCase())) {
                seen.add(id.toLowerCase());
                options.push({ label: `${id} - ${name || id}`, value: id });
              }
            });
            setEmployeeOptions(options);

            const distinctDepts = Array.from(
              new Set(combined.map((e: any) => String(e.department || "").trim()).filter(Boolean))
            );
            const smDepts =
              deptSmRes.status === "fulfilled" && Array.isArray(deptSmRes.value)
                ? deptSmRes.value.map((o) => o.label || o.value).filter(Boolean)
                : [];
            setDynamicDepartments(Array.from(new Set([...STANDARD_DEPARTMENTS, ...distinctDepts, ...smDepts])));
          }
        }
      } catch (err) {
        console.warn("Failed to load live filter dropdown options for upload excel:", err);
      }
    }

    fetchOriginalOptions();

    return () => {
      isMounted = false;
    };
  }, [profile]);

  // Map each filter key to its options list
  const getOptionsForFilterKey = useMemo(() => {
    return (filterKey: string): ThemeSelectOption[] => {
      switch (filterKey) {
        case "category": {
          const list = profile === "material" ? materialCategoryOptions : productCategoryOptions;
          const defaultList =
            profile === "material"
              ? ["Fabric", "Yarn", "Thread", "Button", "Zipper", "Elastic"]
              : ["Apparel", "Footwear", "Accessories", "Home Textile"];
          const finalItems = list.length > 0 ? list : defaultList.map((d) => ({ label: d, value: d }));
          return [{ label: "All categories", value: "All" }, ...finalItems];
        }

        case "masterSku": {
          const list = profile === "material" ? materialMasterSkuOptions : productMasterSkuOptions;
          return [{ label: "All Master SKUs", value: "All" }, ...list];
        }

        case "product": {
          return [
            { label: "All Products", value: "All" },
            { label: "Active Products", value: "ACTIVE" },
            { label: "Inactive Products", value: "INACTIVE" },
            ...productOptions,
          ];
        }

        case "material": {
          return [
            { label: "All Materials", value: "All" },
            { label: "Active Materials", value: "ACTIVE" },
            { label: "Inactive Materials", value: "INACTIVE" },
            ...materialOptions,
          ];
        }

        case "company": {
          return [{ label: "All Companies", value: "All" }, ...companyOptions];
        }

        case "status": {
          return [
            { label: "All Status", value: "All" },
            { label: "Active", value: "ACTIVE" },
            { label: "Draft", value: "DRAFT" },
            { label: "Inactive", value: "INACTIVE" },
          ];
        }

        case "state": {
          return [
            { label: "All States", value: "All" },
            ...INDIAN_STATES.map((s) => ({ label: s, value: s })),
          ];
        }

        case "accountHead": {
          return [
            { label: "All Account Heads", value: "All" },
            ...accountHeadOptions.map((h) => ({ label: h, value: h })),
          ];
        }

        case "department": {
          return [
            { label: "All Departments", value: "All" },
            ...dynamicDepartments.map((d) => ({ label: d, value: d })),
          ];
        }

        case "employee": {
          return [{ label: "All Employees", value: "All" }, ...employeeOptions];
        }

        case "month": {
          return [
            { label: "All Months", value: "All" },
            ...FINANCIAL_YEAR_MONTHS.map((m) => ({ label: m, value: m })),
          ];
        }

        default:
          return [{ label: "All", value: "All" }];
      }
    };
  }, [
    profile,
    productOptions,
    materialOptions,
    productCategoryOptions,
    materialCategoryOptions,
    productMasterSkuOptions,
    materialMasterSkuOptions,
    companyOptions,
    employeeOptions,
    dynamicDepartments,
    accountHeadOptions,
  ]);

  return { getOptionsForFilterKey };
}

