"use client";

import { api } from "@/app/service/api";
import { queryKeys, type FamilyNodeFlat } from "@/app/service/types";
import { nowIso, toIsoString } from "@/lib/date";
import type { CreateNode } from "@/lib/validations";
import {
    useMutation,
    useQueryClient,
    type UseMutationOptions,
} from "@tanstack/react-query";
import moment from "moment";

type CreateNodeResponse = FamilyNodeFlat;

/** POST /api/family-node — create a family node (optimistic) */
export function useCreateFamilyNode(
  options?: UseMutationOptions<
    CreateNodeResponse,
    Error,
    CreateNode,
    { previousNodes: FamilyNodeFlat[] | undefined }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateNode) =>
      api
        .post<CreateNodeResponse>("/api/family-node", body)
        .then((r) => r.data),
    onMutate: async (variables) => {
      const nodesKey = queryKeys.familyTree.nodes(variables.familyTreeId);
      await queryClient.cancelQueries({ queryKey: nodesKey });
      const previousNodes = queryClient.getQueryData<FamilyNodeFlat[]>(nodesKey);
      const optimistic: FamilyNodeFlat = {
        id: `temp-${moment().valueOf()}`,
        familyTreeId: variables.familyTreeId,
        firstName: variables.firstName,
        lastName: variables.lastName ?? null,
        birthDate: toIsoString(variables.birthDate),
        deathDate: toIsoString(variables.deathDate),
        bio: variables.bio ?? null,
        birthOrder: variables.birthOrder ?? null,
        motherId: variables.motherId ?? null,
        fatherId: variables.fatherId ?? null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        photos: [],
      };
      queryClient.setQueryData<FamilyNodeFlat[]>(nodesKey, (old) =>
        old ? [...old, optimistic] : [optimistic]
      );
      return { previousNodes };
    },
    onError: (_err, variables, context) => {
      if (context?.previousNodes != null) {
        queryClient.setQueryData(
          queryKeys.familyTree.nodes(variables.familyTreeId),
          context.previousNodes
        );
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.familyTree.nodes(variables.familyTreeId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.familyTree.detail(variables.familyTreeId),
      });
    },
    ...options,
  });
}
