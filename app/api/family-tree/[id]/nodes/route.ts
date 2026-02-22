import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { notDeleted, jsonResponse, errorResponse } from "@/lib/helpers";

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
      include: { photos: { where: notDeleted } },
      orderBy: { birthOrder: "asc" },
    });

    const result = nodes.map(({ deletedAt, photos, ...rest }) => ({
      ...rest,
      photos: photos.map(({ deletedAt: _d, ...p }) => p),
    }));

    return jsonResponse(result);
  } catch (error) {
    console.error("GET /api/family-tree/[id]/nodes error:", error);
    return errorResponse("Failed to fetch nodes", 500);
  }
}
