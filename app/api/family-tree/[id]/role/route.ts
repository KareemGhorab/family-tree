import { auth } from "@/lib/auth";
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

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return jsonResponse({ role: "VIEWER" });
    }

    if (tree.ownerId === userId) {
      return jsonResponse({ role: "EDITOR" });
    }

    const member = await prisma.familyTreeMember.findFirst({
      where: { userId, familyTreeId: id, ...notDeleted },
    });

    if (!member) {
      return jsonResponse({ role: "VIEWER" });
    }

    return jsonResponse({ role: member.role });
  } catch (error) {
    console.error("GET /api/family-tree/[id]/role error:", error);
    return errorResponse("Failed to fetch role", 500);
  }
}
