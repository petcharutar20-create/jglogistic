import { prisma } from "@/lib/prisma"
import { createBillWithDailyNumber } from "@/lib/bill-number"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lineUserId = searchParams.get("lineUserId")

  if (!lineUserId) {
    return NextResponse.json({ error: "lineUserId is required" }, { status: 400 })
  }

  const driver = await prisma.user.findUnique({ where: { lineUserId } })
  if (!driver) {
    return NextResponse.json({ error: "ไม่พบข้อมูลพนักงาน กรุณาล็อกอินผ่านเว็บก่อน" }, { status: 404 })
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const bills = await prisma.bill.findMany({
    where: {
      driverId: driver.id,
      OR: [
        { status: { not: "COMPLETED" } },
        { billDate: { gte: todayStart } },
      ],
    },
    select: {
      id: true,
      billNumber: true,
      status: true,
      destination: true,
      origin: true,
      description: true,
      billDate: true,
    },
    orderBy: [{ status: "asc" }, { billNumber: "desc" }],
  })

  return NextResponse.json(bills)
}

export async function POST(request: Request) {
  const { lineUserId, vehicleId, destination, billDate } = await request.json() as {
    lineUserId: string
    vehicleId?: string
    destination: string
    billDate?: string
  }

  if (!lineUserId || !destination) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 })
  }

  const driver = await prisma.user.findUnique({ where: { lineUserId } })
  if (!driver) {
    return NextResponse.json({ error: "ไม่พบข้อมูลพนักงาน" }, { status: 404 })
  }

  const billDateObj = billDate ? new Date(billDate) : new Date()

  const bill = await createBillWithDailyNumber(billDateObj, ({ billDay, dailyNumber }) =>
    prisma.bill.create({
      data: {
        billDay,
        dailyNumber,
        destination,
        vehicleId: vehicleId || null,
        driverId: driver.id,
        status: "RECEIVED",
        billDate: billDateObj,
      },
      select: {
        id: true,
        billNumber: true,
        dailyNumber: true,
        status: true,
        destination: true,
        origin: true,
        description: true,
      },
    })
  )

  await prisma.billStatusHistory.create({
    data: { billId: bill.id, status: "RECEIVED", updatedBy: driver.id },
  })

  return NextResponse.json(bill, { status: 201 })
}
