import { requireAuth } from "@/lib/auth-guard";
import { errorResponse, jsonResponse, notDeleted } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;

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
