"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { getToken } from "@/utils/auth";

import { sheetDraftService } from "../services/sheetDraft.service";

export const useSaveSheetDraft = () =>
  useMutation({
    mutationFn: (rows: any[]) => sheetDraftService.save({ rows }, getToken()),
  });

export const useSheetDraft = () =>
  useQuery({
    queryKey: ["sheet-draft"],

    queryFn: () => sheetDraftService.get(getToken()),
  });

export const useDeleteSheetDraft = () =>
  useMutation({
    mutationFn: () => sheetDraftService.delete(getToken()),
  });
