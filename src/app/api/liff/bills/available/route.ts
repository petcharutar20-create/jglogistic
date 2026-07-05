import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// รายการบิลที่ยังไม่มีคนขับ (pool ว่าง) ของวันที่เลือก ให้คนขับเลือกรับ
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lineUserId = searchParams.get("lineUserId")
  const date = searchParams.get("date")

  if (!lineUserId || !date) {
    return NextResponse.json({ error: "lineUserId และ date จำเป็นต้องระบุ" }, { status: 400 })
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "รูปแบบวันที่ไม่ถูกต้อง" }, { status: 400 })
  }

  const driver = await prisma.user.findUnique({ where: { lineUserId } })
  if (!driver) {
    return NextResponse.json({ error: "ไม่พบข้อมูลพนักงาน กรุณาล็อกอินผ่านเว็บก่อน" }, { status: 404 })
  }

  // billDate เก็บเป็นเที่ยงคืน UTC ของวันที่บิล — สร้างขอบเขตเป็น UTC midnight ให้ตรงกัน
  const [y, m, d] = date.split("-").map(Number)
  const dayStart = new Date(Date.UTC(y, m - 1, d))
  const nextDayStart = new Date(dayStart)
  nextDayStart.setUTCDate(nextDayStart.getUTCDate() + 1)

  const bills = await prisma.bill.findMany({
    where: {
      driverId: null,
      billDate: { gte: dayStart, lt: nextDayStart },
    },
    select: {
      id: true,
      billNumber: true,
      dailyNumber: true,
      status: true,
      destination: true,
      origin: true,
      description: true,
      billDate: true,
    },
    orderBy: [{ billNumber: "asc" }],
  })

  return NextResponse.json(bills)
}
