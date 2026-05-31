import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default async function DriversPage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") redirect("/dashboard")

  const drivers = await prisma.user.findMany({
    where: { role: "DRIVER" },
    orderBy: { name: "asc" },
    include: { _count: { select: { bills: true } } },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">พนักงานขนส่ง</h1>
        <p className="text-sm text-muted-foreground mt-1">{drivers.length} คน</p>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">ชื่อ</th>
              <th className="text-left px-4 py-3 font-medium">เบอร์โทร</th>
              <th className="text-left px-4 py-3 font-medium">Line</th>
              <th className="text-left px-4 py-3 font-medium">จำนวนบิล</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-muted-foreground">
                  ยังไม่มีพนักงาน
                </td>
              </tr>
            )}
            {drivers.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={d.image ?? undefined} />
                      <AvatarFallback>{d.name?.[0] ?? "?"}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{d.name ?? "-"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{d.phone ?? "-"}</td>
                <td className="px-4 py-3">
                  <Badge className={d.lineUserId ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}>
                    {d.lineUserId ? "เชื่อมต่อแล้ว" : "ยังไม่เชื่อมต่อ"}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-medium">{d._count.bills}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
