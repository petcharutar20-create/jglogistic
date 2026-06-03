import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const { name, phone } = await request.json()

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  const driver = await prisma.user.update({
    where: { id },
    data: { name, phone: phone || null },
  })

  return NextResponse.json(driver)
}
