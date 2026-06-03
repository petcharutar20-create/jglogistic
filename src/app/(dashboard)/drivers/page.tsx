import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DriversTable } from "@/components/drivers/drivers-table"

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
      <DriversTable drivers={drivers} />
    </div>
  )
}
