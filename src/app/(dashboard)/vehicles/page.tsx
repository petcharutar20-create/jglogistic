import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Truck } from "lucide-react"

export default async function VehiclesPage() {
  const session = await auth()
  if (session?.user.role !== "ADMIN") redirect("/dashboard")

  const vehicles = await prisma.vehicle.findMany({ orderBy: { plateNumber: "asc" } })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">รถขนส่ง</h1>
        <p className="text-sm text-muted-foreground mt-1">{vehicles.length} คัน</p>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">ทะเบียน</th>
              <th className="text-left px-4 py-3 font-medium">ประเภท</th>
              <th className="text-left px-4 py-3 font-medium">ยี่ห้อ</th>
              <th className="text-left px-4 py-3 font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-muted-foreground">
                  ยังไม่มีรถขนส่ง
                </td>
              </tr>
            )}
            {vehicles.map((v) => (
              <tr key={v.id} className="border-t">
                <td className="px-4 py-3 font-medium flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  {v.plateNumber}
                </td>
                <td className="px-4 py-3">{v.type}</td>
                <td className="px-4 py-3 text-muted-foreground">{v.brand ?? "-"}</td>
                <td className="px-4 py-3">
                  <Badge className={v.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                    {v.isActive ? "ใช้งานได้" : "ไม่ใช้งาน"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
