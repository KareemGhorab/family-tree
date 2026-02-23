import { notDeleted } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";

export async function getFamilyTreesForUser(userId: string) {
  return prisma.familyTree.findMany({
    where: {
      ...notDeleted,
      OR: [
        { ownerId: userId },
        { members: { some: { userId, ...notDeleted } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
