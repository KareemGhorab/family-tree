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
    const userId = authResult.user.id;

    const tree = await prisma.familyTree.findFirst({
      where: { id, ...notDeleted },
    });
    if (!tree) {
      return errorResponse("Family tree not found", 404);
    }

    if (tree.ownerId === userId) {
      return jsonResponse({ role: "EDITOR" });
    }

    const member = await prisma.familyTreeMember.findFirst({
      where: { userId, familyTreeId: id, ...notDeleted },
    });

    if (!member) {
      return jsonResponse({ role: "NONE" });
    }

    return jsonResponse({ role: member.role });
  } catch (error) {
    console.error("GET /api/family-tree/[id]/role error:", error);
    return errorResponse("Failed to fetch role", 500);
  }
}
