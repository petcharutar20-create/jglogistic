import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createBillWithDailyNumber } from "@/lib/bill-number"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { destination, origin, description, vehicleId, driverId, customerId, billDate } =
    await request.json()

  if (!destination) {
    return NextResponse.json({ error: "destination is required" }, { status: 400 })
  }

  const billDateObj = billDate ? new Date(billDate) : new Date()

  const bill = await createBillWithDailyNumber(billDateObj, ({ billDay, dailyNumber }) =>
    prisma.bill.create({
      data: {
        billDay,
        dailyNumber,
        destination,
        origin: origin || null,
        description: description || null,
        vehicleId: vehicleId || null,
        driverId: driverId || null,
        customerId: customerId || null,
        billDate: billDateObj,
        statusHistory: {
          create: { status: "RECEIVED", updatedBy: session.user.id },
        },
      },
    })
  )

  return NextResponse.json(bill, { status: 201 })
}
