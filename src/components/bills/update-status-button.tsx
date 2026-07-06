"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BILL_STATUS_LABELS } from "@/lib/constants"
import type { BillStatus } from "@/generated/prisma/enums"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

interface UpdateStatusButtonProps {
  billId: string
  nextStatus: BillStatus
}

export function UpdateStatusButton({ billId, nextStatus }: UpdateStatusButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleUpdate() {
    setLoading(true)
    try {
      const res = await fetch(`/api/bills/${billId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) throw new Error()
      toast.success(`อัปเดตสถานะเป็น "${BILL_STATUS_LABELS[nextStatus]}" แล้ว`)
      router.refresh()
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleUpdate} disabled={loading} size="lg" className="w-full sm:w-auto text-base">
      <ArrowRight className="h-5 w-5 mr-1" />
      {loading ? "กำลังอัปเดต..." : `ดำเนินการต่อ: ${BILL_STATUS_LABELS[nextStatus]}`}
    </Button>
  )
}
