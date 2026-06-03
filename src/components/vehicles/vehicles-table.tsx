"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Pencil, Truck } from "lucide-react"
import { toast } from "sonner"
import type { VehicleModel } from "@/generated/prisma/models"

export function VehiclesTable({ vehicles }: { vehicles: VehicleModel[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<VehicleModel | null>(null)
  const [loading, setLoading] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  function openAdd() {
    setEditing(null)
    setOpen(true)
  }

  function openEdit(vehicle: VehicleModel) {
    setEditing(vehicle)
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const body = {
      plateNumber: form.get("plateNumber") as string,
      type: form.get("type") as string,
      brand: form.get("brand") as string,
    }

    try {
      const url = editing ? `/api/vehicles/${editing.id}` : "/api/vehicles"
      const method = editing ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "เกิดข้อผิดพลาด")
        return
      }

      toast.success(editing ? "แก้ไขข้อมูลสำเร็จ" : "เพิ่มรถสำเร็จ")
      setOpen(false)
      router.refresh()
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่")
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(vehicle: VehicleModel) {
    setToggling(vehicle.id)
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !vehicle.isActive }),
      })
      if (!res.ok) throw new Error()
      toast.success(vehicle.isActive ? "ปิดการใช้งานรถแล้ว" : "เปิดการใช้งานรถแล้ว")
      router.refresh()
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่")
    } finally {
      setToggling(null)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">รถขนส่ง</h1>
          <p className="text-sm text-muted-foreground mt-1">{vehicles.length} คัน</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" />
          เพิ่มรถ
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">ทะเบียน</th>
              <th className="text-left px-4 py-3 font-medium">ประเภท</th>
              <th className="text-left px-4 py-3 font-medium">ยี่ห้อ</th>
              <th className="text-left px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">
                  ยังไม่มีรถขนส่ง
                </td>
              </tr>
            )}
            {vehicles.map((v) => (
              <tr key={v.id} className="border-t hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    {v.plateNumber}
                  </div>
                </td>
                <td className="px-4 py-3">{v.type}</td>
                <td className="px-4 py-3 text-muted-foreground">{v.brand ?? "-"}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(v)}
                    disabled={toggling === v.id}
                    className="cursor-pointer"
                  >
                    <Badge
                      className={
                        v.isActive
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      }
                    >
                      {toggling === v.id
                        ? "..."
                        : v.isActive
                          ? "ใช้งานได้"
                          : "ไม่ใช้งาน"}
                    </Badge>
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(v)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "แก้ไขข้อมูลรถ" : "เพิ่มรถใหม่"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="plateNumber">ทะเบียนรถ *</Label>
              <Input
                id="plateNumber"
                name="plateNumber"
                required
                defaultValue={editing?.plateNumber ?? ""}
                placeholder="กข 1234 กรุงเทพมหานคร"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">ประเภทรถ *</Label>
              <Input
                id="type"
                name="type"
                required
                defaultValue={editing?.type ?? ""}
                placeholder="รถกระบะ / รถสิบล้อ / รถตู้"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand">ยี่ห้อ</Label>
              <Input
                id="brand"
                name="brand"
                defaultValue={editing?.brand ?? ""}
                placeholder="Isuzu / Toyota / Hino"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                ยกเลิก
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
