"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/app/service/api";
import { queryKeys, type FamilyNodeFlat } from "@/app/service/types";

/** GET /api/family-tree/[id]/nodes — flat list of nodes for a tree */
export function useFamilyTreeNodes(treeId: string | null) {
  return useQuery({
    queryKey: queryKeys.familyTree.nodes(treeId ?? ""),
    queryFn: () =>
      api
        .get<FamilyNodeFlat[]>(`/api/family-tree/${treeId}/nodes`)
        .then((r) => r.data),
    enabled: !!treeId,
  });
}
