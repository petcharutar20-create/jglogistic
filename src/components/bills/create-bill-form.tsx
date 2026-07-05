"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import type { VehicleModel, UserModel, CustomerModel } from "@/generated/prisma/models"

interface CreateBillFormProps {
  vehicles: VehicleModel[]
  drivers: UserModel[]
  customers: CustomerModel[]
}

export function CreateBillForm({ vehicles, drivers, customers }: CreateBillFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const data = Object.fromEntries(new FormData(e.currentTarget))

    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      const bill = await res.json()
      toast.success(`สร้างบิล #${bill.dailyNumber} สำเร็จ`)
      router.push(`/bills/${bill.id}`)
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="billDate">วันที่บิล *</Label>
            <Input
              id="billDate"
              name="billDate"
              type="date"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="destination">ปลายทาง *</Label>
              <Input id="destination" name="destination" required placeholder="ที่อยู่ปลายทาง" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="origin">ต้นทาง</Label>
              <Input id="origin" name="origin" placeholder="ที่อยู่ต้นทาง" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">รายละเอียดสินค้า</Label>
            <Input id="description" name="description" placeholder="ประเภท/จำนวนสินค้า" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>รถขนส่ง</Label>
              <Select name="vehicleId">
                <SelectTrigger>
                  <SelectValue placeholder="เลือกรถ" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.plateNumber} — {v.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>พนักงานขนส่ง</Label>
              <Select name="driverId">
                <SelectTrigger>
                  <SelectValue placeholder="เลือกพนักงาน" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>ลูกค้า</Label>
            <Select name="customerId">
              <SelectTrigger>
                <SelectValue placeholder="เลือกลูกค้า (ถ้ามี)" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "กำลังสร้าง..." : "สร้างบิล"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              ยกเลิก
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
