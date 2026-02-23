import { requireAuth, requireTreeEditor } from "@/lib/auth-guard";
import { errorResponse, jsonResponse, notDeleted } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;

    const { id } = await context.params;

    const node = await prisma.familyNode.findFirst({
      where: { id, ...notDeleted },
    });
    if (!node) {
      return errorResponse("Family node not found", 404);
    }

    const editorError = await requireTreeEditor(
      authResult.user.id,
      node.familyTreeId
    );
    if (editorError) return editorError;

    const body = await request.json();
    const blobUrl = body?.blobUrl;
    if (!blobUrl || typeof blobUrl !== "string") {
      return errorResponse("blobUrl is required", 400);
    }

    const photo = await prisma.photo.create({
      data: { familyNodeId: id, blobUrl },
    });

    const { deletedAt, ...result } = photo;
    return jsonResponse(result, 201);
  } catch (error) {
    console.error("POST /api/family-node/[id]/photos error:", error);
    return errorResponse("Failed to add photo", 500);
  }
}
