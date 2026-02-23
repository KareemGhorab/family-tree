import { requireAuth, requireTreeEditor } from "@/lib/auth-guard";
import { errorResponse, jsonResponse, notDeleted, parseBody } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";
import { createNodeSchema } from "@/lib/validations";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;

    const result = await parseBody(request, createNodeSchema);
    if (result.error) return result.error;
    const { familyTreeId, firstName, lastName, birthDate, deathDate, bio, birthOrder, motherId, fatherId } = result.data;

    const editorError = await requireTreeEditor(authResult.user.id, familyTreeId);
    if (editorError) return editorError;

    if (motherId) {
      const mother = await prisma.familyNode.findFirst({
        where: { id: motherId, familyTreeId, ...notDeleted },
      });
      if (!mother) {
        return errorResponse(
          "Mother not found or does not belong to this tree",
          404
        );
      }
    }

    if (fatherId) {
      const father = await prisma.familyNode.findFirst({
        where: { id: fatherId, familyTreeId, ...notDeleted },
      });
      if (!father) {
        return errorResponse(
          "Father not found or does not belong to this tree",
          404
        );
      }
    }

    const node = await prisma.familyNode.create({
      data: {
        familyTreeId,
        firstName,
        lastName: lastName ?? null,
        birthDate: birthDate ?? null,
        deathDate: deathDate ?? null,
        bio: bio ?? null,
        birthOrder: birthOrder ?? null,
        motherId: motherId ?? null,
        fatherId: fatherId ?? null,
      },
      include: { photos: { where: notDeleted } },
    });

    const { deletedAt, ...nodeResult } = node;
    return jsonResponse(
      { ...nodeResult, photos: nodeResult.photos.map(({ deletedAt: _d, ...p }) => p) },
      201
    );
  } catch (error) {
    console.error("POST /api/family-node error:", error);
    return errorResponse("Failed to create family node", 500);
  }
}
