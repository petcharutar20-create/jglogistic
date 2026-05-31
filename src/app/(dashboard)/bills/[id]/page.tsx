import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusStepper } from "@/components/bills/status-stepper"
import { UpdateStatusButton } from "@/components/bills/update-status-button"
import { PhotoUpload } from "@/components/bills/photo-upload"
import { BILL_STATUS_LABELS, BILL_STATUS_COLORS, BILL_STATUS_ORDER } from "@/lib/constants"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"


export default async function BillDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await auth()

  const bill = await prisma.bill.findUnique({
    where: { id },
    include: {
      vehicle: true,
      driver: true,
      customer: true,
      statusHistory: { orderBy: { createdAt: "asc" }, include: { user: true } },
      photos: true,
    },
  })

  if (!bill) notFound()

  const isAdmin = session?.user?.role === "ADMIN"
  const isAssignedDriver = session?.user?.id === bill.driverId
  const canUpdateStatus = isAdmin || isAssignedDriver
  const isCompleted = bill.status === "COMPLETED"
  const nextStatus = BILL_STATUS_ORDER[BILL_STATUS_ORDER.indexOf(bill.status) + 1]

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/bills" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">บิล #{bill.billNumber}</h1>
          <Badge className={`mt-1 ${BILL_STATUS_COLORS[bill.status]}`}>
            {BILL_STATUS_LABELS[bill.status]}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">สถานะการจัดส่ง</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <StatusStepper currentStatus={bill.status} />
          {canUpdateStatus && !isCompleted && nextStatus && (
            <div className="mt-6">
              <UpdateStatusButton billId={bill.id} nextStatus={nextStatus} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายละเอียดบิล</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <Row label="ปลายทาง" value={bill.destination} />
          {bill.origin && <Row label="ต้นทาง" value={bill.origin} />}
          {bill.description && <Row label="รายละเอียดสินค้า" value={bill.description} />}
          <Row label="รถขนส่ง" value={bill.vehicle?.plateNumber ?? "-"} />
          <Row label="พนักงานขนส่ง" value={bill.driver?.name ?? "-"} />
          {bill.customer && <Row label="ลูกค้า" value={bill.customer.name} />}
          <Row label="วันที่สร้าง" value={bill.createdAt.toLocaleDateString("th-TH")} />
          {bill.completedAt && (
            <Row label="วันที่เสร็จสิ้น" value={bill.completedAt.toLocaleDateString("th-TH")} />
          )}
        </CardContent>
      </Card>

      {(bill.status === "COMPLETED" || bill.photos.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">รูปภาพหลักฐานการจัดส่ง</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bill.photos.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {bill.photos.map((photo) => (
                  <a
                    key={photo.id}
                    href={photo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg overflow-hidden border hover:opacity-90 transition-opacity"
                  >
                    <Image
                      src={photo.url}
                      alt={photo.filename}
                      width={400}
                      height={300}
                      className="w-full object-cover aspect-video"
                    />
                  </a>
                ))}
              </div>
            )}
            {canUpdateStatus && bill.status === "COMPLETED" && (
              <PhotoUpload billId={bill.id} />
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ประวัติสถานะ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bill.statusHistory.map((h) => (
              <div key={h.id} className="flex items-start gap-3 text-sm">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                <div>
                  <p className="font-medium">{BILL_STATUS_LABELS[h.status]}</p>
                  <p className="text-xs text-muted-foreground">
                    {h.user?.name ?? "ระบบ"} •{" "}
                    {h.createdAt.toLocaleString("th-TH")}
                  </p>
                  {h.note && <p className="text-xs mt-0.5">{h.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground w-36 shrink-0">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
