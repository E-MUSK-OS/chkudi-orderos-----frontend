"use client";

import React, { useEffect, useState } from "react";
import { Plus, Users } from "lucide-react";

import DashboardLayout from "../../../layout/DashboardLayout";
import { useOperators } from "./operator/hooks/useOperators";

import OperatorTable from "./operator/components/OperatorTable";
import OperatorModal from "./operator/components/OperatorModal";
import OperatorForm from "./operator/components/OperatorForm";
import DeleteOperatorModal from "./operator/components/DeleteOperatorModal";

import { Operator, UpdateOperatorPayload } from "./operator/types/operator";

const User = () => {
  const {
    operators,
    loading,
    fetchOperators,
    createOperator,
    updateOperator,
    deleteOperator,
  } = useOperators();

  const [openCreate, setOpenCreate] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);

  useEffect(() => {
    fetchOperators();
  }, []);

  const handleEdit = (operator: Operator) => {
    setSelectedOperator(operator);
    setOpenUpdate(true);
  };

  const handleDelete = (operator: Operator) => {
    setSelectedOperator(operator);
    setOpenDelete(true);
  };

  return (
    <DashboardLayout title="Operator">
      <div className="space-y-6">
        {/* Header Card (Matching Account / Amazon Analytics UI) */}
        <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Operators
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                Manage your operators
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto self-stretch md:self-center">
              <div
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#E8C16D] transition-all shadow-xs ring-2 ring-[#E8C16D]/30 w-full sm:w-auto min-h-[42px] sm:min-h-[44px]"
                title="Total Operators"
              >
                <Users className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
                <span>Total Operators: {operators.length} / 10</span>
              </div>

              <button
                type="button"
                onClick={() => setOpenCreate(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-4 sm:px-5 py-2.5 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#d4af5a] active:scale-[0.98] cursor-pointer w-full sm:w-auto min-h-[42px] sm:min-h-[44px]"
              >
                <Plus className="h-4 w-4" />
                <span>Add Operator</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <OperatorTable
          operators={operators}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Create Modal */}
        <OperatorModal
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          title="Create Operator"
        >
          <OperatorForm
            mode="create"
            loading={loading}
            onSubmit={async (data) => {
              await createOperator(data);
              setOpenCreate(false);
            }}
          />
        </OperatorModal>

        {/* Update Modal */}
        <OperatorModal
          open={openUpdate}
          onClose={() => {
            setOpenUpdate(false);
            setSelectedOperator(null);
          }}
          title="Update Operator"
        >
          <OperatorForm
            mode="update"
            operator={selectedOperator}
            loading={loading}
            onSubmit={async (data) => {
              if (!selectedOperator) return;
              await updateOperator(selectedOperator.id, data);
              setOpenUpdate(false);
              setSelectedOperator(null);
            }}
          />
        </OperatorModal>

        {/* Delete Modal */}
        <DeleteOperatorModal
          open={openDelete}
          loading={loading}
          operatorName={selectedOperator?.operatorName}
          onClose={() => {
            setOpenDelete(false);
            setSelectedOperator(null);
          }}
          onDelete={async () => {
            if (!selectedOperator) return;
            await deleteOperator(selectedOperator.id);
            setOpenDelete(false);
            setSelectedOperator(null);
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default User;
