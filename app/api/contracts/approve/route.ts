import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids } = await req.json() as { ids: string[] };
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "承認対象のIDが指定されていません" }, { status: 400 });
  }

  const result = await prisma.contract.updateMany({
    where: { id: { in: ids }, status: "DRAFT" },
    data: { status: "CONFIRMED" },
  });

  return NextResponse.json({ approved: result.count });
}
