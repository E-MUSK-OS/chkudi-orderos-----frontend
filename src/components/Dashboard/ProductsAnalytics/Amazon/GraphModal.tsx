import React from "react";
import { X, BarChart3, TrendingUp, Users, Award } from "lucide-react";
import { Chart } from "react-google-charts";

interface GraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: any[];
  isSingleItem?: boolean;
  title?: string;
}

export default function GraphModal({ isOpen, onClose, data, isSingleItem, title }: GraphModalProps) {
  if (!isOpen) return null;

  // Helper to parse rank number from string like "#65,945 in Clothing"
  const parseRank = (rankStr?: string) => {
    if (!rankStr) return null;
    const match = rankStr.match(/#?([\d,]+)/);
    if (match && match[1]) {
      return parseInt(match[1].replace(/,/g, ''), 10);
    }
    return null;
  };

  // Construct data for Google Chart
  const chartData: any[] = [
    [
      { type: "string", label: "Date" },
      { type: "number", label: isSingleItem ? "Reviews" : "Total Reviews" },
      { type: "number", label: isSingleItem ? "Clothing Rank" : "Avg Clothing Rank" },
      { type: "number", label: isSingleItem ? "Rank" : "Avg Rank" }
    ]
  ];

  if (data && data.length > 0) {
    const grouped: Record<string, any> = {};

    data.forEach((item) => {
      const recordsToProcess = item.history && item.history.length > 0 ? item.history : [item];

      recordsToProcess.forEach((record: any) => {
        const dateStr = record.dateString || record.lastScrapedAt || record.createdAt;
        if (!dateStr) return;
        
        let dateObj = new Date(dateStr);
        
        // Handle DD/MM/YYYY format if Date parsed as Invalid
        if (isNaN(dateObj.getTime()) && dateStr.includes('/')) {
          const parts = dateStr.split(/[/\-]/); // Split by / or -
          if (parts.length === 3) {
            // Check if first part is > 12 (must be day) or we just assume DD/MM/YYYY
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            dateObj = new Date(year < 100 ? 2000 + year : year, month, day);
          }
        }

        if (isNaN(dateObj.getTime())) return; // Still invalid, skip

        // Format as YYYY-MM-DD for sorting
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const sortKey = `${year}-${month}-${day}`;
        const displayKey = `${day}/${month}/${year}`;

        if (!grouped[sortKey]) {
          grouped[sortKey] = {
            displayDate: displayKey,
            totalReviews: 0,
            totalClothingRank: 0,
            countClothing: 0,
            totalRank: 0,
            countRank: 0,
          };
        }

        let rCount = 0;
        const reviewVal = record.reviews !== undefined ? record.reviews : record.reviewCount;
        if (typeof reviewVal === 'string') {
          rCount = parseInt((reviewVal as string).replace(/,/g, ''), 10);
        } else if (typeof reviewVal === 'number') {
          rCount = reviewVal;
        }
        if (!isNaN(rCount)) {
          grouped[sortKey].totalReviews += rCount;
        }

        const cRank = parseRank(record.clothingRank || record.bsrCategory);
        if (cRank !== null) {
          grouped[sortKey].totalClothingRank += cRank;
          grouped[sortKey].countClothing += 1;
        }

        const sRank = parseRank(record.rank || record.bsrSubcategory);
        if (sRank !== null) {
          grouped[sortKey].totalRank += sRank;
          grouped[sortKey].countRank += 1;
        }
      });
    });

    const sortedKeys = Object.keys(grouped).sort();

    sortedKeys.forEach((key) => {
      const g = grouped[key];
      // For single item, it's raw data. For multiple, it averages.
      const clothingVal = isSingleItem ? g.totalClothingRank : (g.countClothing > 0 ? Math.round(g.totalClothingRank / g.countClothing) : null);
      const rankVal = isSingleItem ? g.totalRank : (g.countRank > 0 ? Math.round(g.totalRank / g.countRank) : null);

      chartData.push([
        g.displayDate,
        g.totalReviews === 0 ? null : g.totalReviews, // Prevent 0 from crashing logScale
        clothingVal || null,
        rankVal || null
      ]);
    });

    if (chartData.length === 1) {
      chartData.push(["No Data", null, null, null]);
    }
  } else {
    // Fallback empty state
    chartData.push(["No Data", null, null, null]);
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E7E0D2] bg-[#FAF6F0] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8C16D] text-[#0A0E1A]">
              <BarChart3 size={20} />
            </div>
            <h2 className="text-xl font-bold text-[#0A0E1A]">{title || "Product Analytics Graph"}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-6">Performance overview based on rankings and customer feedback.</p>
          
          <div className="relative w-full h-[500px] bg-white rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-center overflow-hidden shadow-sm">
            <Chart
              chartType="LineChart"
              width="100%"
              height="100%"
              data={chartData}
              options={{
                title: "",
                curveType: "none",
                lineWidth: 3,
                pointSize: 5,
                fontName: "inherit",
                backgroundColor: "transparent",
                legend: { position: "top", textStyle: { fontSize: 13, color: "#0A0E1A", bold: true } },
                colors: ["#0A0E1A", "#E8C16D", "#B88728"],
                hAxis: {
                  textStyle: { fontSize: 11, color: "#64748b", bold: true },
                  gridlines: { color: "transparent" },
                  baselineColor: "#E7E0D2",
                  slantedText: true,
                  slantedTextAngle: 45,
                },
                vAxis: {
                  textStyle: { fontSize: 12, color: "#64748b", bold: true },
                  gridlines: { color: "#E7E0D2" },
                  baselineColor: "#E7E0D2",
                  logScale: true, // Use logarithmic scale so large BSR and small Reviews can share one axis
                },
                interpolateNulls: true,
                chartArea: { width: "85%", height: "70%", top: 40 },
              }}
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t border-[#E7E0D2] bg-slate-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-[#0A0E1A] px-6 py-2.5 font-bold text-white transition-all hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
