import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { uploadToDrive } from "@/lib/google-drive"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const bill = await prisma.bill.findUnique({ where: { id } })
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const isAdmin = session.user.role === "ADMIN"
  const isAssignedDriver = session.user.id === bill.driverId
  if (!isAdmin && !isAssignedDriver) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const form = await request.formData()
  const files = form.getAll("files") as File[]

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 })
  }

  const uploaded = await Promise.all(
    files.map((file) => uploadToDrive(file, bill.billNumber))
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
