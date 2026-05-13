import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await prisma.counterparty.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, country } = body as { name: string; country?: string };
  if (!name?.trim()) {
    return NextResponse.json({ error: "取引先名は必須です" }, { status: 400 });
  }

  const existing = await prisma.counterparty.findUnique({ where: { name: name.trim() } });
  if (existing) {
    return NextResponse.json({ error: "同名の取引先が既に存在します" }, { status: 409 });
  }

  const created = await prisma.counterparty.create({
    data: { name: name.trim(), country: country?.trim() || null },
  });
  return NextResponse.json(created, { status: 201 });
}
