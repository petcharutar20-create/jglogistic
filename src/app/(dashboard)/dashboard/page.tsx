import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, CheckCircle, Clock } from "lucide-react"
import { BILL_STATUS_LABELS, BILL_STATUS_COLORS } from "@/lib/constants"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()
  const isAdmin = session?.user?.role === "ADMIN"

  const whereClause = isAdmin ? {} : { driverId: session?.user?.id }

  const [total, completed, inProgress, recentBills] = await Promise.all([
    prisma.bill.count({ where: whereClause }),
    prisma.bill.count({ where: { ...whereClause, status: "COMPLETED" } }),
    prisma.bill.count({
      where: { ...whereClause, status: { not: "COMPLETED" } },
    }),
    prisma.bill.findMany({
      where: whereClause,
      orderBy: { billNumber: "desc" },
      take: 10,
      include: { vehicle: true, driver: true, customer: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">แดชบอร์ด</h1>
        <p className="text-muted-foreground text-sm mt-1">
          ภาพรวมระบบขนส่ง บริษัท จตุรโชคกรุ๊ป จำกัด
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">บิลทั้งหมด</CardTitle>
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
          <CardTitle className="text-base">บิลล่าสุด</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentBills.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                ยังไม่มีบิล
              </p>
            )}
            {recentBills.map((bill) => (
              <Link
                key={bill.id}
                href={`/bills/${bill.id}`}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-bold">
                    {bill.billNumber}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{bill.destination}</p>
                    <p className="text-xs text-muted-foreground">
                      {bill.vehicle?.plateNumber ?? "ยังไม่กำหนดรถ"} •{" "}
                      {bill.driver?.name ?? "ยังไม่กำหนดพนักงาน"}
                    </p>
                  </div>
                </div>
                <Badge className={BILL_STATUS_COLORS[bill.status]}>
                  {BILL_STATUS_LABELS[bill.status]}
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
