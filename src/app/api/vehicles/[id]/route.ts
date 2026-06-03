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
  const { plateNumber, type, brand, isActive } = await request.json()

  if (plateNumber !== undefined && !plateNumber) {
    return NextResponse.json({ error: "plateNumber is required" }, { status: 400 })
  }
  if (type !== undefined && !type) {
    return NextResponse.json({ error: "type is required" }, { status: 400 })
  }

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      ...(plateNumber !== undefined && { plateNumber }),
      ...(type !== undefined && { type }),
      ...(brand !== undefined && { brand: brand || null }),
      ...(isActive !== undefined && { isActive }),
    },
  })

  return NextResponse.json(vehicle)
}
