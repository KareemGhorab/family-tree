import { auth } from "@/lib/auth";
import { errorResponse, notDeleted } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type AuthUser = { id: string; name?: string | null; email?: string | null; image?: string | null };

type AuthSuccess = { user: AuthUser; error?: never };
type AuthFailure = { user?: never; error: NextResponse };

export async function requireAuth(): Promise<AuthSuccess | AuthFailure> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: errorResponse("Unauthorized", 401) };
  }
  return { user: session.user as AuthUser };
}

export async function requireTreeEditor(
  userId: string,
  treeId: string
): Promise<NextResponse | null> {
  const tree = await prisma.familyTree.findFirst({
    where: { id: treeId, ...notDeleted },
  });
  if (!tree) return errorResponse("Family tree not found", 404);
  if (tree.ownerId === userId) return null;

  const member = await prisma.familyTreeMember.findFirst({
    where: { userId, familyTreeId: treeId, role: "EDITOR", ...notDeleted },
  });
  if (!member) return errorResponse("Forbidden", 403);
  return null;
}
