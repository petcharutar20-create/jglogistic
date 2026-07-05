"use client"

import { useCallback, useEffect, useState } from "react"

type Bill = {
  id: string
  billNumber: number
  destination: string
  origin: string | null
  description: string | null
}

export default function LiffSelectBillsPage() {
  const [lineUserId, setLineUserId] = useState("")
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0])
  const [bills, setBills] = useState<Bill[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const loadBills = useCallback(async (userId: string, date: string) => {
    setListLoading(true)
    try {
      const res = await fetch(`/api/liff/bills/available?lineUserId=${userId}&date=${date}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "เกิดข้อผิดพลาด")
      }
      setBills(await res.json())
      setSelectedIds(new Set())
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        const liff = (await import("@line/liff")).default
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
        if (!liff.isLoggedIn()) { liff.login(); return }
        const profile = await liff.getProfile()
        setLineUserId(profile.userId)
        await loadBills(profile.userId, selectedDate)
      } catch {
        setError("เกิดข้อผิดพลาด กรุณาลองใหม่")
      } finally {
        setLoading(false)
      }
    }
    init()
    // ตั้งใจรันครั้งเดียวตอน mount — การเปลี่ยนวันที่จัดการแยกใน onChange
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onDateChange(date: string) {
    setSelectedDate(date)
    if (lineUserId) loadBills(lineUserId, date)
  }

  function toggle(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelectedIds(prev =>
      prev.size === bills.length ? new Set() : new Set(bills.map(b => b.id))
    )
  }

  async function handleSubmit() {
    if (!lineUserId || submitting || selectedIds.size === 0) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/liff/bills/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineUserId, billIds: [...selectedIds] }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "เกิดข้อผิดพลาด")
      }
      const { skipped } = await res.json() as { claimed: number; skipped: number }
      if (skipped > 0) {
        alert(`มีบิล ${skipped} ใบถูกคนอื่นรับไปแล้ว กรุณาเลือกใหม่`)
        await loadBills(lineUserId, selectedDate)
        setSubmitting(false)
        return
      }
      window.location.href = "/liff"
    } catch (e) {
      alert(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  const today = new Date().toISOString().split("T")[0]

  // บังคับสีตัวอักษรใน input ให้ดำ กันโหมดมืดของ LINE WebView ทับสีจนจาง
  const fieldStyle: React.CSSProperties = {
    fontSize: 16,
    color: "#111827",
    WebkitTextFillColor: "#111827",
    colorScheme: "light",
  }

  const allSelected = bills.length > 0 && selectedIds.size === bills.length

  return (
    <div className="max-w-lg mx-auto pb-24">
      <div className="bg-green-600 text-white px-4 py-4 flex items-center gap-3">
        <a href="/liff" className="text-white text-xl px-1">←</a>
        <span className="text-base font-semibold">เลือกบิล</span>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label htmlFor="billDate" className="block text-sm font-medium text-gray-700 mb-1">
            วันที่บิล
          </label>
          <input
            id="billDate"
            type="date"
            value={selectedDate}
            max={today}
            onChange={e => onDateChange(e.target.value)}
            style={fieldStyle}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-gray-900"
          />
        </div>

        {bills.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              บิลว่าง {bills.length} ใบ
            </p>
            <button
              type="button"
              onClick={toggleAll}
              className="text-sm font-medium text-green-700"
            >
              {allSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
            </button>
          </div>
        )}

        {listLoading ? (
          <p className="text-center py-12 text-gray-400">กำลังโหลด...</p>
        ) : bills.length === 0 ? (
          <p className="text-center py-12 text-gray-400">ไม่มีบิลว่างสำหรับวันที่เลือก</p>
        ) : (
          <div className="space-y-2">
            {bills.map(bill => {
              const checked = selectedIds.has(bill.id)
              return (
                <button
                  key={bill.id}
                  type="button"
                  onClick={() => toggle(bill.id)}
                  className={`w-full text-left flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                    checked ? "border-green-600 bg-green-50" : "border-gray-200 bg-white"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${
                      checked ? "border-green-600 bg-green-600 text-white" : "border-gray-300 bg-white"
                    }`}
                  >
                    {checked && <span className="text-xs leading-none">✓</span>}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-gray-900">บิล #{bill.billNumber}</span>
                    <span className="block text-sm text-gray-500 mt-0.5">
                      {bill.origin ? `${bill.origin} → ` : ""}{bill.destination}
                    </span>
                    {bill.description && (
                      <span className="block text-xs text-gray-400 mt-0.5">{bill.description}</span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 max-w-lg mx-auto p-4 bg-white border-t border-gray-100">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || selectedIds.size === 0}
          className="w-full bg-green-600 text-white font-medium py-3 rounded-xl text-sm disabled:opacity-60 active:bg-green-700"
        >
          {submitting ? "กำลังรับบิล..." : `รับบิลที่เลือก (${selectedIds.size})`}
        </button>
      </div>
    </div>
  )
}
