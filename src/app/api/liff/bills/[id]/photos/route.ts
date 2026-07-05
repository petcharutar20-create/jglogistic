import { prisma } from "@/lib/prisma"
import { uploadToDrive } from "@/lib/google-drive"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const form = await request.formData()
  const lineUserId = form.get("lineUserId") as string
  const files = form.getAll("files") as File[]

  if (!lineUserId || files.length === 0) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 })
  }

  const driver = await prisma.user.findUnique({ where: { lineUserId } })
  if (!driver) {
    return NextResponse.json({ error: "ไม่พบข้อมูลพนักงาน" }, { status: 404 })
  }

  const bill = await prisma.bill.findUnique({ where: { id } })
  if (!bill) {
    return NextResponse.json({ error: "ไม่พบบิล" }, { status: 404 })
  }

  if (bill.driverId !== driver.id) {
    return NextResponse.json({ error: "คุณไม่ได้รับมอบหมายบิลนี้" }, { status: 403 })
  }

  const uploaded = await Promise.all(
    files.map((file) => uploadToDrive(file, bill.billNumber, bill.billDate))
  )

  const photos = await prisma.deliveryPhoto.createManyAndReturn({
    data: uploaded.map((u) => ({
      billId: id,
      googleDriveId: u.id,
      url: u.url,
      filename: u.filename,
    })),
  })

  return NextResponse.json(photos)
}
