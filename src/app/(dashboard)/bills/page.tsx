import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BILL_STATUS_LABELS, BILL_STATUS_COLORS } from "@/lib/constants"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function BillsPage() {
  const session = await auth()
  const isAdmin = session?.user?.role === "ADMIN"
  const whereClause = isAdmin ? {} : { driverId: session?.user?.id }

  const bills = await prisma.bill.findMany({
    where: whereClause,
    orderBy: { billNumber: "desc" },
    include: { vehicle: true, driver: true, customer: true },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">บิลขนส่ง</h1>
          <p className="text-sm text-muted-foreground mt-1">
            รายการบิลทั้งหมด {bills.length} บิล
          </p>
        </div>
        {isAdmin && (
          <Button nativeButton={false} render={<Link href="/bills/new" />}>
            <Plus className="h-4 w-4 mr-1" />
            สร้างบิลใหม่
          </Button>
        )}
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">เลขบิล</th>
              <th className="text-left px-4 py-3 font-medium">ปลายทาง</th>
              <th className="text-left px-4 py-3 font-medium">รถ</th>
              <th className="text-left px-4 py-3 font-medium">พนักงาน</th>
              <th className="text-left px-4 py-3 font-medium">สถานะ</th>
              <th className="text-left px-4 py-3 font-medium">วันที่</th>
            </tr>
          </thead>
          <tbody>
            {bills.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  ยังไม่มีบิล
                </td>
              </tr>
            )}
            {bills.map((bill) => (
              <tr key={bill.id} className="border-t hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/bills/${bill.id}`} className="font-bold hover:underline">
                    #{bill.dailyNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div>{bill.destination}</div>
                  {bill.origin && (
                    <div className="text-xs text-muted-foreground">จาก: {bill.origin}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {bill.vehicle?.plateNumber ?? "-"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {bill.driver?.name ?? "-"}
                </td>
                <td className="px-4 py-3">
                  <Badge className={BILL_STATUS_COLORS[bill.status]}>
                    {BILL_STATUS_LABELS[bill.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {bill.createdAt.toLocaleDateString("th-TH")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
