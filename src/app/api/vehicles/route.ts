import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { plateNumber, type, brand } = await request.json()

  if (!plateNumber || !type) {
    return NextResponse.json({ error: "plateNumber and type are required" }, { status: 400 })
  }

  const existing = await prisma.vehicle.findUnique({ where: { plateNumber } })
  if (existing) {
    return NextResponse.json({ error: "ทะเบียนรถนี้มีในระบบแล้ว" }, { status: 409 })
  }

  const vehicle = await prisma.vehicle.create({
    data: { plateNumber, type, brand: brand || null },
  })

  return NextResponse.json(vehicle, { status: 201 })
}
