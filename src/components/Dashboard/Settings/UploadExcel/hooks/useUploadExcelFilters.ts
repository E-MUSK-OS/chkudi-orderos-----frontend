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
  const [operatorOptions, setOperatorOptions] = useState<ThemeSelectOption[]>([]);
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
              const seenProduct = new Set<string>();
              const dedupedProducts: ThemeSelectOption[] = [];
              items.forEach((p) => {
                const val = String(p.sku || p.masterSku || p.id || "").trim();
                if (val && !seenProduct.has(val.toLowerCase())) {
                  seenProduct.add(val.toLowerCase());
                  const statusSuffix = p.isActive === false ? " (Inactive)" : "";
                  dedupedProducts.push({
                    label: `${p.productName || p.masterSku || p.sku || "Product"}${statusSuffix}`,
                    value: val,
                  });
                }
              });
              setProductOptions(dedupedProducts);
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
              const seenMaterial = new Set<string>();
              const dedupedMaterials: ThemeSelectOption[] = [];
              items.forEach((m) => {
                const val = String(m.sku || m.masterSku || m.id || "").trim();
                if (val && !seenMaterial.has(val.toLowerCase())) {
                  seenMaterial.add(val.toLowerCase());
                  const statusSuffix = m.isActive === false ? " (Inactive)" : "";
                  dedupedMaterials.push({
                    label: `${m.materialName || m.masterSku || m.sku || "Material"}${statusSuffix}`,
                    value: val,
                  });
                }
              });
              setMaterialOptions(dedupedMaterials);
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
            const seenCompany = new Set<string>();
            const dedupedCompanies: ThemeSelectOption[] = [];
            items.forEach((c) => {
              const val = String(c.companyCode || c.id || "").trim();
              if (val && !seenCompany.has(val.toLowerCase())) {
                seenCompany.add(val.toLowerCase());
                dedupedCompanies.push({
                  label: c.companyName || c.companyCode || "Company",
                  value: val,
                });
              }
            });
            setCompanyOptions(dedupedCompanies);
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
        } else if (profile === "productAnalytics") {
          try {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/amazon-analytics`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (res.ok) {
              const json = await res.json();
              const items = Array.isArray(json?.data) ? json.data : [];
              const distinctOperators = Array.from(
                new Set(items.map((i: any) => String(i.operatorName || "").trim()).filter(Boolean))
              ) as string[];
              if (isMounted) {
                setOperatorOptions(distinctOperators.map((op) => ({ label: op, value: op })));
              }
            }
          } catch (_) {}
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
          if (profile === "purchaseChallan" || profile === "salesChallan") {
            return [
              { label: "All Status", value: "All" },
              { label: "Pending", value: "Pending" },
              { label: "Invoiced", value: "Invoiced" },
              { label: "Not Invoiced", value: "Not Invoiced" },
            ];
          }
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

        case "operator": {
          return [{ label: "All Operators", value: "All" }, ...operatorOptions];
        }

        case "day": {
          return [
            { label: "All Days", value: "All" },
            { label: "Sunday", value: "Sunday" },
            { label: "Monday", value: "Monday" },
            { label: "Tuesday", value: "Tuesday" },
            { label: "Wednesday", value: "Wednesday" },
            { label: "Thursday", value: "Thursday" },
            { label: "Friday", value: "Friday" },
            { label: "Saturday", value: "Saturday" },
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
    operatorOptions,
    dynamicDepartments,
    accountHeadOptions,
  ]);

  return { getOptionsForFilterKey };
}

