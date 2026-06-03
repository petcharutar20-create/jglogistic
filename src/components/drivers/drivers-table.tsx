"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Plus, Pencil } from "lucide-react"
import { toast } from "sonner"
import type { UserModel } from "@/generated/prisma/models"

type Driver = UserModel & { _count: { bills: number } }

export function DriversTable({ drivers }: { drivers: Driver[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Driver | null>(null)
  const [loading, setLoading] = useState(false)

  function openAdd() {
    setEditing(null)
    setOpen(true)
  }

  function openEdit(driver: Driver) {
    setEditing(driver)
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const body = {
      name: form.get("name") as string,
      email: form.get("email") as string,
      phone: form.get("phone") as string,
    }

    try {
      const url = editing ? `/api/drivers/${editing.id}` : "/api/drivers"
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

      toast.success(editing ? "แก้ไขข้อมูลสำเร็จ" : "เพิ่มพนักงานสำเร็จ")
      setOpen(false)
      router.refresh()
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">พนักงานขนส่ง</h1>
          <p className="text-sm text-muted-foreground mt-1">{drivers.length} คน</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" />
          เพิ่มพนักงาน
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">ชื่อ</th>
              <th className="text-left px-4 py-3 font-medium">เบอร์โทร</th>
              <th className="text-left px-4 py-3 font-medium">อีเมล</th>
              <th className="text-left px-4 py-3 font-medium">Line</th>
              <th className="text-left px-4 py-3 font-medium">จำนวนบิล</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  ยังไม่มีพนักงาน
                </td>
              </tr>
            )}
            {drivers.map((d) => (
              <tr key={d.id} className="border-t hover:bg-muted/30 transition-colors">
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
                <td className="px-4 py-3 text-muted-foreground">{d.email ?? "-"}</td>
                <td className="px-4 py-3">
                  <Badge
                    className={
                      d.lineUserId
                        ? "bg-green-100 text-green-700"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {d.lineUserId ? "เชื่อมต่อแล้ว" : "ยังไม่เชื่อมต่อ"}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-medium">{d._count.bills}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(d)}
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
            <DialogTitle>{editing ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">ชื่อ *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={editing?.name ?? ""}
                placeholder="ชื่อ-นามสกุล"
              />
            </div>
            {!editing && (
              <div className="space-y-1.5">
                <Label htmlFor="email">อีเมล *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="example@email.com"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={editing?.phone ?? ""}
                placeholder="08xxxxxxxx"
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
