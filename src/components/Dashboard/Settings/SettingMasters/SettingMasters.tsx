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
} from "./hooks/useSettingMasters";
import { FieldGroup, SettingOptionItem } from "./types/settingMasters.types";
import { INITIAL_FIELD_GROUPS, humanizeFieldKey } from "./constants/settingMasters.constants";
import { toast } from "sonner";

export default function SettingMasters() {
  const { data: groupsData, isLoading: isLoadingGroups } = useFieldGroups();
  const groups = groupsData || INITIAL_FIELD_GROUPS;

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
    });
    setIsDeleteModalOpen(false);
    setDeletingOption(null);
  };

  const handleCreateGroup = async (groupName: string, initialValue?: string) => {
    const rawKey = groupName
      .trim()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^./, (chr) => chr.toLowerCase());

    const newGroup: FieldGroup = {
      id: rawKey,
      no: groups.length + 1,
      field: rawKey,
      label: humanizeFieldKey(groupName.trim()),
      totalCount: initialValue ? 1 : 0,
      activeCount: initialValue ? 1 : 0,
    };

    if (initialValue) {
      await createOptionMutation.mutateAsync({
        field: rawKey,
        value: initialValue,
        label: initialValue,
      });
    }

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
          {/* Left Panel: Values for selected group (Columns: No, Value, Active, Actions, + Add) */}
          <div className="lg:col-span-7 h-[680px]">
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

          {/* Right Panel: Field Groups (Columns: No, Field Groups, Search, + Group) */}
          <div className="lg:col-span-5 h-[680px]">
            <FieldGroupsPanel
              groups={groups}
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

