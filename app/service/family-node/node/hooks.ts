"use client";

import { api } from "@/app/service/api";
import {
    queryKeys,
    type FamilyNodeDetail,
    type FamilyNodeFlat,
    type Photo,
} from "@/app/service/types";
import { nowIso, toIsoString } from "@/lib/date";
import type { UpdateNode } from "@/lib/validations";
import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationOptions,
} from "@tanstack/react-query";

/** GET /api/family-node/[id] — get one node with mother/father and photos */
export function useFamilyNode(id: string | null) {
  return useQuery({
    queryKey: queryKeys.familyNode.detail(id ?? ""),
    queryFn: () =>
      api
        .get<FamilyNodeDetail>(`/api/family-node/${id}`)
        .then((r) => r.data),
    enabled: !!id,
  });
}

/** PATCH /api/family-node/[id] — update node (optimistic) */
export function useUpdateFamilyNode(
  id: string | null,
  options?: UseMutationOptions<
    FamilyNodeDetail,
    Error,
    UpdateNode,
    { previous: FamilyNodeDetail | undefined }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateNode) =>
      api
        .patch<FamilyNodeDetail>(`/api/family-node/${id}`, body)
        .then((r) => r.data),
    onMutate: async (variables) => {
      if (!id) return { previous: undefined };
      await queryClient.cancelQueries({
        queryKey: queryKeys.familyNode.detail(id),
      });
      const previous = queryClient.getQueryData<FamilyNodeDetail>(
        queryKeys.familyNode.detail(id)
      );
      queryClient.setQueryData<FamilyNodeDetail>(
        queryKeys.familyNode.detail(id),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            ...variables,
            updatedAt: nowIso(),
            birthDate:
              variables.birthDate !== undefined
                ? toIsoString(variables.birthDate)
                : old.birthDate,
            deathDate:
              variables.deathDate !== undefined
                ? toIsoString(variables.deathDate)
                : old.deathDate,
          } as FamilyNodeDetail;
        }
      );
      return { previous: previous ?? undefined };
    },
    onError: (_err, _vars, context) => {
      const prev = context?.previous;
      if (id && prev != null) {
        queryClient.setQueryData(queryKeys.familyNode.detail(id), prev);
      }
    },
    onSettled: (_data, _err, _vars, context) => {
      if (id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.familyNode.detail(id),
        });
      }
      const treeId = context?.previous?.familyTreeId;
      if (treeId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.familyTree.detail(treeId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.familyTree.nodes(treeId),
        });
      }
    },
    ...options,
  });
}

/** DELETE /api/family-node/[id] — soft delete node (optimistic) */
export function useDeleteFamilyNode(
  id: string | null,
  treeId: string | null,
  options?: UseMutationOptions<
    { message: string },
    Error,
    void,
    {
      previousNode: FamilyNodeDetail | undefined;
      previousNodes: FamilyNodeFlat[] | undefined;
    }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api
        .delete<{ message: string }>(`/api/family-node/${id}`)
        .then((r) => r.data),
    onMutate: async () => {
      if (!id) return { previousNode: undefined, previousNodes: undefined };
      const previousNode = queryClient.getQueryData<FamilyNodeDetail>(
        queryKeys.familyNode.detail(id)
      );
      let previousNodes: FamilyNodeFlat[] | undefined;
      if (treeId) {
        await queryClient.cancelQueries({
          queryKey: queryKeys.familyTree.nodes(treeId),
        });
        previousNodes = queryClient.getQueryData<FamilyNodeFlat[]>(
          queryKeys.familyTree.nodes(treeId)
        );
        queryClient.setQueryData<FamilyNodeFlat[]>(
          queryKeys.familyTree.nodes(treeId),
          (old) => (old ? old.filter((n) => n.id !== id) : [])
        );
      }
      queryClient.removeQueries({ queryKey: queryKeys.familyNode.detail(id) });
      return { previousNode, previousNodes };
    },
    onError: (_err, _vars, context) => {
      const prevNode = context?.previousNode;
      const prevNodes = context?.previousNodes;
      if (id && prevNode != null) {
        queryClient.setQueryData(queryKeys.familyNode.detail(id), prevNode);
      }
      if (treeId && prevNodes != null) {
        queryClient.setQueryData(
          queryKeys.familyTree.nodes(treeId),
          prevNodes
        );
      }
    },
    onSettled: () => {
      if (id) {
        queryClient.removeQueries({
          queryKey: queryKeys.familyNode.detail(id),
        });
      }
      if (treeId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.familyTree.detail(treeId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.familyTree.nodes(treeId),
        });
      }
    },
    ...options,
  });
}

/** POST /api/family-node/[id]/photos — add a photo to a node */
export function useAddPhoto(
  nodeId: string | null,
  treeId?: string | null
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blobUrl: string) =>
      api
        .post<Photo>(`/api/family-node/${nodeId}/photos`, { blobUrl })
        .then((r) => r.data),
    onSettled: () => {
      if (nodeId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.familyNode.detail(nodeId),
        });
      }
      if (treeId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.familyTree.nodes(treeId),
        });
      }
    },
  });
}

/** DELETE /api/photo/[id] — soft-delete a photo */
export function useDeletePhoto(nodeId: string | null, treeId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) =>
      api
        .delete<{ message: string }>(`/api/photo/${photoId}`)
        .then((r) => r.data),
    onSettled: () => {
      if (nodeId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.familyNode.detail(nodeId),
        });
      }
      if (treeId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.familyTree.nodes(treeId),
        });
      }
    },
  });
}
