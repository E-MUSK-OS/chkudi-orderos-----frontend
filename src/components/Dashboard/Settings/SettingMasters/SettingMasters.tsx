"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import SettingMastersHeader from "./components/SettingMastersHeader";
import FieldGroupsPanel from "./components/FieldGroupsPanel";
import GroupValuesPanel from "./components/GroupValuesPanel";
import AddEditOptionModal from "./components/AddEditOptionModal";
import AddGroupModal from "./components/AddGroupModal";
import DeleteOptionModal from "./components/DeleteOptionModal";
import {
  useFieldGroups,
  useFieldOptions,
  useCreateOption,
  useUpdateOption,
  useToggleOptionActive,
  useDeleteOption,
  useSettingMastersSync,
} from "./hooks/useSettingMasters";
import { FieldGroup, SettingOptionItem } from "./types/settingMasters.types";
import { INITIAL_FIELD_GROUPS, humanizeFieldKey } from "./constants/settingMasters.constants";
import { toast } from "sonner";

export default function SettingMasters() {
  useSettingMastersSync();
  const { data: groupsData, isLoading: isLoadingGroups } = useFieldGroups();
  const rawGroups = groupsData || INITIAL_FIELD_GROUPS;
  const groups = React.useMemo(() => {
    return rawGroups
      .filter(
        (g) =>
          g.field.toLowerCase() !== "subcategory" &&
          g.field.toLowerCase() !== "productsubcategory"
      )
      .slice()
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }))
      .map((g, idx) => ({ ...g, no: idx + 1 }));
  }, [rawGroups]);

  // Selected Group state (defaults to "color" matching reference screenshot)
  const [selectedGroup, setSelectedGroup] = useState<FieldGroup>(() => {
    const colorGroup = INITIAL_FIELD_GROUPS.find((g) => g.field === "color");
    return colorGroup || INITIAL_FIELD_GROUPS[0];
  });

  // When fresh groups load, sync active group reference
  useEffect(() => {
    if (groups && groups.length > 0) {
      setSelectedGroup((prev) => {
        const found = groups.find(
          (g) => g.field.toLowerCase() === prev?.field?.toLowerCase()
        );
        return found || groups[0];
      });
    }
  }, [groups]);

  // Options query for the currently active field group
  const { data: optionsData, isLoading: isLoadingOptions } = useFieldOptions(
    selectedGroup?.field || "color"
  );
  const options = optionsData || [];

  // Real-time map of option counts per field key, so field group count always matches values count
  const [liveOptionCounts, setLiveOptionCounts] = useState<Record<string, { total: number; active: number }>>({});

  useEffect(() => {
    if (selectedGroup?.field && optionsData !== undefined) {
      const key = selectedGroup.field.toLowerCase();
      const total = optionsData.length;
      const active = optionsData.filter((o) => o.isActive !== false).length;
      setLiveOptionCounts((prev) => {
        if (prev[key]?.total === total && prev[key]?.active === active) return prev;
        return { ...prev, [key]: { total, active } };
      });
    }
  }, [selectedGroup?.field, optionsData]);

  const liveGroups = React.useMemo(() => {
    return groups.map((g) => {
      const key = g.field.toLowerCase();
      const live = liveOptionCounts[key];
      if (live !== undefined) {
        return {
          ...g,
          totalCount: live.total,
          activeCount: live.active,
        };
      }
      return g;
    });
  }, [groups, liveOptionCounts]);

  // Mutations
  const createOptionMutation = useCreateOption();
  const updateOptionMutation = useUpdateOption();
  const toggleOptionActiveMutation = useToggleOptionActive();
  const deleteOptionMutation = useDeleteOption();

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<SettingOptionItem | null>(null);

  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingOption, setDeletingOption] = useState<SettingOptionItem | null>(null);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingOption(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (option: SettingOptionItem) => {
    setEditingOption(option);
    setIsAddEditModalOpen(true);
  };

  const handleOpenDeleteModal = (option: SettingOptionItem) => {
    setDeletingOption(option);
    setIsDeleteModalOpen(true);
  };

  const handleSaveOption = async (data: {
    value: string;
    label: string;
    isActive: boolean;
  }) => {
    if (!selectedGroup) return;

    if (editingOption) {
      await updateOptionMutation.mutateAsync({
        id: editingOption.id,
        payload: {
          field: selectedGroup.field,
          value: data.value,
          label: data.label,
          isActive: data.isActive,
          oldValue: editingOption.value,
          oldLabel: editingOption.label,
        },
      });
    } else {
      await createOptionMutation.mutateAsync({
        field: selectedGroup.field,
        value: data.value,
        label: data.label,
      });
    }
    setIsAddEditModalOpen(false);
    setEditingOption(null);
  };

  const handleToggleActive = (option: SettingOptionItem, nextActive: boolean) => {
    if (!selectedGroup) return;
    toggleOptionActiveMutation.mutate({
      id: option.id,
      field: selectedGroup.field,
      value: option.value,
      isActive: nextActive,
    });
  };

  const handleConfirmDelete = async () => {
    if (!selectedGroup || !deletingOption) return;
    await deleteOptionMutation.mutateAsync({
      id: deletingOption.id,
      field: selectedGroup.field,
      value: deletingOption.value,
      label: deletingOption.label,
    });
    setIsDeleteModalOpen(false);
    setDeletingOption(null);
  };

  const handleCreateGroup = async (groupName: string, initialValue?: string) => {
    const rawKey = groupName
      .trim()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^./, (chr) => chr.toLowerCase());

    const groupLabel = humanizeFieldKey(groupName.trim());
    const effectiveInitialValue = initialValue?.trim() || groupLabel;

    const newGroup: FieldGroup = {
      id: rawKey,
      no: groups.length + 1,
      field: rawKey,
      label: groupLabel,
      totalCount: 1,
      activeCount: 1,
    };

    // Always persist first option so the group is recorded in DB and visible on reload
    await createOptionMutation.mutateAsync({
      field: rawKey,
      value: effectiveInitialValue,
      label: effectiveInitialValue,
    });

    setSelectedGroup(newGroup);
    setIsAddGroupModalOpen(false);
    toast.success(`Group "${newGroup.label}" created`);
  };

  return (
    <DashboardLayout title="Setting Masters">
      <div className="space-y-4 sm:space-y-5 w-full pb-16">
        {/* Header */}
        <SettingMastersHeader
          activeGroupName={selectedGroup?.label}
          totalGroupsCount={groups.length}
          totalOptionsCount={options.length}
        />

        {/* Two-Panel Layout matching user reference image */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 items-start w-full">
          {/* Left Panel: Values for selected group - expanded width */}
          <div className="flex-1 w-full min-w-0 h-[680px]">
            <GroupValuesPanel
              selectedGroup={selectedGroup}
              options={options}
              isLoading={isLoadingOptions}
              onOpenAddModal={handleOpenAddModal}
              onOpenEditModal={handleOpenEditModal}
              onOpenDeleteModal={handleOpenDeleteModal}
              onToggleActive={handleToggleActive}
              isToggling={toggleOptionActiveMutation.isPending}
            />
          </div>

          {/* Right Panel: Field Groups - compact width */}
          <div className="w-full lg:w-[320px] xl:w-[350px] shrink-0 h-[680px]">
            <FieldGroupsPanel
              groups={liveGroups}
              selectedGroup={selectedGroup}
              onSelectGroup={(g) => setSelectedGroup(g)}
              onOpenAddGroupModal={() => setIsAddGroupModalOpen(true)}
              isLoading={isLoadingGroups}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddEditOptionModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setEditingOption(null);
        }}
        selectedGroup={selectedGroup}
        editingOption={editingOption}
        onSave={handleSaveOption}
        isSaving={createOptionMutation.isPending || updateOptionMutation.isPending}
      />

      <AddGroupModal
        isOpen={isAddGroupModalOpen}
        onClose={() => setIsAddGroupModalOpen(false)}
        onCreateGroup={handleCreateGroup}
        isCreating={createOptionMutation.isPending}
      />

      <DeleteOptionModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingOption(null);
        }}
        selectedGroup={selectedGroup}
        deletingOption={deletingOption}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteOptionMutation.isPending}
      />
    </DashboardLayout>
  );
}

