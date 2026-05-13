import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, unit, isActive } = body as { name: string; unit: string; isActive: boolean };
  if (!name?.trim() || !unit?.trim()) {
    return NextResponse.json({ error: "名称・単位は必須です" }, { status: 400 });
  }

  const updated = await prisma.pricingIndex.update({
    where: { id },
    data: { name: name.trim(), unit: unit.trim(), isActive },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const inUse = await prisma.contract.findFirst({
    where: { OR: [{ basePricingIndexId: id }, { premiumPricingIndexId: id }] },
  });
  if (inUse) {
    return NextResponse.json({ error: "この評価指標は成約に使用されているため削除できません" }, { status: 409 });
  }

  await prisma.pricingIndex.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
