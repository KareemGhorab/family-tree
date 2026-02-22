import { errorResponse, jsonResponse, notDeleted, parseBody } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";
import { updateNodeSchema } from "@/lib/validations";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const node = await prisma.familyNode.findFirst({
      where: { id, ...notDeleted },
      include: {
        photos: { where: notDeleted },
        mother: { select: { id: true, firstName: true, lastName: true } },
        father: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!node) {
      return errorResponse("Family node not found", 404);
    }

    const { deletedAt, photos, ...rest } = node;
    return jsonResponse({
      ...rest,
      photos: photos.map(({ deletedAt: _d, ...p }) => p),
    });
  } catch (error) {
    console.error("GET /api/family-node/[id] error:", error);
    return errorResponse("Failed to fetch family node", 500);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await prisma.familyNode.findFirst({
      where: { id, ...notDeleted },
    });
    if (!existing) {
      return errorResponse("Family node not found", 404);
    }

    const result = await parseBody(request, updateNodeSchema);
    if (result.error) return result.error;
    const data = result.data;

    if (data.motherId) {
      const mother = await prisma.familyNode.findFirst({
        where: {
          id: data.motherId,
          familyTreeId: existing.familyTreeId,
          ...notDeleted,
        },
      });
      if (!mother) {
        return errorResponse(
          "Mother not found or does not belong to this tree",
          404
        );
      }
    }

    if (data.fatherId) {
      const father = await prisma.familyNode.findFirst({
        where: {
          id: data.fatherId,
          familyTreeId: existing.familyTreeId,
          ...notDeleted,
        },
      });
      if (!father) {
        return errorResponse(
          "Father not found or does not belong to this tree",
          404
        );
      }
    }

    const updated = await prisma.familyNode.update({
      where: { id },
      data,
      include: {
        photos: { where: notDeleted },
        mother: { select: { id: true, firstName: true, lastName: true } },
        father: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const { deletedAt, photos, ...rest } = updated;
    return jsonResponse({
      ...rest,
      photos: photos.map(({ deletedAt: _d, ...p }) => p),
    });
  } catch (error) {
    console.error("PATCH /api/family-node/[id] error:", error);
    return errorResponse("Failed to update family node", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await prisma.familyNode.findFirst({
      where: { id, ...notDeleted },
    });
    if (!existing) {
      return errorResponse("Family node not found", 404);
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.photo.updateMany({
        where: { familyNodeId: id, ...notDeleted },
        data: { deletedAt: now },
      }),
      prisma.familyNode.update({
        where: { id },
        data: { deletedAt: now },
      }),
    ]);

    return jsonResponse({ message: "Family node deleted" });
  } catch (error) {
    console.error("DELETE /api/family-node/[id] error:", error);
    return errorResponse("Failed to delete family node", 500);
  }
}
