import { useState } from "react";

import {
  CreateOperatorPayload,
  Operator,
  UpdateOperatorPayload,
} from "../types/operator";
import {
  getOperators,
  createOperator as createOperatorApi,
  updateOperator as updateOperatorApi,
  deleteOperator as deleteOperatorApi,
} from "../services/operator.service";

export const useOperators = () => {
  // ======================================================
  // State
  // ======================================================

  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(
    null,
  );

  const [loading, setLoading] = useState(false);

  const fetchOperators = async () => {
    try {
      setLoading(true);

      const response = await getOperators();

      setOperators(response.data);
    } finally {
      setLoading(false);
    }
  };
  const createOperator = async (data: CreateOperatorPayload) => {
    setLoading(true);

    try {
      await createOperatorApi(data);

      await fetchOperators();
    } finally {
      setLoading(false);
    }
  };

  const updateOperator = async (id: string, data: UpdateOperatorPayload) => {
    setLoading(true);

    try {
      await updateOperatorApi(id, data);

      await fetchOperators();
    } finally {
      setLoading(false);
    }
  };

  const deleteOperator = async (id: string) => {
    setLoading(true);

    try {
      await deleteOperatorApi(id);

      await fetchOperators();
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // Return
  // ======================================================

  return {
    operators,
    setOperators,

    selectedOperator,
    setSelectedOperator,

    loading,
    setLoading,

    fetchOperators,

    createOperator,

    updateOperator,

    deleteOperator,
  };
};
