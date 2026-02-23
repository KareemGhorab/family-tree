import { requireAuth, requireTreeEditor } from "@/lib/auth-guard";
import { errorResponse, jsonResponse, notDeleted } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;

    const { id } = await context.params;

    const photo = await prisma.photo.findFirst({
      where: { id, ...notDeleted },
      include: { familyNode: { select: { familyTreeId: true } } },
    });
    if (!photo) {
      return errorResponse("Photo not found", 404);
    }

    const editorError = await requireTreeEditor(
      authResult.user.id,
      photo.familyNode.familyTreeId
    );
    if (editorError) return editorError;

    await prisma.photo.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return jsonResponse({ message: "Photo deleted" });
  } catch (error) {
    console.error("DELETE /api/photo/[id] error:", error);
    return errorResponse("Failed to delete photo", 500);
  }
}
