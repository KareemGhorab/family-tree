"use client";

import { api } from "@/app/service/api";
import { queryKeys, type TreeStatistics } from "@/app/service/types";
import { useQuery } from "@tanstack/react-query";

/** GET /api/family-tree/[id]/statistics — aggregated stats for a tree */
export function useTreeStatistics(treeId: string | null) {
  return useQuery({
    queryKey: queryKeys.familyTree.statistics(treeId ?? ""),
    queryFn: () =>
      api
        .get<TreeStatistics>(`/api/family-tree/${treeId}/statistics`)
        .then((r) => r.data),
    enabled: !!treeId,
  });
}
