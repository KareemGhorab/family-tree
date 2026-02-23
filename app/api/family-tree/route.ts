import { requireAuth } from "@/lib/auth-guard";
import { errorResponse, jsonResponse, notDeleted, parseBody } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";
import { createTreeSchema } from "@/lib/validations";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;

    const trees = await prisma.familyTree.findMany({
      where: notDeleted,
      include: {
        owner: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return jsonResponse(trees);
  } catch (error) {
    console.error("GET /api/family-tree error:", error);
    return errorResponse("Failed to fetch family trees", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const userId = authResult.user.id;

    const result = await parseBody(request, createTreeSchema);
    if (result.error) return result.error;
    const { name } = result.data;

    const tree = await prisma.$transaction(async (tx) => {
      const newTree = await tx.familyTree.create({
        data: { name, ownerId: userId },
      });
      await tx.familyTreeMember.create({
        data: {
          userId,
          familyTreeId: newTree.id,
          role: "EDITOR",
        },
      });
      return newTree;
    });

    return jsonResponse(tree, 201);
  } catch (error) {
    console.error("POST /api/family-tree error:", error);
    return errorResponse("Failed to create family tree", 500);
  }
}
