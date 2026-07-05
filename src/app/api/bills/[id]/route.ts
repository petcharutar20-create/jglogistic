import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const bill = await prisma.bill.findUnique({ where: { id } })
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.bill.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
