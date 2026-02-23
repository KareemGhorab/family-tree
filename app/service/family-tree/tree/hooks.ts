"use client";

import { api } from "@/app/service/api";
import {
    queryKeys,
    type FamilyTree,
    type FamilyTreeWithRoots,
    type TreeRole,
} from "@/app/service/types";
import { nowIso } from "@/lib/date";
import type { UpdateTree } from "@/lib/validations";
import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationOptions,
} from "@tanstack/react-query";

/** GET /api/family-tree/[id]/role — current user's role on this tree */
export function useTreeRole(treeId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.familyTree.detail(treeId ?? ""), "role"] as const,
    queryFn: () =>
      api.get<TreeRole>(`/api/family-tree/${treeId}/role`).then((r) => r.data),
    enabled: !!treeId,
  });
}

/** GET /api/family-tree/[id] — get one tree with nested roots */
export function useFamilyTree(id: string | null) {
  return useQuery({
    queryKey: queryKeys.familyTree.detail(id ?? ""),
    queryFn: () =>
      api
        .get<FamilyTreeWithRoots>(`/api/family-tree/${id}`)
        .then((r) => r.data),
    enabled: !!id,
  });
}

/** PATCH /api/family-tree/[id] — update tree (optimistic) */
export function useUpdateFamilyTree(
  id: string | null,
  options?: UseMutationOptions<
    FamilyTree,
    Error,
    UpdateTree,
    { previous: FamilyTreeWithRoots | undefined }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateTree) =>
      api
        .patch<FamilyTree>(`/api/family-tree/${id}`, body)
        .then((r) => r.data),
    onMutate: async (variables) => {
      if (!id) return { previous: undefined };
      await queryClient.cancelQueries({
        queryKey: queryKeys.familyTree.detail(id),
      });
      const previous = queryClient.getQueryData<FamilyTreeWithRoots>(
        queryKeys.familyTree.detail(id)
      );
      queryClient.setQueryData<FamilyTreeWithRoots>(
        queryKeys.familyTree.detail(id),
        (old) =>
          old ? { ...old, name: variables.name, updatedAt: nowIso() } : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (id && context?.previous != null) {
        queryClient.setQueryData(
          queryKeys.familyTree.detail(id),
          context.previous
        );
      }
    },
    onSettled: () => {
      if (id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.familyTree.detail(id),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.familyTree.list() });
      }
    },
    ...options,
  });
}

/** DELETE /api/family-tree/[id] — soft delete tree (optimistic) */
export function useDeleteFamilyTree(
  id: string | null,
  options?: UseMutationOptions<
    { message: string },
    Error,
    void,
    {
      previousList: Array<{ id: string; name: string; ownerId: string }> | undefined;
      previousTree: FamilyTreeWithRoots | undefined;
    }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.delete<{ message: string }>(`/api/family-tree/${id}`).then((r) => r.data),
    onMutate: async () => {
      if (!id)
        return { previousList: undefined, previousTree: undefined };
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.familyTree.list() }),
        queryClient.cancelQueries({
          queryKey: queryKeys.familyTree.detail(id),
        }),
      ]);
      const previousList = queryClient.getQueryData<
        Array<{ id: string; name: string; ownerId: string }>
      >(queryKeys.familyTree.list());
      const previousTree = queryClient.getQueryData<FamilyTreeWithRoots>(
        queryKeys.familyTree.detail(id)
      );
      queryClient.setQueryData(
        queryKeys.familyTree.list(),
        (old: unknown) =>
          Array.isArray(old)
            ? (old as Array<{ id: string; name: string; ownerId: string }>).filter(
                (t: { id: string }) => t.id !== id
              )
            : []
      );
      queryClient.removeQueries({ queryKey: queryKeys.familyTree.detail(id) });
      return { previousList, previousTree };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousList != null) {
        queryClient.setQueryData(
          queryKeys.familyTree.list(),
          context.previousList
        );
      }
      if (id && context?.previousTree != null) {
        queryClient.setQueryData(
          queryKeys.familyTree.detail(id),
          context.previousTree
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.familyTree.list() });
      if (id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.familyTree.detail(id),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.familyTree.nodes(id),
        });
      }
    },
    ...options,
  });
}
