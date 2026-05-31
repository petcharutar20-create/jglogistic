import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CreateBillForm } from "@/components/bills/create-bill-form"

export default async function NewBillPage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") redirect("/dashboard")

  const [vehicles, drivers, customers] = await Promise.all([
    prisma.vehicle.findMany({ where: { isActive: true }, orderBy: { plateNumber: "asc" } }),
    prisma.user.findMany({ where: { role: "DRIVER" }, orderBy: { name: "asc" } }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
  ])

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">สร้างบิลใหม่</h1>
        <p className="text-sm text-muted-foreground mt-1">กรอกข้อมูลบิลขนส่ง</p>
      </div>
      <CreateBillForm vehicles={vehicles} drivers={drivers} customers={customers} />
    </div>
  )
}
