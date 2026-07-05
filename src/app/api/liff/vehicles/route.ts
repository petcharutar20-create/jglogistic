import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lineUserId = searchParams.get("lineUserId")

  if (!lineUserId) {
    return NextResponse.json({ error: "lineUserId is required" }, { status: 400 })
  }

  const driver = await prisma.user.findUnique({ where: { lineUserId } })
  if (!driver) {
    return NextResponse.json({ error: "ไม่พบข้อมูลพนักงาน" }, { status: 404 })
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { isActive: true },
    select: { id: true, plateNumber: true, type: true, brand: true },
    orderBy: { plateNumber: "asc" },
  })

  return NextResponse.json(vehicles)
}
