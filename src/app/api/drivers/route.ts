import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { name, email, phone } = await request.json()

  if (!name || !email) {
    return NextResponse.json({ error: "name and email are required" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "อีเมลนี้มีในระบบแล้ว" }, { status: 409 })
  }

  const driver = await prisma.user.create({
    data: { name, email, phone: phone || null, role: "DRIVER" },
  })

  return NextResponse.json(driver, { status: 201 })
}
