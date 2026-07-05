import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { BILL_STATUS_ORDER } from "@/lib/constants"
import { notifyCustomer } from "@/lib/line"
import type { BillStatus } from "@/generated/prisma/enums"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { lineUserId, status } = await request.json() as { lineUserId: string; status: BillStatus }

  if (!lineUserId || !status) {
    return NextResponse.json({ error: "lineUserId and status are required" }, { status: 400 })
  }

  const driver = await prisma.user.findUnique({ where: { lineUserId } })
  if (!driver) {
    return NextResponse.json({ error: "ไม่พบข้อมูลพนักงาน" }, { status: 404 })
  }

  const bill = await prisma.bill.findUnique({ where: { id }, include: { customer: true } })
  if (!bill) {
    return NextResponse.json({ error: "ไม่พบบิล" }, { status: 404 })
  }

  if (bill.driverId !== driver.id) {
    return NextResponse.json({ error: "คุณไม่ได้รับมอบหมายบิลนี้" }, { status: 403 })
  }

  const currentIndex = BILL_STATUS_ORDER.indexOf(bill.status)
  const nextIndex = BILL_STATUS_ORDER.indexOf(status)
  if (nextIndex !== currentIndex + 1) {
    return NextResponse.json({ error: "ไม่สามารถเปลี่ยนสถานะได้" }, { status: 400 })
  }

  const [updatedBill] = await prisma.$transaction([
    prisma.bill.update({
      where: { id },
      data: {
        status,
        ...(status === "COMPLETED" ? { completedAt: new Date() } : {}),
      },
    }),
    prisma.billStatusHistory.create({
      data: { billId: id, status, updatedBy: driver.id },
    }),
  ])

  if (bill.customer?.lineUserId) {
    await notifyCustomer(bill.customer.lineUserId, bill.billNumber, status).catch(() => null)
  }

  return NextResponse.json(updatedBill)
}
