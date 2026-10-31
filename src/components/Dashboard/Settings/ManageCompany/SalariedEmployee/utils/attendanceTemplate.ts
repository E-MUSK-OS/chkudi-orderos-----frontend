export const BLANK_ATTENDANCE_HEADERS = [
  "Employee ID*",
  "Employee Name*",
  "Month*",
  "Period",
  "Absent Hours*",
  "Overtime Hours*",
  "Financial Year",
];

function getCurrentMonthAndPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 = Jan, 9 = Oct
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthName = `${monthNames[month]} ${year}`;

  const startFyYear = month >= 3 ? year : year - 1;
  const financialYear = `${startFyYear}-${startFyYear + 1}`;

  const pad = (n: number) => String(n).padStart(2, "0");
  const periodString = `01-${pad(month + 1)}-${year} - 15-${pad(month + 1)}-${year}`;

  return { monthName, periodString, financialYear };
}

export function downloadBlankAttendanceTemplate(
  employees?: Array<{ employeeId?: string | null; fullName?: string | null }>
) {
  const { monthName, periodString, financialYear } = getCurrentMonthAndPeriod();

  const escapeCsv = (str?: string | null) => {
    const val = String(str ?? "").replace(/"/g, '""');
    return `"${val}"`;
  };

  const rows: string[] = [
    BLANK_ATTENDANCE_HEADERS.map((h) => `"${h}"`).join(","),
  ];

  if (employees && employees.length > 0) {
    employees.forEach((emp) => {
      const empId = emp.employeeId || "";
      const empName = emp.fullName || "";
      rows.push(
        [
          escapeCsv(empId),
          escapeCsv(empName),
          escapeCsv(monthName),
          escapeCsv(periodString),
          escapeCsv("0"),
          escapeCsv("0"),
          escapeCsv(financialYear),
        ].join(",")
      );
    });
  } else {
    // If no employees, provide a sample template row
    rows.push(
      [
        escapeCsv("EP-01"),
        escapeCsv("Ramesh Ramjibhai Bhatiya"),
        escapeCsv(monthName),
        escapeCsv(periodString),
        escapeCsv("0"),
        escapeCsv("0"),
        escapeCsv(financialYear),
      ].join(",")
    );
  }

  const csvContent =
    "data:text/csv;charset=utf-8,\uFEFF" +
    encodeURIComponent(rows.join("\r\n") + "\r\n");

  const link = document.createElement("a");
  link.setAttribute("href", csvContent);
  link.setAttribute(
    "download",
    `Salaried_Employee_Attendance_Template_${new Date().toISOString().split("T")[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseAttendanceCsv(text: string): Array<{
  employeeId?: string;
  employeeName?: string;
  monthName?: string;
  monthIndex?: number;
  periodString?: string;
  absentHours?: number;
  overtimeHours?: number;
  financialYear?: string;
}> {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length <= 1) return [];

  const headers = lines[0]
    .split(",")
    .map((h) => h.replace(/^"|"$/g, "").trim().toLowerCase());

  const records: any[] = [];

  const monthNames = [
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
    "january",
    "february",
    "march",
  ];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // Split on commas not inside quotes
    const values =
      rawLine.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map((val) =>
        val.replace(/^"|"$/g, "").trim()
      ) || rawLine.split(",").map((v) => v.replace(/^"|"$/g, "").trim());

    if (!values || values.length === 0) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });

    const empId = row["employee id*"] || row["employee id"] || row["id"] || "";
    const empName = row["employee name*"] || row["employee name"] || row["name"] || "";
    const month = row["month*"] || row["month"] || "April 2026";
    const period = row["period"] || "";
    const absent = parseFloat(row["absent hours*"] || row["absent hours"] || "0") || 0;
    const ot = parseFloat(row["overtime hours*"] || row["overtime hours"] || "0") || 0;
    const fy = row["financial year"] || "2026-2027";

    const monthLower = month.toLowerCase();
    let monthIdx = 0;
    monthNames.forEach((m, idx) => {
      if (monthLower.includes(m)) monthIdx = idx;
    });

    if (empId || empName) {
      records.push({
        employeeId: empId,
        employeeName: empName,
        monthName: month,
        monthIndex: monthIdx,
        periodString: period,
        absentHours: absent,
        overtimeHours: ot,
        financialYear: fy,
      });
    }
  }

  return records;
}

