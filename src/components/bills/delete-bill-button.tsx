"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

export function DeleteBillButton({ billId, billNumber }: { billId: string; billNumber: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/bills/${billId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success(`ลบบิล #${billNumber} สำเร็จ`)
      router.push("/bills")
      router.refresh()
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่")
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
        <Trash2 className="h-4 w-4 mr-1" />
        ลบบิล
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบบิล #{billNumber}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            บิลและข้อมูลทั้งหมดจะถูกลบถาวร ไม่สามารถกู้คืนได้
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="destructive" disabled={loading} onClick={handleDelete}>
              {loading ? "กำลังลบ..." : "ยืนยันลบ"}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
