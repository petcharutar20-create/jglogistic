import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { VehiclesTable } from "@/components/vehicles/vehicles-table"

export default async function VehiclesPage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") redirect("/dashboard")

  const vehicles = await prisma.vehicle.findMany({ orderBy: { plateNumber: "asc" } })

  return (
    <div className="space-y-6">
      <VehiclesTable vehicles={vehicles} />
    </div>
  )
}
