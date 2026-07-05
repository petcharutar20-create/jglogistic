"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface DateFilterProps {
  /** วันที่ที่เลือกอยู่ ในรูปแบบ YYYY-MM-DD */
  selectedDate: string
  /** วันที่ปัจจุบัน (ไทย) ในรูปแบบ YYYY-MM-DD ใช้จำกัดไม่ให้เลือกอนาคต และปุ่ม "วันนี้" */
  today: string
}

function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().split("T")[0]
}

export function DateFilter({ selectedDate, today }: DateFilterProps) {
  const router = useRouter()

  function go(date: string) {
    if (date === today) {
      router.push("/dashboard")
    } else {
      router.push(`/dashboard?date=${date}`)
    }
  }

  const isToday = selectedDate === today

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label="วันก่อนหน้า"
        onClick={() => go(shiftDate(selectedDate, -1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Input
        type="date"
        value={selectedDate}
        max={today}
        className="w-auto"
        onChange={(e) => e.target.value && go(e.target.value)}
      />

      <Button
        variant="outline"
        size="icon"
        aria-label="วันถัดไป"
        disabled={isToday}
        onClick={() => go(shiftDate(selectedDate, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isToday && (
        <Button variant="secondary" size="sm" onClick={() => go(today)}>
          วันนี้
        </Button>
      )}
    </div>
  )
}
