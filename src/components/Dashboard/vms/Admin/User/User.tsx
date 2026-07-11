"use client";

import React, { useEffect, useState } from "react";

import DashboardLayout from "../../../layout/DashboardLayout";

import Button from "@/components/ui/Button";

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

  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(
    null,
  );

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Operators</h2>

            <p className="text-sm text-slate-500">Manage your operators</p>
          </div>

          <Button fullWidth={false} onClick={() => setOpenCreate(true)}>
            + Add Operator
          </Button>
        </div>

        <div className="border bg-[#0A0E1A] p-4">
          <p className="text-lg text-[#E8C16D]">Total Operators</p>

          <h3 className="mt-1 text-2xl font-bold text-white">
            {operators.length} / 5
          </h3>
        </div>

        <OperatorTable
          operators={operators}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

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
