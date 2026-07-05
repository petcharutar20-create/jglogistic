import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, CheckCircle, Clock } from "lucide-react"
import { StatusStepper } from "@/components/bills/status-stepper"
import { UpdateStatusButton } from "@/components/bills/update-status-button"
import { DateFilter } from "@/components/dashboard/date-filter"
import { AutoRefresh } from "@/components/dashboard/auto-refresh"
import { BILL_STATUS_ORDER } from "@/lib/constants"
import Link from "next/link"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date } = await searchParams
  const session = await auth()
  const isAdmin = session?.user?.role === "ADMIN"

  const whereClause = isAdmin ? {} : { driverId: session?.user?.id }

  // วันปัจจุบันตามเวลาไทย (UTC+7 คงที่) ในรูปแบบ YYYY-MM-DD
  const nowBkk = new Date(new Date().getTime() + 7 * 60 * 60 * 1000)
  const today = nowBkk.toISOString().split("T")[0]

  // รับวันที่จาก query (?date=YYYY-MM-DD) — ถ้าไม่ถูกต้องหรือเป็นอนาคต ใช้วันนี้
  const isValidDate = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
  const selectedDate = isValidDate && date <= today ? date : today
  const isToday = selectedDate === today

  // billDate ถูกเก็บเป็นเที่ยงคืน UTC ของวันที่บิล — สร้างขอบเขตเป็น UTC midnight ให้ตรงกัน
  const [y, m, d] = selectedDate.split("-").map(Number)
  const dayStart = new Date(Date.UTC(y, m - 1, d))
  const nextDayStart = new Date(dayStart)
  nextDayStart.setUTCDate(nextDayStart.getUTCDate() + 1)

  const dayFilter = {
    ...whereClause,
    billDate: { gte: dayStart, lt: nextDayStart },
  }

  const [total, completed, recentBills] = await Promise.all([
    prisma.bill.count({ where: dayFilter }),
    prisma.bill.count({ where: { ...dayFilter, status: "COMPLETED" } }),
    prisma.bill.findMany({
      where: dayFilter,
      orderBy: { billNumber: "desc" },
      include: { vehicle: true, driver: true, customer: true },
    }),
  ])
  const inProgress = total - completed

  const dateLabel = dayStart.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">แดชบอร์ด</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isToday ? "ภาพรวมระบบขนส่งวันนี้" : "ข้อมูลย้อนหลัง"} ({dateLabel}) บริษัท จตุรโชคกรุ๊ป จำกัด
          </p>
        </div>
        <DateFilter selectedDate={selectedDate} today={today} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">จำนวนบิล</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">กำลังดำเนินการ</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">เสร็จสิ้นแล้ว</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{completed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายการบิล</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentBills.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isToday ? "วันนี้ยังไม่มีบิล" : "ไม่มีบิลในวันที่เลือก"}
              </p>
            )}
            {recentBills.map((bill) => {
              const canUpdate = isAdmin || bill.driverId === session?.user?.id
              const nextStatus =
                BILL_STATUS_ORDER[BILL_STATUS_ORDER.indexOf(bill.status) + 1]

              return (
                <div key={bill.id} className="rounded-lg border p-3 space-y-3">
                  <Link
                    href={`/bills/${bill.id}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
                      {bill.dailyNumber}
                    </div>
                    <div>
                      <p className="text-sm font-medium group-hover:underline">{bill.destination}</p>
                      <p className="text-xs text-muted-foreground">
                        {bill.vehicle?.plateNumber ?? "ยังไม่กำหนดรถ"} •{" "}
                        {bill.driver?.name ?? "ยังไม่กำหนดพนักงาน"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {bill.billDate.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </Link>
                  <StatusStepper currentStatus={bill.status} compact />
                  {canUpdate && nextStatus && (
                    <UpdateStatusButton billId={bill.id} nextStatus={nextStatus} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
