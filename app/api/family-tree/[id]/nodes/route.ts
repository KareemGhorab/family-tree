import { Prisma } from "@/app/generated/prisma/client";
import { errorResponse, jsonResponse, notDeleted } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const genderParam = searchParams.get("gender");
    const gender: "M" | "F" | undefined =
      genderParam === "M" || genderParam === "F" ? genderParam : undefined;
    const search = searchParams.get("search")?.trim();
    const hasSearch = search !== undefined && search.length > 0;

    const tree = await prisma.familyTree.findFirst({
      where: { id, ...notDeleted },
    });
    if (!tree) {
      return errorResponse("Family tree not found", 404);
    }

    const where: Prisma.FamilyNodeWhereInput = {
      familyTreeId: id,
      ...notDeleted,
    };
    if (gender != null) where.gender = gender;
    if (hasSearch)
      where.firstName = { contains: search!, mode: "insensitive" };

    const nodes = await prisma.familyNode.findMany({
      where,
      include: {
        photos: {
          where: notDeleted,
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        },
      },
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
