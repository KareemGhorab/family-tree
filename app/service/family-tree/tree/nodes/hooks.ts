"use client";

import { api } from "@/app/service/api";
import { queryKeys, type FamilyNodeFlat } from "@/app/service/types";
import { useQuery } from "@tanstack/react-query";

export type FamilyTreeNodesFilters = {
  gender?: "M" | "F";
  search?: string;
};

/** GET /api/family-tree/[id]/nodes — flat list of nodes for a tree, with optional filters */
export function useFamilyTreeNodes(
  treeId: string | null,
  filters?: FamilyTreeNodesFilters
) {
  return useQuery({
    queryKey: queryKeys.familyTree.nodes(treeId ?? "", filters),
    queryFn: () => {
      const base = `/api/family-tree/${treeId}/nodes`;
      const params = new URLSearchParams();
      if (filters?.gender) params.set("gender", filters.gender);
      if (filters?.search?.trim()) params.set("search", filters.search.trim());
      const qs = params.toString();
      const url = qs ? `${base}?${qs}` : base;
      return api.get<FamilyNodeFlat[]>(url).then((r) => r.data);
    },
    enabled: !!treeId,
  });
}
