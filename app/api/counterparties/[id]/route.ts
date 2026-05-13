import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, country } = body as { name: string; country?: string };
  if (!name?.trim()) {
    return NextResponse.json({ error: "取引先名は必須です" }, { status: 400 });
  }

  const updated = await prisma.counterparty.update({
    where: { id },
    data: { name: name.trim(), country: country?.trim() || null },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const hasContracts = await prisma.contract.findFirst({ where: { counterpartyId: id } });
  if (hasContracts) {
    return NextResponse.json({ error: "この取引先は成約に使用されているため削除できません" }, { status: 409 });
  }

  await prisma.counterparty.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
