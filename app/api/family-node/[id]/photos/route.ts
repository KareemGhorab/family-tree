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

    const existingCount = await prisma.photo.count({
      where: { familyNodeId: id, ...notDeleted },
    });

    const photo = await prisma.photo.create({
      data: { familyNodeId: id, blobUrl, order: existingCount },
    });

    const { deletedAt, ...result } = photo;
    return jsonResponse(result, 201);
  } catch (error) {
    console.error("POST /api/family-node/[id]/photos error:", error);
    return errorResponse("Failed to add photo", 500);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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
    const photoIds = body?.photoIds;
    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return errorResponse("photoIds array is required", 400);
    }

    const nodePhotos = await prisma.photo.findMany({
      where: { familyNodeId: id, ...notDeleted },
      select: { id: true },
    });
    const validIds = new Set(nodePhotos.map((p) => p.id));
    const invalid = photoIds.find(
      (pid: unknown) => typeof pid !== "string" || !validIds.has(pid)
    );
    if (invalid !== undefined) {
      return errorResponse("Invalid or missing photo id in photoIds", 400);
    }
    if (photoIds.length !== validIds.size) {
      return errorResponse("photoIds must contain exactly all photos of this node", 400);
    }

    await prisma.$transaction(
      photoIds.map((photoId: string, index: number) =>
        prisma.photo.update({
          where: { id: photoId },
          data: { order: index },
        })
      )
    );

    const photos = await prisma.photo.findMany({
      where: { familyNodeId: id, ...notDeleted },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    const result = photos.map(({ deletedAt, ...p }) => p);
    return jsonResponse(result);
  } catch (error) {
    console.error("PATCH /api/family-node/[id]/photos error:", error);
    return errorResponse("Failed to reorder photos", 500);
  }
}
