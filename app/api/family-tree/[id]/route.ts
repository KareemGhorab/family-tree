import type { FamilyNode, Photo } from "@/app/generated/prisma/client";
import { errorResponse, jsonResponse, notDeleted, parseBody } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";
import { updateTreeSchema } from "@/lib/validations";
import { NextRequest } from "next/server";

type NodeWithChildren = Omit<FamilyNode, "deletedAt"> & {
  photos: Omit<Photo, "deletedAt">[];
  children: NodeWithChildren[];
};

function buildNestedTree(
  nodes: (FamilyNode & { photos: Photo[] })[]
): NodeWithChildren[] {
  const nodeMap = new Map<string, NodeWithChildren>();

  for (const node of nodes) {
    const { deletedAt, photos, ...rest } = node;
    nodeMap.set(node.id, {
      ...rest,
      photos: photos.map(({ deletedAt: _d, ...p }) => p),
      children: [],
    });
  }

  const childIds = new Set<string>();

  for (const node of nodes) {
    const current = nodeMap.get(node.id)!;

    if (node.motherId && nodeMap.has(node.motherId)) {
      nodeMap.get(node.motherId)!.children.push(current);
      childIds.add(node.id);
    }
    if (node.fatherId && nodeMap.has(node.fatherId)) {
      nodeMap.get(node.fatherId)!.children.push(current);
      childIds.add(node.id);
    }
  }

  const sortByBirthOrder = (a: NodeWithChildren, b: NodeWithChildren) => {
    if (a.birthOrder == null && b.birthOrder == null) return 0;
    if (a.birthOrder == null) return 1;
    if (b.birthOrder == null) return -1;
    return a.birthOrder - b.birthOrder;
  };

  for (const node of nodeMap.values()) {
    node.children.sort(sortByBirthOrder);
  }

  const roots = nodes
    .filter((n) => !childIds.has(n.id))
    .map((n) => nodeMap.get(n.id)!)
    .sort(sortByBirthOrder);

  return roots;
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const tree = await prisma.familyTree.findFirst({
      where: { id, ...notDeleted },
      include: {
        owner: { select: { id: true, name: true, email: true, image: true } },
      },
    });
    if (!tree) {
      return errorResponse("Family tree not found", 404);
    }

    const nodes = await prisma.familyNode.findMany({
      where: { familyTreeId: id, ...notDeleted },
      include: { photos: { where: notDeleted } },
      orderBy: { birthOrder: "asc" },
    });

    const roots = buildNestedTree(nodes);

    const { deletedAt, ...treeData } = tree;
    return jsonResponse({ ...treeData, roots });
  } catch (error) {
    console.error("GET /api/family-tree/[id] error:", error);
    return errorResponse("Failed to fetch family tree", 500);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await prisma.familyTree.findFirst({
      where: { id, ...notDeleted },
    });
    if (!existing) {
      return errorResponse("Family tree not found", 404);
    }

    const result = await parseBody(request, updateTreeSchema);
    if (result.error) return result.error;
    const { name } = result.data;

    const updated = await prisma.familyTree.update({
      where: { id },
      data: { name },
    });

    const { deletedAt, ...treeData } = updated;
    return jsonResponse(treeData);
  } catch (error) {
    console.error("PATCH /api/family-tree/[id] error:", error);
    return errorResponse("Failed to update family tree", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await prisma.familyTree.findFirst({
      where: { id, ...notDeleted },
    });
    if (!existing) {
      return errorResponse("Family tree not found", 404);
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.photo.updateMany({
        where: {
          familyNode: { familyTreeId: id },
          ...notDeleted,
        },
        data: { deletedAt: now },
      }),
      prisma.familyNode.updateMany({
        where: { familyTreeId: id, ...notDeleted },
        data: { deletedAt: now },
      }),
      prisma.familyTreeMember.updateMany({
        where: { familyTreeId: id, ...notDeleted },
        data: { deletedAt: now },
      }),
      prisma.familyTree.update({
        where: { id },
        data: { deletedAt: now },
      }),
    ]);

    return jsonResponse({ message: "Family tree deleted" });
  } catch (error) {
    console.error("DELETE /api/family-tree/[id] error:", error);
    return errorResponse("Failed to delete family tree", 500);
  }
}
