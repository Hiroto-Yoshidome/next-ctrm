import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await prisma.pricingIndex.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { code, name, unit } = body as { code: string; name: string; unit: string };
  if (!code?.trim() || !name?.trim() || !unit?.trim()) {
    return NextResponse.json({ error: "コード・名称・単位は必須です" }, { status: 400 });
  }

  const existing = await prisma.pricingIndex.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (existing) {
    return NextResponse.json({ error: "同一コードの評価指標が既に存在します" }, { status: 409 });
  }

  const created = await prisma.pricingIndex.create({
    data: { code: code.trim().toUpperCase(), name: name.trim(), unit: unit.trim() },
  });
  return NextResponse.json(created, { status: 201 });
}
