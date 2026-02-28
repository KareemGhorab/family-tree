import type { TreeStatistics } from "@/app/service/types";
import { errorResponse, jsonResponse, notDeleted } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const tree = await prisma.familyTree.findFirst({
      where: { id, ...notDeleted },
    });
    if (!tree) {
      return errorResponse("Family tree not found", 404);
    }

    const nodes = await prisma.familyNode.findMany({
      where: { familyTreeId: id, ...notDeleted },
      select: {
        id: true,
        gender: true,
        motherId: true,
        fatherId: true,
        birthDate: true,
        deathDate: true,
        photos: {
          where: notDeleted,
          take: 1,
        },
      },
    });

    const totalNodes = nodes.length;

    const genderRatio = {
      male: nodes.filter((n) => n.gender === "M").length,
      female: nodes.filter((n) => n.gender === "F").length,
      unknown: nodes.filter((n) => n.gender == null).length,
    };

    const withPhotos = nodes.filter((n) => n.photos.length > 0).length;
    const photoCoverage = {
      withPhotos,
      withoutPhotos: totalNodes - withPhotos,
    };

    const childCountByNodeId = new Map<string, number>();
    for (const node of nodes) {
      childCountByNodeId.set(node.id, 0);
    }
    for (const node of nodes) {
      if (node.motherId && childCountByNodeId.has(node.motherId)) {
        childCountByNodeId.set(
          node.motherId,
          (childCountByNodeId.get(node.motherId) ?? 0) + 1
        );
      }
      if (node.fatherId && node.fatherId !== node.motherId) {
        if (childCountByNodeId.has(node.fatherId)) {
          childCountByNodeId.set(
            node.fatherId,
            (childCountByNodeId.get(node.fatherId) ?? 0) + 1
          );
        }
      }
    }

    const childCounts = [...childCountByNodeId.values()];
    const sumChildren = childCounts.reduce((a, b) => a + b, 0);
    const avgChildrenPerPerson =
      totalNodes > 0 ? sumChildren / totalNodes : 0;
    const maxChildren = childCounts.length > 0 ? Math.max(...childCounts) : 0;

    const rootCount = nodes.filter(
      (n) => n.motherId == null && n.fatherId == null
    ).length;

    const nodeIds = new Set(nodes.map((n) => n.id));
    const childToParents = new Map<string, { motherId: string | null; fatherId: string | null }>();
    for (const n of nodes) {
      childToParents.set(n.id, {
        motherId: n.motherId,
        fatherId: n.fatherId,
      });
    }

    const generationByNodeId = new Map<string, number>();
    const roots = nodes.filter((n) => n.motherId == null && n.fatherId == null);
    for (const r of roots) {
      generationByNodeId.set(r.id, 0);
    }
    let changed = true;
    while (changed) {
      changed = false;
      for (const node of nodes) {
        if (generationByNodeId.has(node.id)) continue;
        const motherGen = node.motherId
          ? generationByNodeId.get(node.motherId)
          : undefined;
        const fatherGen = node.fatherId
          ? generationByNodeId.get(node.fatherId)
          : undefined;
        const parentGen =
          motherGen != null && fatherGen != null
            ? Math.max(motherGen, fatherGen)
            : motherGen ?? fatherGen;
        if (parentGen != null) {
          generationByNodeId.set(node.id, parentGen + 1);
          changed = true;
        }
      }
    }
    for (const node of nodes) {
      if (!generationByNodeId.has(node.id)) {
        generationByNodeId.set(node.id, 0);
      }
    }

    const treeDepth =
      generationByNodeId.size > 0
        ? Math.max(...generationByNodeId.values())
        : 0;

    const generationCounts = new Map<number, number>();
    for (const gen of generationByNodeId.values()) {
      generationCounts.set(gen, (generationCounts.get(gen) ?? 0) + 1);
    }
    const generations = [...generationCounts.entries()]
      .sort(([a], [b]) => a - b)
      .map(([generation, count]) => ({ generation, count }));

    const decadeCounts = new Map<string, number>();
    for (const node of nodes) {
      if (node.birthDate) {
        const year = node.birthDate.getFullYear();
        const decade = `${Math.floor(year / 10) * 10}`;
        decadeCounts.set(decade, (decadeCounts.get(decade) ?? 0) + 1);
      }
    }
    const birthDecades = [...decadeCounts.entries()]
      .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
      .map(([decade, count]) => ({ decade, count }));

    const living = nodes.filter((n) => n.deathDate == null).length;
    const deceased = nodes.filter((n) => n.deathDate != null).length;
    const livingVsDeceased = { living, deceased };

    const siblingCountByNodeId = new Map<string, number>();
    const parentKey = (m: string | null, f: string | null) =>
      `${m ?? ""}_${f ?? ""}`;
    const nodesByParentKey = new Map<string, string[]>();
    for (const node of nodes) {
      const key = parentKey(node.motherId, node.fatherId);
      if (!nodesByParentKey.has(key)) {
        nodesByParentKey.set(key, []);
      }
      nodesByParentKey.get(key)!.push(node.id);
    }
    for (const node of nodes) {
      const key = parentKey(node.motherId, node.fatherId);
      const siblings = nodesByParentKey.get(key) ?? [];
      siblingCountByNodeId.set(node.id, Math.max(0, siblings.length - 1));
    }

    const siblingsDistMap = new Map<number, number>();
    for (const count of siblingCountByNodeId.values()) {
      const bucket = count >= 3 ? 3 : count;
      siblingsDistMap.set(bucket, (siblingsDistMap.get(bucket) ?? 0) + 1);
    }
    const siblingsDistribution = [0, 1, 2, 3].map((count) => ({
      count,
      numberOfPeople: siblingsDistMap.get(count) ?? 0,
    }));

    const missingGenderCount = nodes.filter((n) => n.gender == null).length;
    const missingParentsCount = nodes.filter(
      (n) => n.motherId == null && n.fatherId == null
    ).length;

    const stats: TreeStatistics = {
      totalNodes,
      genderRatio,
      photoCoverage,
      avgChildrenPerPerson,
      maxChildren,
      rootCount,
      treeDepth,
      generations,
      birthDecades,
      livingVsDeceased,
      siblingsDistribution,
      missingGenderCount,
      missingParentsCount,
    };

    return jsonResponse(stats);
  } catch (error) {
    console.error("GET /api/family-tree/[id]/statistics error:", error);
    return errorResponse("Failed to fetch statistics", 500);
  }
}
