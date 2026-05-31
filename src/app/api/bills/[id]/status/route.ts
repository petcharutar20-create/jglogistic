import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { BILL_STATUS_ORDER } from "@/lib/constants"
import { notifyCustomer } from "@/lib/line"
import type { BillStatus } from "@/generated/prisma/enums"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { status, note } = await request.json() as { status: BillStatus; note?: string }

  const bill = await prisma.bill.findUnique({ where: { id }, include: { customer: true } })
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const isAdmin = session.user.role === "ADMIN"
  const isAssignedDriver = session.user.id === bill.driverId
  if (!isAdmin && !isAssignedDriver) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const currentIndex = BILL_STATUS_ORDER.indexOf(bill.status)
  const nextIndex = BILL_STATUS_ORDER.indexOf(status)
  if (nextIndex !== currentIndex + 1) {
    return NextResponse.json({ error: "Invalid status transition" }, { status: 400 })
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
      data: { billId: id, status, note, updatedBy: session.user.id },
    }),
  ])

  if (bill.customer?.lineUserId) {
    await notifyCustomer(bill.customer.lineUserId, bill.billNumber, status).catch(() => null)
  }

  return NextResponse.json(updatedBill)
}
