"use client";

import { api } from "@/app/service/api";
import {
    queryKeys,
    type FamilyTreeListItem
} from "@/app/service/types";
import { nowIso } from "@/lib/date";
import type { CreateTree } from "@/lib/validations";
import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationOptions,
} from "@tanstack/react-query";
import moment from "moment";

/** GET /api/family-tree — list all family trees */
export function useFamilyTrees() {
  return useQuery({
    queryKey: queryKeys.familyTree.list(),
    queryFn: () =>
      api.get<FamilyTreeListItem[]>("/api/family-tree").then((r) => r.data),
  });
}

type CreateTreeResponse = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

/** POST /api/family-tree — create a family tree (optimistic) */
export function useCreateFamilyTree(
  options?: UseMutationOptions<
    CreateTreeResponse,
    Error,
    CreateTree,
    { previous: FamilyTreeListItem[] | undefined }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateTree) =>
      api.post<CreateTreeResponse>("/api/family-tree", body).then((r) => r.data),
    onMutate: async (newTree) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.familyTree.list() });
      const previous = queryClient.getQueryData<FamilyTreeListItem[]>(
        queryKeys.familyTree.list()
      );
      queryClient.setQueryData<FamilyTreeListItem[]>(
        queryKeys.familyTree.list(),
        (old) => {
          const optimistic: FamilyTreeListItem = {
            id: `temp-${moment().valueOf()}`,
            name: newTree.name,
            ownerId: "",
            createdAt: nowIso(),
            updatedAt: nowIso(),
            owner: {
              id: "",
              name: null,
              email: "",
              image: null,
            },
          };
          return old ? [optimistic, ...old] : [optimistic];
        }
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous != null) {
        queryClient.setQueryData(
          queryKeys.familyTree.list(),
          context.previous
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.familyTree.list() });
    },
    ...options,
  });
}
