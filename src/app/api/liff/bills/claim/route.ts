import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// คนขับ "รับ" บิลว่างหลายใบพร้อมกัน — ตั้ง driverId เป็นตัวเอง
export async function POST(request: Request) {
  const { lineUserId, billIds } = await request.json() as {
    lineUserId?: string
    billIds?: string[]
  }

  if (!lineUserId || !Array.isArray(billIds) || billIds.length === 0) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 })
  }

  const driver = await prisma.user.findUnique({ where: { lineUserId } })
  if (!driver) {
    return NextResponse.json({ error: "ไม่พบข้อมูลพนักงาน" }, { status: 404 })
  }

  // ทำใน transaction พร้อมเงื่อนไข driverId: null เพื่อกันการแย่งบิลที่คนอื่นรับไปแล้ว
  const claimedIds = await prisma.$transaction(async (tx) => {
    const claimable = await tx.bill.findMany({
      where: { id: { in: billIds }, driverId: null },
      select: { id: true },
    })
    const ids = claimable.map(b => b.id)
    if (ids.length === 0) return ids

    await tx.bill.updateMany({
      where: { id: { in: ids } },
      data: { driverId: driver.id },
    })
    await tx.billStatusHistory.createMany({
      data: ids.map(billId => ({
        billId,
        status: "RECEIVED" as const,
        note: "รับบิล",
        updatedBy: driver.id,
      })),
    })
    return ids
  })

  return NextResponse.json({
    claimed: claimedIds.length,
    skipped: billIds.length - claimedIds.length,
  })
}
