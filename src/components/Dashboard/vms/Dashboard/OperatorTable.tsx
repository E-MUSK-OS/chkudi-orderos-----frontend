import React from "react";
import { Edit, Trash2 } from "lucide-react";

import { Operator } from "../Admin/User/operator/types/operator";

interface Props {
  operators: Operator[];
  loading?: boolean;
}

const OperatorTable: React.FC<Props> = ({
  operators,
  loading = false,
  // onEdit,
  // onDelete,
}) => {
  if (loading) {
    return (
      <div className="bg-white border p-10 text-center">
        Loading operators...
      </div>
    );
  }

  if (operators.length === 0) {
    return (
      <div className="bg-white border p-10 text-center text-gray-500">
        No Operators Found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border bg-white/30">
      <table className="min-w-full">
        <thead className="bg-[#0A0E1A] text-white">
          <tr>
            <th className="px-5 py-4 text-left text-lg">NO.</th>

            <th className="px-5 py-4 text-left text-lg">Operator Name</th>

            <th className="px-5 py-4 text-left text-lg">Operator Code</th>

            <th className="px-5 py-4 text-left text-lg">Status</th>

            {/* <th className="px-5 py-4 text-center text-lg">
              Actions
            </th> */}
          </tr>
        </thead>
        
        <tbody>
          {operators.map((operator, index) => (
            <tr key={operator.id} className="border-t">
              <td className="px-5 py-4">{index + 1}</td>

              <td className="px-5 py-4">{operator.operatorName}</td>

              <td className="px-5 py-4">{operator.employeeCode}</td>

              <td className="px-5 py-4">
                {operator.isActive ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    Active
                  </span>
                ) : (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                    Inactive
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OperatorTable;
