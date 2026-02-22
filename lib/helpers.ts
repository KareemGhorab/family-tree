import { NextRequest, NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";

export const notDeleted = { deletedAt: null } as const;

export function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function parseBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T; error?: never } | { data?: never; error: NextResponse }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data };
  } catch (e) {
    if (e instanceof ZodError) {
      return {
        error: NextResponse.json(
          { error: "Validation failed", details: e.flatten().fieldErrors },
          { status: 400 }
        ),
      };
    }
    return { error: errorResponse("Invalid request body") };
  }
}
